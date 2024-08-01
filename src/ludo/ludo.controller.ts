import { Controller, Post, Body, Headers, Get, Param,  NotAcceptableException } from '@nestjs/common';
import { LudoService } from './ludo.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/users/users.entity';
import { AuthUser } from 'src/decorators/user.decorator';
import mongoose, { Types } from 'mongoose';
import { CustomObjectId } from 'src/pipes/customObjectId.pipe';
import { SocketGateway } from 'src/socket/socket.gateway';
import { compairMongoId } from 'src/utils/helper';
import { DeviceHeadersDto } from 'src/auth/dto/device.dto';
// import { CreateLudoDto } from './dto/create-ludo.dto';

@Controller('ludo')
export class LudoController {
  constructor(
    private readonly ludoService: LudoService,
    private readonly socketGateway: SocketGateway,
  ) { }

  @Roles('user')
  @Get('create-room')
  async createRoom(@AuthUser() user: User, @Headers() headers: DeviceHeadersDto) {
    const userId = user._id;
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

    const playerInfo = this.ludoService.getNextPlayerInfo(0, user.name, user.image, userId, deviceId);

    const result = await this.ludoService.createLudoConnection(playerInfo);

    return {
      message: "messages.ludo.connected",
      data: { ...result.toJSON() },
    }
  }

  @Roles('user')
  @Post(':ludoConnectionId/send-invitation')
  async sendInvitation(@AuthUser() user: User, @Param("ludoConnectionId", CustomObjectId) ludoConnectionId: Types.ObjectId, @Body("friends") friends: Types.ObjectId[]) {
    const userId = user._id;

    const ludoConnection = await this.ludoService.getLudoConnectionById(ludoConnectionId);

    const isUserJoined = ludoConnection.players.find(player => compairMongoId(userId, player.userId));

    if (!isUserJoined) {
      throw new NotAcceptableException('messages.ludo.unauthorized_to_send_invitation');
    }

    friends.forEach(friend => this.socketGateway.emitEvents(friend, 'ludo-game-request', { ...ludoConnection.toJSON() }));

    return {
      message: "messages.ludo.request_sent",
    }
  }

  @Roles('user')
  @Get(':ludoConnectionId/join-room')
  async joinRoom(@AuthUser() user: User, @Param("ludoConnectionId", CustomObjectId) ludoConnectionId: Types.ObjectId, @Headers() headers: any) {
    const deviceId: Types.ObjectId = new mongoose.Types.ObjectId(headers['device_id']);

    const ludoConnection = await this.ludoService.addPlayer(ludoConnectionId, user, deviceId);

    const connectedPlayers = ludoConnection.players;

    const isAllPlayersConnected = connectedPlayers.length === 4;

    connectedPlayers.forEach(friend => this.socketGateway.emitEvents(friend.userId, 'ludo-game-request', { ...ludoConnection.toJSON(), is_starting: isAllPlayersConnected }, null, friend.deviceId));

    if (isAllPlayersConnected) {
      setTimeout(() => {
        connectedPlayers.forEach(friend => this.socketGateway.emitEvents(friend.userId, 'start-ludo-game', { ...ludoConnection.toJSON() }, null, friend.deviceId));
      }, 3000);
    }

    return {
      message: "messages.ludo.joined",
    }
  }

  @Roles('user')
  @Get(':ludoConnectionId/leave-room')
  async leaveRoom(@AuthUser() user: User, @Param("ludoConnectionId", CustomObjectId) ludoConnectionId: Types.ObjectId, @Headers() headers: any) {
    const userId = user._id;

    const ludoConnection = await this.ludoService.leaveLudoGame(ludoConnectionId, userId);

    const connectedPlayers = ludoConnection.players;

    connectedPlayers.forEach(friend => this.socketGateway.emitEvents(friend.userId, 'ludo-game-request', { ...ludoConnection.toJSON() }, null, friend.deviceId));

    return {
      message: "messages.ludo.leaved",
    }
  }
}
