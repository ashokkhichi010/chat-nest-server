import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { LudoConnection } from './entities/ludo.entity';
import { LudoMove } from './entities/movePiece.entity';
import { InjectModel } from '@nestjs/mongoose';
import { LudoPlayer } from './dto/piece-info.dto';
import { compairMongoId, generateRandomNumber } from 'src/utils/helper';
import * as moment from 'moment';
import { User } from 'src/users/users.entity';

@Injectable()
export class LudoService {
  constructor(
    @InjectModel(LudoConnection.name) private readonly ludoConnection: Model<LudoConnection>,
    @InjectModel(LudoMove.name) private readonly ludoMoveModel: Model<LudoMove>,
  ) { }

  getLudoConnectionById = async (ludoConnectionId: Types.ObjectId) => {
    const ludoConnection = await this.ludoConnection.findById(ludoConnectionId)

    const current = moment();
    const sessionExpirs = moment(ludoConnection.sessionTimeOut);

    const isSessionExpired = ludoConnection ? current.isAfter(sessionExpirs) : true;
    const isPending = ludoConnection?.status === "PENDING";

    if (!ludoConnection) {
      throw new NotFoundException("messages.ludo.connection_not_found");
    } else if (isSessionExpired && isPending) {
      throw new NotAcceptableException("messages.ludo.session_expired");
    }

    return ludoConnection
  };

  getLudoConnectionRoomNo = async (roomNumber: number) => await this.ludoConnection.findOne({ room_number: roomNumber });

  getNextPlayerInfo = (playerIndex: number, name: string, image: string, userId: Types.ObjectId, deviceId: Types.ObjectId) => {
    const defaultPiecesPosition = ["player_a", "player_b", "player_c", "player_d"];
    const homeColors = ["#4387f8", "#ed4436", "#ffbf04", "#35ab55"];
    const pathColors = ["#76a9ff", "#df7b73", "#ffde7c", "#7bd794"];

    const nextPlayerInfo = {
      type: defaultPiecesPosition[playerIndex],
      name,
      image,
      userId,
      deviceId,
      is_computer: false,
      color: homeColors[playerIndex],
      path_color: pathColors[playerIndex],
    }

    return nextPlayerInfo;
  }

  async createLudoConnection(ludoPlayerInfo: LudoPlayer) {
    const roomNumberLength = 8;

    let roomNumber = generateRandomNumber(roomNumberLength);

    while (await this.getLudoConnectionRoomNo(roomNumber)) {
      roomNumber = generateRandomNumber(roomNumberLength);
    }

    const sessionTimeOut = moment().add(5, 'minutes').toISOString();

    const connectBody = {
      players: [ludoPlayerInfo],
      roomNumber,
      sessionTimeOut,
    };

    const connection = await this.ludoConnection.create(connectBody);

    return connection;
  }

  async addPlayer(ludoConnectionId: Types.ObjectId, user: User, deviceId: Types.ObjectId) {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const totalConnectedPlayers = ludoConnection.players.length;

    if (totalConnectedPlayers === 4) {
      throw new NotAcceptableException("messages.ludo.room_is_full");
    }

    const playerInfo = this.getNextPlayerInfo(totalConnectedPlayers, user.name, user.image, user._id, deviceId);

    ludoConnection.players = [...ludoConnection.players, playerInfo];

    return await ludoConnection.save();
  }

  async removePlayer(ludoConnection: LudoConnection, playerId: Types.ObjectId) {
    const remainingPlayers = ludoConnection.players.filter((player: LudoPlayer) => !compairMongoId(player.userId, playerId));

    ludoConnection.players = remainingPlayers.map((player, index) => {
      return this.getNextPlayerInfo(index, player.name, player.image, player.userId, player.deviceId);
    });

    return await ludoConnection.save();
  }

  async replacePlayerByComputer(ludoConnection: LudoConnection, playerId: Types.ObjectId) {
    ludoConnection.players.forEach((player: LudoPlayer) => {
      if (compairMongoId(player.userId, playerId)) {
        player.is_computer = true;
      }
    });

    return await ludoConnection.save();
  }

  async leaveLudoGame(ludoConnectionId: Types.ObjectId, playerId: Types.ObjectId) {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);

    const isGameStarted = ludoConnection.isCanceled;

    const actioFunction = isGameStarted ? this.replacePlayerByComputer : this.removePlayer;

    return await actioFunction(ludoConnection, playerId);
  }

  rollDice = async (ludoConnectionId: Types.ObjectId, playerId: Types.ObjectId, emitEvents: Function) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const connectedPlayers = ludoConnection.toJSON().players;

    const diceValue = 4;

    const diceRoller = connectedPlayers.find(player => compairMongoId(player.userId, playerId));

    connectedPlayers.forEach(friend => emitEvents(friend.userId, 'ludo-dice-rolling', { dice_roller: diceRoller, dice_value: diceValue }, null, friend.deviceId));
  }

  movePiece = async (ludoConnectionId: Types.ObjectId, playerId: Types.ObjectId, pieceIndex: Types.ObjectId, emitEvents: Function) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const connectedPlayers = ludoConnection.toJSON().players;

    const pieceMover = connectedPlayers.find(player => compairMongoId(player.userId, playerId));

    connectedPlayers.forEach(friend => emitEvents(friend.userId, 'ludo-dice-rolling', { piece_mover: pieceMover, pieceIndex }, null, friend.deviceId));
  }

  updatePieceValue = async (ludoConnectionId: Types.ObjectId, playerId: Types.ObjectId, pieceIndex: Types.ObjectId, emitEvents: Function) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const connectedPlayers = ludoConnection.toJSON().players;

    const pieceMover = connectedPlayers.find(player => compairMongoId(player.userId, playerId));

    connectedPlayers.forEach(friend => emitEvents(friend.userId, 'ludo-dice-rolling', { piece_mover: pieceMover, pieceIndex }, null, friend.deviceId));
  }
}
