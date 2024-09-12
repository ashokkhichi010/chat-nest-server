import { Controller, Post, Body, Param, Headers, Delete, HttpCode } from '@nestjs/common';
import { MessageService } from './message.service';
import { Types } from 'mongoose';
import { Roles } from '../decorators/roles.decorator';
import { textMessageReceived } from '../utils/notification';
import { AuthUser } from '../decorators/user.decorator';
import { MessageListDto } from './dto/create-message.dto';
import { User } from '../users/users.entity';
import { ContactService } from '../contact/contact.service';
import { SocketGateway } from '../socket/socket.gateway';
import { getConnectionId } from '../utils/getConnectionId';
import { EmitEventDto } from 'src/socket/dto/create-socket.dto';

@Controller('chats')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
    private readonly socketGateway: SocketGateway
  ) { }

  @Roles('user')
  @Post(':contactUser/list')
  @HttpCode(200)
  async getMessages(
    @AuthUser() user: User,
    @Body() body: MessageListDto,
    @Param() params: { contactUser: Types.ObjectId }
  ) {
    const userId = user._id;
    const { contactUser } = params

    const connectionId = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    Object.assign(body, { userId, contactUser, connectionId });

    const results = await this.messageService.getMessages(body);

    return {
      message: "",
      data: results
    }
  }

  @Roles('user')
  @Post(':contactUser/send-message')
  async sendMessage(
    @AuthUser() user: User,
    @Body() body: { message: string },
    @Headers() headers,
    @Param() params: { contactUser: Types.ObjectId }
  ) {
    const { _id, name } = user;
    const userId = _id;
    const { contactUser } = params;
    const { message } = body;

    const connectionId = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const messageResult = await this.messageService.createMessage({ sender: userId, receiver: contactUser, message, connectionId });
    // await this.contactService.updateLastMessage(userId, contactUser, messageResult);

    let myContacts: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
    let myMessages: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser, userId });

    let friendsContacts: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
    let friendsMessages: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser: userId, userId: contactUser });

    [myContacts, myMessages, friendsContacts, friendsMessages] = await Promise.all([myContacts, myMessages, friendsContacts, friendsMessages])

    const callback = async (err: Error, res: any) => {
      if (res[0]?.success) {
        const updateMessage = {
          isReceived: true,
          receivedAt: new Date().toISOString(),
        }

        Object.assign(messageResult, updateMessage);
        let tempMsg: any = await messageResult.save();

        let myContacts: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
        let friendsContacts: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });

        [myContacts, friendsContacts] = await Promise.all([myContacts, friendsContacts]);

        const emitEventToSelf = new EmitEventDto();
        const emitEventToFriend = new EmitEventDto();

        emitEventToSelf.users = [userId]
        emitEventToSelf.event = 'message-received';
        emitEventToSelf.data = { message: messageResult.toObject(), contacts: myContacts };

        emitEventToFriend.users = [contactUser]
        emitEventToFriend.event = 'message-received';
        emitEventToFriend.data = { message: messageResult.toObject(), contacts: friendsContacts };

        this.socketGateway.emitEvents(emitEventToSelf);
        this.socketGateway.emitEvents(emitEventToFriend);
      }
    }

    const notification = textMessageReceived(name, message);

    const emitEventToFriend = new EmitEventDto();

    emitEventToFriend.users = [contactUser]
    emitEventToFriend.event = 'notification';
    emitEventToFriend.data = { messages: friendsMessages, contacts: friendsContacts, contactUser: userId, notification };

    this.socketGateway.emitEvents(emitEventToFriend, callback);

    return {
      message: "",
      data: {
        contacts: myContacts,
        messages: myMessages
      }
    }
  }

  @Roles('user')
  @Delete(':contactUser/:messageId')
  async deleteMessage(
    @AuthUser() user: User,
    @Param() params: { contactUser: Types.ObjectId, messageId: Types.ObjectId }
  ) {
    const userId = user._id;
    const { contactUser, messageId } = params;

    // await contactService.isContactExist(userId, contactUser);

    await this.messageService.deleteMessage(userId, contactUser, messageId);

    let contacts1: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
    let contacts2: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
    [contacts1, contacts2] = await Promise.all([contacts1, contacts2]);

    const emitEventToFriend = new EmitEventDto();

    emitEventToFriend.users = [contactUser]
    emitEventToFriend.event = 'message-deleted';
    emitEventToFriend.data = { messageId, contacts: contacts2 };

    this.socketGateway.emitEvents(emitEventToFriend);

    return {
      message: "messages.message.deleted",
      data: { messageId, contacts: contacts1 }
    }
  }
}
