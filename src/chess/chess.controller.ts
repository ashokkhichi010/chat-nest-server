import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ChessService } from './chess.service';
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
import { ChessConnection } from './entities/chess.entity';

@Controller('chess')
export class ChessController {
  constructor(
    private readonly chessService: ChessService,
    private readonly contactService: ContactService,
    private readonly socketGateway: SocketGateway,
    private readonly userService: UsersService,
  ) { }

  @Roles('user')
  @Get('connect/:contactUser')
  async getConnect(@AuthUser() user: User, @Headers() headers: any, @Param("contactUser", CustomObjectId) contactUser: Types.ObjectId) {
    const caller = user;
    const userId = caller._id;
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

    const connectionId: string = getConnectionId(userId, contactUser);
    await this.contactService.isContactExist(connectionId);

    const result = await this.chessService.connect(userId, contactUser, deviceId);
    const receiver = await this.userService.getUserById(contactUser);

    const timeOut = moment().add(60, 'seconds').toISOString();

    this.socketGateway.emitEvents(contactUser, 'chess-request', { chessData: { ...result.toObject(), caller, receiver, requestStatus: 'RECEIVED', timeOut } });

    return {
      message: "messages.chess.request_sent",
      data: { ...result.toJSON(), caller, receiver, requestStatus: 'SENT', timeOut },
    }
  }

  @Roles('user')
  @Get('disconnect/:chessConnectionId')
  async getDisConnect(@AuthUser() user: User, @Param("chessConnectionId", CustomObjectId) chessConnectionId: Types.ObjectId) {
    const caller = user;
    const userId = caller._id;
    console.log("🚀 ~ file: chess.controller.ts:52 ~ ChessController ~ getDisConnect ~ userId:", userId)

    const result: ChessConnection = await this.chessService.disconnect(chessConnectionId, userId);
    // console.log("🚀 ~ file: chess.controller.ts:54 ~ ChessController ~ getDisConnect ~ result:", result);

    // this.socketGateway.emitEvents(result.winner, 'chess-completed', { ...result.toJSON() });
    this.socketGateway.emitEvents(result.winner['userId'], 'chess-request', { chessData: { ...result } }, null, result.winner['deviceId']);

    return {
      message: "messages.chess.request_sent",
      data: { ...result },
    }
  }

  @Roles('user')
  @Get(':chessConnectionId/accept')
  async acceptConnection(@AuthUser() user: User, @Headers() headers: any, @Param("chessConnectionId", CustomObjectId) chessConnectionId: Types.ObjectId) {
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

    const result: ChessConnection = await this.chessService.accept(chessConnectionId, deviceId);

    const { caller, receiver, chessBoard, ...tempObj } = result.toObject();
    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    const callerChessBoard = chessBoard;
    const receiverChessBoard = [];

    for (let i = chessBoard.length - 1; i >= 0; i -= 1) {
      receiverChessBoard.push(chessBoard[i]);
    }

    const callerData = {
      ...tempObj,
      players: {
        self: { ...tempCaller, captured: [] },
        other: { ...tempReceiver, captured: [] }
      },
      chessBoard: callerChessBoard,
      requestStatus: 'SENT',
      isTurn: true,
    };

    this.socketGateway.emitEvents(caller.userId, 'chess-request', { chessData: callerData }, null, caller.deviceId);

    return {
      message: "messages.chess.request_accepted",
      data: {
        ...tempObj,
        players: {
          self: { ...tempReceiver, captured: [] },
          other: { ...tempCaller, captured: [] }
        },
        chessBoard: receiverChessBoard,
        requestStatus: 'RECEIVED',
        isTurn: false,
      },
    }
  }

  @Roles('user')
  @Get(':chessConnectionId/cancel')
  async cancelConnection(@AuthUser() user: User, @Param("chessConnectionId", CustomObjectId) chessConnectionId: Types.ObjectId) {
    const result = await this.chessService.cancel(chessConnectionId);
    let { caller, receiver } = result;

    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    this.socketGateway.emitEvents(receiver.userId, 'chess-request', { chessData: { ...result.toObject(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'RECEIVED' } }, null, receiver.deviceId);

    return {
      message: "messages.chess.request_canceled",
      data: { ...result.toJSON(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'SENT' },
    }
  }

  @Roles('user')
  @Get(':chessConnectionId/reject')
  async rejectConnection(@AuthUser() user: User, @Param("chessConnectionId", CustomObjectId) chessConnectionId: Types.ObjectId) {
    const result = await this.chessService.reject(chessConnectionId);
    let { caller, receiver } = result;

    const tempCaller = await this.userService.getUserById(caller.userId);
    const tempReceiver = await this.userService.getUserById(receiver.userId);

    this.socketGateway.emitEvents(caller.userId, 'chess-request', { chessData: { ...result.toObject(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'SENT' } }, null, caller.deviceId);

    return {
      message: "messages.chess.request_rejected",
      data: { ...result.toJSON(), caller: tempCaller, receiver: tempReceiver, requestStatus: 'RECEIVED' },
    }
  }

  // @Roles('user')
  // @Get(':connectionId/get-suggestion')
  // async suggestions(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const { piece, user, index } =body;
  //   // const square = await

  //   let suggestionResult;

  //   switch (piece) {
  //     case 'r': {
  //       suggestionResult = chessService.rPiece(index, user, square);
  //       break;
  //     }
  //     case 'n': {
  //       suggestionResult = chessService.nPiece(index, user, square);
  //       break;
  //     }
  //     case 'b': {
  //       suggestionResult = chessService.bPiece(index, user, square);
  //       break;
  //     }
  //     case 'q': {
  //       suggestionResult = chessService.qPiece(index, user, square);
  //       break;
  //     }
  //     case 'k': {
  //       suggestionResult = chessService.kPiece(index, user, square);
  //       break;
  //     }
  //     case 'p': {
  //       suggestionResult = chessService.pPiece(index, user, square);
  //       break;
  //     }
  //   }

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), suggestionResult);
  // }

  // @Roles('user')
  // @Get(':connectionId/move')
  // async movePiece(@AuthUser() user: User, @Param() param: { connectionId: ObjectId }) {
  //   const lang =headers['locale-code'] ?headers['locale-code'] : 'en';

  //   const userId =user.id;
  //   const { connectionId } =params;
  //   const { from, to } =body;

  //   const result = await chessService.move(userId, connectionId, from, to, lang);

  //   res.sendJSONResponse(httpStatus.OK, true, getApiMessages('SUCCESS', lang), result);
  // }
}
