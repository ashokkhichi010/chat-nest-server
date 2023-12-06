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
    console.log("🚀 ~ file: call.controller.ts:26 ~ CallController ~ getConnect ~ params:", params)
    console.log("🚀 ~ file: call.controller.ts:26 ~ CallController ~ getConnect ~ contactUser:", contactUser)
    // console.log("🚀 ~ file: call.controller.ts:26 ~ CallController ~ getConnect ~ params:", params)
    const caller = user;
    const userId = caller._id;
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);
    // const { contactUser, type } = params;

    const connectionId: string = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const result = await this.callService.createCall(userId, contactUser, deviceId, params.type);
    const receiver = await this.userService.getUserById(contactUser);

    const timeOut = moment().add(60, 'seconds').toISOString();

    this.socketGateway.emitEvents(contactUser, 'call-request', { callData: { ...result.toObject(), caller, receiver, requestStatus: 'RECEIVED', timeOut } });

    return {
      message: "messages.call.request_sent",
      data: { ...result.toJSON(), caller, receiver, requestStatus: 'SENT', timeOut },
    }
  }

  // @Roles('user')
  // @Get('disconnect/:callConnectionId')
  // async getDisConnect(@AuthUser() user: User, @Param("callConnectionId", CustomObjectId) callConnectionId: Types.ObjectId) {
  //   const caller = user;
  //   const userId = caller._id;
  //   console.log("🚀 ~ file: call.controller.ts:52 ~ callController ~ getDisConnect ~ userId:", userId)

  //   const result: callConnection = await this.callService.disconnect(callConnectionId, userId);
  //   // console.log("🚀 ~ file: call.controller.ts:54 ~ callController ~ getDisConnect ~ result:", result);

  //   // this.socketGateway.emitEvents(result.winner, 'call-completed', { ...result.toJSON() });
  //   this.socketGateway.emitEvents(result.winner['userId'], 'call-request', { callData: { ...result } }, null, result.winner['deviceId']);

  //   return {
  //     message: "messages.call.request_sent",
  //     data: { ...result },
  //   }
  // }

  // @Roles('user')
  // @Get(':callConnectionId/accept')
  // async acceptConnection(@AuthUser() user: User, @Headers() headers: any, @Param("callConnectionId", CustomObjectId) callConnectionId: Types.ObjectId) {
  //   const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

  //   const result: callConnection = await this.callService.accept(callConnectionId, deviceId);

  //   const { caller, receiver, callBoard, ...tempObj } = result.toObject();
  //   const tempCaller = await this.userService.getUserById(caller.userId);
  //   const tempReceiver = await this.userService.getUserById(receiver.userId);

  //   const callercallBoard = callBoard;
  //   const receivercallBoard = [];

  //   for (let i = callBoard.length - 1; i >= 0; i -= 1) {
  //     receivercallBoard.push(callBoard[i]);
  //   }

  //   const callerData = {
  //     ...tempObj,
  //     players: {
  //       self: { ...tempCaller, captured: [], duration: 0 },
  //       other: { ...tempReceiver, captured: [], duration: 0 }
  //     },
  //     callBoard: callercallBoard,
  //     requestStatus: 'SENT',
  //     isTurn: true,
  //   };

  //   this.socketGateway.emitEvents(caller.userId, 'call-request', { callData: callerData }, null, caller.deviceId);

  //   return {
  //     message: "messages.call.request_accepted",
  //     data: {
  //       ...tempObj,
  //       players: {
  //         self: { ...tempReceiver, captured: [], duration: 0 },
  //         other: { ...tempCaller, captured: [], duration: 0 }
  //       },
  //       callBoard: receivercallBoard,
  //       requestStatus: 'RECEIVED',
  //       isTurn: false,
  //     },
  //   }
  // }

  // @Roles('user')
  // @Get(':callConnectionId/cancel')
  // async cancelConnection(@AuthUser() user: User, @Param("callConnectionId", CustomObjectId) callConnectionId: Types.ObjectId) {
  //   const result = await this.callService.cancel(callConnectionId);
  //   let { caller, receiver } = result;

  //   const tempCaller = await this.userService.getUserById(caller.userId);
  //   const tempReceiver = await this.userService.getUserById(receiver.userId);

  //   this.socketGateway.emitEvents(receiver.userId, 'call-request', { callData: { ...result.toObject(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'RECEIVED' } }, null, receiver.deviceId);

  //   return {
  //     message: "messages.call.request_canceled",
  //     data: { ...result.toJSON(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'SENT' },
  //   }
  // }

  // @Roles('user')
  // @Get(':callConnectionId/reject')
  // async rejectConnection(@AuthUser() user: User, @Param("callConnectionId", CustomObjectId) callConnectionId: Types.ObjectId) {
  //   const result = await this.callService.reject(callConnectionId);
  //   let { caller, receiver } = result;

  //   const tempCaller = await this.userService.getUserById(caller.userId);
  //   const tempReceiver = await this.userService.getUserById(receiver.userId);

  //   this.socketGateway.emitEvents(caller.userId, 'call-request', { callData: { ...result.toObject(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'SENT' } }, null, caller.deviceId);

  //   return {
  //     message: "messages.call.request_rejected",
  //     data: { ...result.toJSON(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'RECEIVED' },
  //   }
  // }
}
