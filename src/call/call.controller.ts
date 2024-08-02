import { Controller, Get, Param, Headers, Body, Post } from '@nestjs/common';
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
import { EmitEventDto } from 'src/socket/dto/create-socket.dto';

@Controller('call')
export class CallController {
  constructor(
    private readonly callService: CallService,
    private readonly contactService: ContactService,
    private readonly socketGateway: SocketGateway,
    private readonly userService: UsersService,
  ) { }

  @Roles('user')
  // @Get('connect/:type/:contactUser')
  // async getConnect(@AuthUser() user: User, @Headers() headers: any, @Param("contactUser", CustomObjectId) contactUser: Types.ObjectId, @Param() params: { type: string }) {
  @Post('connect/:contactUser')
  async getConnect(@AuthUser() user: User, @Headers() headers: any, @Body() body: { type: string, offer: any }, @Param("contactUser", CustomObjectId) contactUser: Types.ObjectId) {
    const caller = user;
    const userId = caller._id;
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);
    // const { contactUser, type } = params;

    const connectionId: string = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const result: CallS = await this.callService.createCall(userId, contactUser, deviceId, body.type);
    const receiver = await this.userService.getUserById(contactUser);

    const timeOut = moment().add(60, 'seconds').toISOString();

    const emitCallRequestEvent = new EmitEventDto();
    const emitWebRtcEvent = new EmitEventDto();

    emitCallRequestEvent.users = [contactUser];
    emitCallRequestEvent.event = 'call-request';
    emitCallRequestEvent.data = { callData: { ...result.toObject(), caller, receiver, requestStatus: 'RECEIVED', timeOut } };

    emitWebRtcEvent.users = [contactUser];
    emitWebRtcEvent.event = 'web-rtc';
    emitWebRtcEvent.data = { offer: body.offer, type: body.type };

    this.socketGateway.emitEvents(emitCallRequestEvent);
    this.socketGateway.emitEvents(emitWebRtcEvent);

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

    const emitCallRequestEvent = new EmitEventDto();

    emitCallRequestEvent.users = [secondPerson.userId];
    emitCallRequestEvent.event = 'call-request';
    emitCallRequestEvent.data = { callData: result.toObject() };

    this.socketGateway.emitEvents(emitCallRequestEvent);

    return {
      message: "messages.call.request_sent",
      data: result.toObject()
    }
  }

  @Roles('user')
  @Post(':callId/accept')
  async acceptCall(@AuthUser() user: User, @Headers() headers: any, @Param("callId", CustomObjectId) callId: Types.ObjectId, @Body() body: { answer: any }) {
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

    const emitCallRequestEvent = new EmitEventDto();
    const emitWebRtcEvent = new EmitEventDto();

    emitCallRequestEvent.users = [caller.userId];
    emitCallRequestEvent.event = 'call-request';
    emitCallRequestEvent.data = { callData: callerData };

    emitWebRtcEvent.users = [caller.userId];
    emitWebRtcEvent.event = 'web-rtc';
    emitWebRtcEvent.data = { answer: body.answer };

    this.socketGateway.emitEvents(emitCallRequestEvent);
    this.socketGateway.emitEvents(emitWebRtcEvent);

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


    const emitCallRequestEvent = new EmitEventDto();

    emitCallRequestEvent.users = [receiver.userId];
    emitCallRequestEvent.event = 'call-request';
    emitCallRequestEvent.data = { callData: callerData };

    this.socketGateway.emitEvents(emitCallRequestEvent);

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

    const emitCallRequestEvent = new EmitEventDto();

    emitCallRequestEvent.users = [caller.userId];
    emitCallRequestEvent.event = 'call-request';
    emitCallRequestEvent.data = { callData: callerData };

    this.socketGateway.emitEvents(emitCallRequestEvent);

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
