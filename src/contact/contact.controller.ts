import { Body, Controller, Get, HttpCode, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContactService } from './contact.service';
import { UsersService } from '../users/users.service';
import { Roles } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/user.decorator';
import { User } from '../users/users.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { friendRequestAccepted, friendRequestReceived, friendRequestRejected, friendRequestSent } from '../utils/notification';
import { SocketGateway } from '../socket/socket.gateway';

@Controller('contacts')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly userService: UsersService,
    private readonly socketGateway: SocketGateway
  ) { }

  @Roles('user')
  @Post('list')
  @HttpCode(200)
  async getContacts(@AuthUser() user: User, @Body() body: PaginationQueryDto) {
    const userId: Types.ObjectId = user._id;

    const contacts = await this.contactService.getContacts({ userId, ...body });

    return {
      message: "message",
      data: contacts
    }
  }

  @Roles('user')
  @Get(':contactUser/send-request')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendRequest(@AuthUser() user: User, @Param() params: { contactUser: Types.ObjectId }) {
    const { _id, name } = user;

    const userId: Types.ObjectId = _id;
    const contactUser: Types.ObjectId = params.contactUser;

    const contactUserInfo = await this.userService.getUserById(contactUser);
    await this.contactService.sendRequest(userId, contactUser);

    let users1: any = this.userService.getUsers({ userId, limit: 100, page: 1 });
    let users2: any = this.userService.getUsers({ userId: contactUser, limit: 100, page: 1 });

    [users1, users2] = await Promise.all([users1, users2]);

    const notification = friendRequestReceived(name);
    // await pushNotification(contactUser, title, body);
    await this.socketGateway.emitEvents(contactUser, 'notification', { notification, users: users2 }, null)

    return {
      message: friendRequestSent(contactUserInfo.name),
      data: { users: users1 },
    }
  }

  @Roles('user')
  @Get(':contactUser/accept')
  @UsePipes(new ValidationPipe({ transform: true }))
  async acceptRequest(@AuthUser() user: User, @Param('contactUser') contactUser: Types.ObjectId) {
    // const { contactUser } = params;
    const { _id, name, email } = user;
    const userId = _id;

    await this.contactService.acceptRequest(userId, contactUser);

    let users1: any = this.userService.getUsers({ userId, limit: 100, page: 1 });
    let users2: any = this.userService.getUsers({ userId: contactUser, limit: 100, page: 1 });

    let contacts1: any = this.contactService.getContacts({ userId, limit: 100, page: 1 });
    let contacts2: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1 });

    [users1, users2, contacts1, contacts2] = await Promise.all([users1, users2, contacts1, contacts2]);

    const notification = friendRequestAccepted(name);
    this.socketGateway.emitEvents(contactUser, 'notification', { notification, users: users2, contacts: contacts2 }, null)

    // await clientServerConnectionService.emitEventToClient(
    //   contactUser,
    //   'request accepted',
    //   emitEvent,
    //   { message: body, contactUser: userId },
    //   async (error, res) => {
    //     if (error) {
    //       await pushNotification(contactUser, title, body);
    //       console.log('🚀 ~ file: contact.controller.js:65 ~ error:', error);
    //     } else if (res[0] && res[0].success) {
    //       console.log('🚀 ~ file: contact.controller.js:67 ~ res:', res);
    //     }
    //   }
    // );

    return {
      message: "messages.REQUEST_ACCEPTED",
      data: {
        users: users1,
        contacts: contacts1,
      }
    }
  }

  @Roles('user')
  @Get(':contactUser/cancel')
  async cancelRequest(@AuthUser() user: User, @Param() params: { contactUser: Types.ObjectId }) {
    const { contactUser } = params;
    const { _id, name, email } = user;
    const userId = _id;

    await this.contactService.cancelRequest(userId, contactUser);

    let users1: any = this.userService.getUsers({ userId, limit: 100, page: 1 });
    let users2: any = this.userService.getUsers({ userId: contactUser, limit: 100, page: 1 });

    [users1, users2] = await Promise.all([users1, users2])

    // const notification = friendRequestAccepted(name);
    this.socketGateway.emitEvents(contactUser, 'notification', { users: users2 }, null)

    return {
      message: "messages.REQUEST_CANCELED",
      data: { users: users1 },
    }
  }

  @Roles('user')
  @Get(':contactUser/reject')
  async rejectRequest(@AuthUser() user: User, @Param() params: { contactUser: Types.ObjectId }) {
    const { contactUser } = params;
    const { _id, name, email } = user;
    const userId = _id;

    await this.contactService.rejectRequest(userId, contactUser);

    let users1: any = this.userService.getUsers({ userId, limit: 100, page: 1 });
    let users2: any = this.userService.getUsers({ userId: contactUser, limit: 100, page: 1 });

    [users1, users2] = await Promise.all([users1, users2])

    const notification = friendRequestRejected(name);
    // await pushNotification(contactUser, title, body);
    this.socketGateway.emitEvents(contactUser, 'notification', { notification, users: users2 }, null)

    return {
      message: "messages.REQUEST_REJECTED",
      data: { users: users1 },
    }
  }
}
