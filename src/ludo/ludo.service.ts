import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { LudoConnection } from './entities/ludo.entity';
import { LudoMove } from './entities/movePiece.entity';
import { InjectModel } from '@nestjs/mongoose';
import { LudoPlayer, PlayerPieceDto } from './dto/piece-info.dto';
import { compairMongoId, generateRandomNumber, getRandomValue } from 'src/utils/helper';
import * as moment from 'moment';
import { User } from 'src/users/users.entity';
import { EmitEventDto } from 'src/socket/dto/create-socket.dto';
const oppositePositions = { 0: 2, 1: 3, 2: 0, 3: 1 };

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

  getNextPlayerInfo = (position: number, name: string, image: string, userId: Types.ObjectId, deviceId: Types.ObjectId, is_computer: boolean = false) => {
    const defaultPiecesPosition = ["player_a", "player_b", "player_c", "player_d"];
    const homeColors = ["#4387f8", "#ed4436", "#ffbf04", "#35ab55"];
    const pathColors = ["#76a9ff", "#df7b73", "#ffde7c", "#7bd794"];

    const nextPlayerInfo = {
      type: defaultPiecesPosition[position],
      name,
      image,
      userId,
      deviceId,
      is_computer,
      color: homeColors[position],
      path_color: pathColors[position],
    }

    return nextPlayerInfo;
  }

  getPieceInfo = (playerType: string): PlayerPieceDto => {
    const isFirstPlayer = playerType === "player_a";

    const pieceInfo: PlayerPieceDto = {
      playerType,
      action: isFirstPlayer ? "dice_roll" : "",
      is_my_turn: isFirstPlayer,
      is_dice_used: isFirstPlayer,
      dice_value: 0,
      is_winner: false,
      winner_no: 4,
      pieces: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0
      }
    };

    return pieceInfo;
  };

  totalConnectedFriends = (players: LudoPlayer[]) => {
    return players.reduce((total, player) => player.is_computer ? total : total += 1, 0);
  }

  getBotPlayerInfo = (position: number) => {
    const userId = new mongoose.Types.ObjectId(); // Generate a new ObjectId for each friend
    const deviceId = new mongoose.Types.ObjectId(); // Generate another ObjectId for each friend (if needed)

    const botPlayerInfo = this.getNextPlayerInfo(position, `Bot - ${position}`, "", userId, deviceId, true);
    const botPlayerPiecesInfo = this.getPieceInfo(botPlayerInfo.type);

    return {
      botPlayerInfo,
      botPlayerPiecesInfo,
    }
  }

  async createLudoConnection(ludoPlayerInfo: LudoPlayer) {
    const roomNumberLength = 8;

    let roomNumber = generateRandomNumber(roomNumberLength);

    while (await this.getLudoConnectionRoomNo(roomNumber)) {
      roomNumber = generateRandomNumber(roomNumberLength);
    }

    const sessionTimeOut = moment().add(50, 'minutes').toISOString();

    const piecesInfo = this.getPieceInfo(ludoPlayerInfo.type);

    const remainingFriendsInfo = [];
    const remainingFriendsPieceInfo = [];

    [1, 2, 3].map(position => {
      const { botPlayerInfo, botPlayerPiecesInfo } = this.getBotPlayerInfo(position);

      remainingFriendsInfo.push(botPlayerInfo);
      remainingFriendsPieceInfo.push(botPlayerPiecesInfo);
    });

    const connectBody = {
      players: [ludoPlayerInfo, ...remainingFriendsInfo],
      piecesInfo: [piecesInfo, ...remainingFriendsPieceInfo],
      roomNumber,
      sessionTimeOut,
    };

    const connection = await this.ludoConnection.create(connectBody);

    return connection;
  }

  getRemainingAndOccupiedPositions = (players: LudoPlayer[]) => {
    const remainingPositions = [];
    const occupiedPositions = [];

    players.forEach((player, index) => {
      const isComputer = player.is_computer;

      isComputer ? remainingPositions.push(index) : occupiedPositions.push(index);
    })

    return {
      remainingPositions,
      occupiedPositions,
    }
  }

  getNextPlayerPositio = (players: LudoPlayer[]) => {

    const connectedPlayerPositions = players.findIndex(player => !player.is_computer);

    const { remainingPositions, occupiedPositions } = this.getRemainingAndOccupiedPositions(players);

    return occupiedPositions.length === 1 ? oppositePositions[connectedPlayerPositions] : remainingPositions[0];
  }

  async addPlayer(ludoConnectionId: Types.ObjectId, user: User, deviceId: Types.ObjectId) {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const totalConnectedPlayers = this.totalConnectedFriends(ludoConnection.players);
    if (totalConnectedPlayers === 4) {
      throw new NotAcceptableException("messages.ludo.room_is_full");
    }

    const playerPositions = this.getNextPlayerPositio(ludoConnection.players);

    const playerInfo = this.getNextPlayerInfo(playerPositions, user.name, user.image, user._id, deviceId);

    if (totalConnectedPlayers === 3) {
      ludoConnection.status = "STARTED";
      ludoConnection.isStarted = true;
      ludoConnection.startedAt = new Date();
    }

    ludoConnection.players = ludoConnection.players.map(pl => pl.type === playerInfo.type ? playerInfo : pl);

    return await ludoConnection.save();
  }

  async leaveLudoGame(ludoConnectionId: Types.ObjectId, playerId: Types.ObjectId) {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);

    // Find the position of the player who wants to leave
    let playerPosition = ludoConnection.players.findIndex((player: LudoPlayer) => compairMongoId(player.userId, playerId));
    const tempLudoPlayers = [...ludoConnection.players];

    if (playerPosition === -1) {
      throw new NotFoundException("messages.ludo.player_not_found");
    }

    // Filter out all non-computer players after the player has left
    const { occupiedPositions } = this.getRemainingAndOccupiedPositions(tempLudoPlayers);
    let { botPlayerInfo: newBot } = this.getBotPlayerInfo(playerPosition);

    // If only two players are left, ensure they are opposite each other
    if (occupiedPositions.length === 3) {
      const remainingPositions = occupiedPositions.filter(position => position !== playerPosition);

      const [first, second] = remainingPositions;

      const oppositePositionOfFirst = oppositePositions[first];
      const oppositePositionOfSecond = oppositePositions[second];
      const shouldSwap = oppositePositionOfFirst !== second;

      if (shouldSwap) {
        const secondPlayer = tempLudoPlayers[second];

        tempLudoPlayers[oppositePositionOfFirst] = this.getNextPlayerInfo(oppositePositionOfFirst, secondPlayer.name, secondPlayer.image, secondPlayer.userId, secondPlayer.deviceId);

        if (oppositePositionOfSecond === playerPosition) {
          const { botPlayerInfo } = this.getBotPlayerInfo(oppositePositionOfSecond);
          tempLudoPlayers[oppositePositionOfSecond] = botPlayerInfo;
        }

        const { botPlayerInfo } = this.getBotPlayerInfo(second);
        newBot = botPlayerInfo;
        playerPosition = second;
      }
    }

    tempLudoPlayers[playerPosition] = newBot;

    ludoConnection.players = tempLudoPlayers

    return await ludoConnection.save();
  }

  async startGame(ludoConnectionId: Types.ObjectId) {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const totalConnectedPlayers = this.totalConnectedFriends(ludoConnection.players);

    if (totalConnectedPlayers < 2) {
      throw new NotAcceptableException("messages.ludo.cantStartGameWithSelf");
    }

    ludoConnection.status = "STARTED";
    ludoConnection.isStarted = true;
    ludoConnection.startedAt = new Date();

    return await ludoConnection.save();
  }

  getPlayersInfo = (ludoConnectionId: Types.ObjectId, players: LudoPlayer[]) => {
    const playersInfo = {};

    players.forEach((player) => {
      playersInfo[player.type] = {
        name: player.name,
        is_computer: player.is_computer,
        is_online: true,
        ludoConnectionId: ludoConnectionId,
        color: player.color,
        path_color: player.path_color,
        image: player.image,
      }
    });

    return playersInfo;
  }

  getPlayerPiecesInfo = (playersPieces: PlayerPieceDto[]) => {
    const playerPiecesInfo = {};

    playersPieces.forEach((playerPiece) => {

      playerPiecesInfo[playerPiece.playerType] = {
        action: playerPiece.action,
        is_my_turn: playerPiece.is_my_turn,
        is_dice_used: playerPiece.is_dice_used,
        dice_value: playerPiece.dice_value,
        pieces: playerPiece.pieces,
      }
    });

    return playerPiecesInfo;
  }

  getPlayersPositions = (players: LudoPlayer[], playerType: string) => {
    const previousPlayers = [];
    const nextPlayers = [];
    let selfInfo: LudoPlayer | any = {}

    let is_i_am_already_joined = false;

    players.forEach((player) => {
      const isMe = player.type === playerType;

      if (isMe) {
        is_i_am_already_joined = true;
        selfInfo = player;
      } else if (!is_i_am_already_joined) {
        previousPlayers.push(player);
      } else {
        nextPlayers.push(player);
      }
    });

    const getPlayerKeyName = (player: LudoPlayer) => player.type;

    return [selfInfo.type, ...nextPlayers.map(getPlayerKeyName), ...previousPlayers.map(getPlayerKeyName)];
  }

  getLudoInitializationData = (ludoConnectionId: Types.ObjectId, players: LudoPlayer[], pieces: PlayerPieceDto[], friend: LudoPlayer) => {
    return {
      playersPositions: this.getPlayersPositions(players, friend.type),
      playersInfo: this.getPlayersInfo(ludoConnectionId, players),
      piecesInfo: this.getPlayerPiecesInfo(pieces),
    };
  }

  rollDice = async (ludoConnectionId: Types.ObjectId, player_type: string, emitEvents: Function) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const connectedPlayers = ludoConnection.players;
    const connectedPlayerPieces = ludoConnection.piecesInfo;

    const currentPlayerPiece = connectedPlayerPieces.find(piece => piece.playerType === player_type);

    const diceValue = getRandomValue({ maxValue: 6 });

    const playerPiecesInfo = {};

    const isPlayerHasDiceRollingPermission = currentPlayerPiece.action === "dice_roll" && currentPlayerPiece.is_dice_used;

    if (!isPlayerHasDiceRollingPermission) {
      // return;
    }

    connectedPlayers.forEach((player) => {
      const playerPiece = connectedPlayerPieces.find(piece => piece.playerType === player.type);
      const isCurrentPlayer = player.type === player_type;

      playerPiecesInfo[player.type] = {
        action: isCurrentPlayer ? "dice_rolling" : "",
        is_my_turn: isCurrentPlayer,
        is_dice_used: !isCurrentPlayer,
        dice_value: playerPiece.dice_value,
        pieces: playerPiece.pieces,
        new_dice_value: isCurrentPlayer ? diceValue : 0,
        suggested_piece: 0,
        is_winner: playerPiece.is_winner || false,
        winner_no: playerPiece.winner_no || 4,
      }
    });

    const emitLudoDiceRollingEvent = new EmitEventDto();

    emitLudoDiceRollingEvent.devices = connectedPlayers.map(friend => friend.deviceId);
    emitLudoDiceRollingEvent.event = 'ludo-dice-rolling';
    emitLudoDiceRollingEvent.data = { playerPiecesInfo };

    emitEvents(emitLudoDiceRollingEvent);
  }

  movePiece = async (ludoConnectionId: Types.ObjectId, player_type: string, pieceIndex: string, emitEvents: Function) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);
    const connectedPlayers = ludoConnection.players;
    const connectedPlayerPieces = ludoConnection.piecesInfo;

    const currentPlayerPiece = connectedPlayerPieces.find(piece => piece.playerType === player_type);

    const playerPiecesInfo = {};

    const isPlayerHasPieceMovingPermission = currentPlayerPiece.action === "move_piece" && currentPlayerPiece.is_my_turn;

    if (!isPlayerHasPieceMovingPermission) {
      // return;
    }

    connectedPlayerPieces.forEach((playerPiece) => {
      const isPieceMover = playerPiece.playerType === player_type;

      playerPiecesInfo[playerPiece.playerType] = {
        action: playerPiece.action,
        is_my_turn: playerPiece.is_my_turn,
        is_dice_used: playerPiece.is_dice_used,
        dice_value: playerPiece.dice_value,
        pieces: playerPiece.pieces,
        suggested_piece: isPieceMover ? pieceIndex : 0,
        is_winner: playerPiece.is_winner || false,
        winner_no: playerPiece.winner_no || 4,
      }
    });

    const emitLudoPieceMovingEvent = new EmitEventDto();

    emitLudoPieceMovingEvent.devices = connectedPlayers.map(friend => friend.deviceId);
    emitLudoPieceMovingEvent.event = 'ludo-piece-moving';
    emitLudoPieceMovingEvent.data = { playerPiecesInfo };

    emitEvents(emitLudoPieceMovingEvent);
  }

  updatePlayerPieces = async (ludoConnectionId: Types.ObjectId, ludoPiecesInfo: object) => {
    const ludoConnection = await this.getLudoConnectionById(ludoConnectionId);

    const playerKeys = Object.keys(ludoPiecesInfo);

    const needToUpdate: PlayerPieceDto[] = playerKeys.map(playerKey => {
      const playerPieceInfo = ludoPiecesInfo[playerKey];

      return {
        playerType: playerKey,
        action: playerPieceInfo.action,
        dice_value: playerPieceInfo.dice_value,
        new_dice_value: 0,
        is_dice_used: playerPieceInfo.is_dice_used,
        is_my_turn: playerPieceInfo.is_my_turn,
        pieces: playerPieceInfo.pieces,
        is_winner: playerPieceInfo.is_winner || false,
        winner_no: playerPieceInfo.winner_no || 4,
      }
    })

    ludoConnection.piecesInfo = needToUpdate;
    await ludoConnection.save();
  }
}
