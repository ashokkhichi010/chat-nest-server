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

    // await contactService.isContactExist(userId, contactUser);

    const { title, body: notificationBody } = textMessageReceived(name);
    // const { title, body } = textMessageReceived(name);
    // await pushNotification(contactUser, title, notificationBody);

    const connectionId = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const messageResult = await this.messageService.createMessage({ sender: userId, receiver: contactUser, message, connectionId });
    await this.contactService.updateLastMessage(userId, contactUser, messageResult);
    // sendMessageToClient(messageResult)
    let contacts1: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
    let messages1: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser, userId });

    let contacts2: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
    let messages2: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser: userId, userId: contactUser });

    [contacts1, messages1, contacts2, messages2] = await Promise.all([contacts1, messages1, contacts2, messages2])

    const callback = async (err: Error, res: any) => {
      if (res[0]?.success) {
        const updateMessage = {
          isReceived: true,
          receivedAt: new Date().toISOString(),
        }

        Object.assign(messageResult, updateMessage);
        let tempMsg: any = messageResult.save();
        let tempCon: any = this.contactService.updateLastMessage(userId, contactUser, messageResult);

        [tempMsg, tempCon] = await Promise.all([tempMsg, tempCon]);

        let contacts1: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
        let messages1: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser, userId });

        let contacts2: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
        let messages2: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser: userId, userId: contactUser });

        [contacts1, messages1, contacts2, messages2] = await Promise.all([contacts1, messages1, contacts2, messages2]);

        this.socketGateway.emitEvents(userId, 'notification', { messages: messages1, contacts: contacts1, contactUser }, null);
        this.socketGateway.emitEvents(contactUser, 'notification', { messages: messages2, contacts: contacts2, contactUser: userId }, null);
      }
    }

    const notification = textMessageReceived(name);
    this.socketGateway.emitEvents(contactUser, 'notification', { messages: messages2, contacts: contacts2, contactUser: userId, notification }, callback);

    return {
      message: "",
      data: {
        contacts: contacts1,
        messages: messages1
      }
    }
  }

  @Roles('user')
  @Delete(':contactUser/:messageId')
  async deleteMessage(
    @AuthUser() user: User,
    @Body() body: MessageListDto,
    @Headers() headers,
    @Param() params: { contactUser: Types.ObjectId, messageId: Types.ObjectId }
  ) {
    const userId = user._id;
    const { contactUser, messageId } = params;

    // await contactService.isContactExist(userId, contactUser);

    await this.messageService.deleteMessage(userId, contactUser, messageId);

    return {
      message: "messages.message.deleted"
    }
  }
}
