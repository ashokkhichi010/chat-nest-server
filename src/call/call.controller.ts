import { Controller, Get, Param, Headers } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { ContactService } from '../contact/contact.service';
import { AuthUser } from 'src/decorators/user.decorator';
import { User } from 'src/users/users.entity';
import mongoose, { Types } from 'mongoose';
import { getConnectionId } from 'src/utils/getConnectionId';
import { SocketGateway } from 'src/socket/socket.gateway';
import { CustomObjectId } from 'src/pipes/customObjectId.pipe';
import { UsersService } from 'src/users/users.service';
import * as moment from 'moment';
import { CallService } from './call.service';
import { CallS } from './entities/call.entity';

@Controller('call')
export class CallController {
  constructor(
    private readonly callService: CallService,
    private readonly contactService: ContactService,
    private readonly socketGateway: SocketGateway,
    private readonly userService: UsersService,
  ) { }

  @Roles('user')
  @Get('connect/:type/:contactUser')
  async getConnect(@AuthUser() user: User, @Headers() headers: any, @Param("contactUser", CustomObjectId) contactUser: Types.ObjectId, @Param() params: { type: string }) {
    const caller = user;
    const userId = caller._id;
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);
    // const { contactUser, type } = params;

    const connectionId: string = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const result: CallS = await this.callService.createCall(userId, contactUser, deviceId, params.type);
    const receiver = await this.userService.getUserById(contactUser);

    const timeOut = moment().add(60, 'seconds').toISOString();

    this.socketGateway.emitEvents(contactUser, 'call-request', { callData: { ...result.toObject(), caller, receiver, requestStatus: 'RECEIVED', timeOut } });

    return {
      message: "messages.call.request_sent",
      data: { ...result.toJSON(), caller, receiver, requestStatus: 'SENT', timeOut },
    }
  }

  @Roles('user')
  @Get('disconnect/:callId')
  async getDisConnect(@AuthUser() user: User, @Param("callId", CustomObjectId) callId: Types.ObjectId) {
    const userId = user._id;

    const result: CallS = await this.callService.disconnect(callId, userId);
    const { caller, receiver, disconnectedBy } = result;

    const secondPerson = disconnectedBy.toString() === caller.userId.toString() ? receiver : caller;

    this.socketGateway.emitEvents(secondPerson.userId, 'call-request', { callData: result.toObject() }, null);

    return {
      message: "messages.call.request_sent",
      data: result.toObject()
    }
  }

  @Roles('user')
  @Get(':callId/accept')
  async acceptCall(@AuthUser() user: User, @Headers() headers: any, @Param("callId", CustomObjectId) callId: Types.ObjectId) {
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

    const result: CallS = await this.callService.accept(callId, deviceId);

    const { caller, receiver } = result;
    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    const callerData = {
      ...result.toObject(),
      caller: tempCaller,
      receiver: tempReceiver,
      requestStatus: 'SENT',
    };

    this.socketGateway.emitEvents(caller.userId, 'call-request', { callData: callerData }, null, caller.deviceId);

    return {
      message: "messages.call.request_accepted",
      data: {
        ...result.toObject(),
        caller: tempCaller,
        receiver: tempReceiver,
        requestStatus: 'RECEIVED',
      },
    }
  }

  @Roles('user')
  @Get(':callId/cancel')
  async cancelConnection(@AuthUser() user: User, @Param("callId", CustomObjectId) callId: Types.ObjectId) {
    const result: CallS = await this.callService.cancel(callId);

    const { caller, receiver } = result;
    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    const callerData = {
      ...result.toObject(),
      caller: tempCaller,
      receiver: tempReceiver,
      requestStatus: 'RECEIVED',
    };

    this.socketGateway.emitEvents(receiver.userId, 'call-request', { callData: callerData }, null, receiver.deviceId);

    return {
      message: "messages.call.request_canceled",
      data: {
        ...result.toObject(),
        caller: tempCaller,
        receiver: tempReceiver,
        requestStatus: 'SENT',
      },
    }
  }

  @Roles('user')
  @Get(':callId/reject')
  async rejectConnection(@AuthUser() user: User, @Param("callId", CustomObjectId) callId: Types.ObjectId) {
    const result = await this.callService.reject(callId);

    const { caller, receiver } = result;
    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    const callerData = {
      ...result.toObject(),
      caller: tempCaller,
      receiver: tempReceiver,
      requestStatus: 'SENT',
    };

    this.socketGateway.emitEvents(caller.userId, 'call-request', { callData: callerData }, null, caller.deviceId);

    return {
      message: "messages.call.request_accepted",
      data: {
        ...result.toObject(),
        caller: tempCaller,
        receiver: tempReceiver,
        requestStatus: 'RECEIVED',
      },
    }
  }
}
