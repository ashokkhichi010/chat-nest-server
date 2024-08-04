import { Controller, Post, Body, Headers, Get, Param, NotAcceptableException } from '@nestjs/common';
import { LudoService } from './ludo.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/users/users.entity';
import { AuthUser } from 'src/decorators/user.decorator';
import mongoose, { Types } from 'mongoose';
import { CustomObjectId } from 'src/pipes/customObjectId.pipe';
import { SocketGateway } from 'src/socket/socket.gateway';
import { compairMongoId } from 'src/utils/helper';
import { DeviceHeadersDto } from 'src/auth/dto/device.dto';
import { EmitEventDto } from 'src/socket/dto/create-socket.dto';
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

    const emitLudoRequestEvent = new EmitEventDto();

    emitLudoRequestEvent.users = friends;
    emitLudoRequestEvent.event = 'ludo-game-request';
    emitLudoRequestEvent.data = { ...ludoConnection.toJSON() }

    this.socketGateway.emitEvents(emitLudoRequestEvent);

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

    const isAllPlayersConnected = this.ludoService.totalConnectedFriends(connectedPlayers) === 4;

    const emitLudoRequestEvent = new EmitEventDto();

    emitLudoRequestEvent.devices = connectedPlayers.map(friend => friend.deviceId);
    emitLudoRequestEvent.event = 'ludo-game-request';
    emitLudoRequestEvent.data = { ...ludoConnection.toJSON(), is_starting: isAllPlayersConnected };

    this.socketGateway.emitEvents(emitLudoRequestEvent);

    if (isAllPlayersConnected) {
      setTimeout(() => {
        connectedPlayers.forEach(friend => {
          const gameInitialObjects = this.ludoService.getLudoInitializationData(ludoConnectionId, connectedPlayers, ludoConnection.piecesInfo, friend)

          const emitLudoGameStartEvent = new EmitEventDto();

          emitLudoGameStartEvent.devices = [friend.deviceId]
          emitLudoGameStartEvent.event = 'start-ludo-game';
          emitLudoGameStartEvent.data = gameInitialObjects;

          this.socketGateway.emitEvents(emitLudoGameStartEvent);
        });
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

    const isGameStarted = ludoConnection.isStarted;

    const connectedPlayers = ludoConnection.players;

    const emitLudoRequestEvent = new EmitEventDto();

    emitLudoRequestEvent.devices = connectedPlayers.map(friend => friend.deviceId);
    emitLudoRequestEvent.event = isGameStarted ? "update-ludo-players" : 'ludo-game-request';
    emitLudoRequestEvent.data = isGameStarted
      ? (this.ludoService.getPlayersInfo(ludoConnection._id, ludoConnection.players))
      : ludoConnection.toJSON();

    this.socketGateway.emitEvents(emitLudoRequestEvent);

    return {
      message: "messages.ludo.leaved",
    }
  }

  @Roles('user')
  @Get(':ludoConnectionId/start-game')
  async startGame(@AuthUser() user: User, @Param("ludoConnectionId", CustomObjectId) ludoConnectionId: Types.ObjectId) {
    const ludoConnection = await this.ludoService.startGame(ludoConnectionId);

    const connectedPlayers = ludoConnection.players;

    connectedPlayers.forEach(friend => {
      const gameInitialObjects = this.ludoService.getLudoInitializationData(ludoConnectionId, connectedPlayers, ludoConnection.piecesInfo, friend)

      const emitLudoGameStartEvent = new EmitEventDto();

      emitLudoGameStartEvent.devices = [friend.deviceId]
      emitLudoGameStartEvent.event = 'start-ludo-game';
      emitLudoGameStartEvent.data = gameInitialObjects;

      this.socketGateway.emitEvents(emitLudoGameStartEvent);
    });

    return {
      message: "messages.ludo.leaved",
    }
  }
}
