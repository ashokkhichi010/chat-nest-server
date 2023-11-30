import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChessConnection } from './entities/chess.entity';
import mongoose, { Model, Types } from 'mongoose';
import { square } from 'src/utils/square';
import { ChessPieceDto } from './dto/create-chess.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChessService {
  constructor(
    @InjectModel(ChessConnection.name) private readonly chessConnectionModel: Model<ChessConnection>,
    private readonly userService: UsersService,
  ) { }

  isConnectionExist = async (caller: Types.ObjectId, receiver: Types.ObjectId) => {
    const connection = await this.chessConnectionModel.find({ caller, receiver, status: 'PENDING' });

    return connection[0] || null;
  };

  connect = async (caller: Types.ObjectId, receiver: Types.ObjectId, deviceId: Types.ObjectId): Promise<ChessConnection> => {
    const connectBody = {
      caller: {
        userId: caller,
        deviceId,
        captured: []
      },
      receiver: { userId: receiver, deviceId: null, captured: [] },
    };

    const connection = await this.chessConnectionModel.create(connectBody);

    return connection;
  };

  disconnect = async (chessConnectionId: Types.ObjectId, userId: Types.ObjectId): Promise<any> => {
    const connection = await this.chessConnectionModel.findOne({ _id: chessConnectionId, });

    if (!connection) {
      throw new BadRequestException('messages.chess.connection_not_found')
    }

    const { caller, receiver } = connection;

    const winner = caller.userId.toString() === userId.toString() ? receiver : caller;

    const updateObj = {
      status: 'COMPLETED',
      winner: winner.userId,
    }

    Object.assign(connection, updateObj);
    await connection.save()

    return { ...connection.toObject(), winner };
  };


  getConnection = async (filter: Record<string, any>) => {
    const connection = await this.chessConnectionModel.findOne(filter);

    if (!connection) {
      throw new BadRequestException('messages.CHESS_CONNECTION_NOT_FOUND');
    }

    switch (connection.status) {
      case 'ACCEPTED': {
        throw new BadRequestException('messages.CHESS_CONNECTION_ACCEPTED');
      }
      case 'REJECTED': {
        throw new BadRequestException('messages.CHESS_CONNECTION_REJECTED');
      }
      case 'CANCELED': {
        throw new BadRequestException('messages.CHESS_CONNECTION_CANCELED');
      }
      case 'COMPLETED': {
        throw new BadRequestException('messages.CHESS_CONNECTION_COMPLETED');
      }
    }

    return connection;
  };

  // getLastPlayerMove = async (connectionId) => {
  //   const movePieceData = await MovePiece.findOne({ connectionId }).sort({ createdAt: -1 });
  //   return movePieceData;
  // };

  accept = async (connectionId: Types.ObjectId, receiverDevice: Types.ObjectId,) => {
    const connection = await this.getConnection({ _id: connectionId });

    const updateChessObj = {
      caller: {
        userId: connection.caller.userId,
        deviceId: connection.caller.deviceId,
        captured: [],
      },
      receiver: {
        userId: connection.receiver.userId,
        deviceId: receiverDevice,
        captured: [],
      },
      chessBoard: square,
      status: 'ACCEPTED',
      isAccepted: true,
      acceptedAt: new Date(),
    }

    Object.assign(connection, updateChessObj);
    await connection.save();

    return connection;
  };

  cancel = async (connectionId: Types.ObjectId) => {
    const connection = await this.getConnection({ _id: connectionId });

    const updateObj = {
      status: 'CANCELED',
      isCanceled: true,
      canceledAt: new Date().toISOString(),
    };

    Object.assign(connection, updateObj);
    await connection.save();

    return connection;
  };

  reject = async (connectionId: Types.ObjectId) => {
    const connection = await this.getConnection({ _id: connectionId });

    const updateObj = {
      status: 'REJECTED',
      isRejected: true,
      rejectedAt: new Date().toISOString(),
    };

    Object.assign(connection, updateObj);
    await connection.save();

    return connection;
  };

  handleMoveChessPiece = async (from: ChessPieceDto, to: ChessPieceDto, user: object, chessConnectionId: Types.ObjectId, emitEvents: Function) => {
    const connection = await this.chessConnectionModel.findOne({ _id: new mongoose.Types.ObjectId(chessConnectionId), status: "ACCEPTED" });

    if (!connection) {
      throw new BadRequestException('chess connection not found');
    }

    const { caller, receiver, ...tempObj } = connection.toObject();

    const isCaller = caller.userId.toString() === user['_id'];

    const response = await this.movePiece(from, to, caller.captured, receiver.captured, connection.chessBoard);
    const { callerCaptured, receiverCaptured, chessBoard } = response;

    const updateChessObj = {
      caller: {
        userId: connection.caller.userId,
        deviceId: connection.caller.deviceId,
        captured: callerCaptured,
      },
      receiver: {
        userId: connection.receiver.userId,
        deviceId: connection.receiver.deviceId,
        captured: receiverCaptured,
      },
      chessBoard: chessBoard,
    }

    Object.assign(connection, updateChessObj);
    await connection.save();

    const [tempCaller, tempReceiver] = await Promise.all([this.userService.getUserById(caller.userId), this.userService.getUserById(receiver.userId)])

    const callerChessBoard = chessBoard;
    const receiverChessBoard = [];

    for (let i = chessBoard.length - 1; i >= 0; i -= 1) {
      receiverChessBoard.push(chessBoard[i]);
    }

    const callerData = {
      ...tempObj,
      players: {
        self: { ...tempCaller, captured: callerCaptured },
        other: { ...tempReceiver, captured: receiverCaptured }
      },
      chessBoard: callerChessBoard,
      requestStatus: 'SENT',
      isTurn: !isCaller,
    };

    const receiverData = {
      ...tempObj,
      players: {
        other: { ...tempCaller, captured: callerCaptured },
        self: { ...tempReceiver, captured: receiverCaptured },
      },
      chessBoard: receiverChessBoard,
      requestStatus: 'RECEIVED',
      isTurn: isCaller,
    };

    emitEvents(caller.userId, 'chess-move-piece', { chessData: callerData }, null, caller.deviceId);
    emitEvents(receiver.userId, 'chess-move-piece', { chessData: receiverData }, null, receiver.deviceId);
  }

  movePiece = async (
    previousData: ChessPieceDto,
    currentData: ChessPieceDto,
    callerCaptured: string[] = [],
    receiverCaptured: string[] = [],
    chessBoard: ChessPieceDto[]
  ) => {
    const previousIndex = previousData.index;
    const currentIndex = currentData.index;

    const data = chessBoard.map((data) => {
      const currentDataIndex = data.index;

      if (previousIndex === currentDataIndex) {
        data = { ...data, piece: '', user: '' }
      } else if (currentIndex === currentDataIndex) {
        delete previousData.index;
        delete previousData.id;
        data = { ...data, ...previousData }
        if (currentData.user === 'A') {
          receiverCaptured.push(currentData.piece);
        } else if (currentData.user === 'B') {
          callerCaptured.push(currentData.piece);
        }
      }
      return data;
    })

    return {
      chessBoard: data,
      callerCaptured,
      receiverCaptured,
    };

  }

  // move = async (userId, connectionId, from, to) => {
  //   const connection = await this.getConnection({ _id: connectionId });
  //   const lastPlayer = await getLastPlayerMove(connectionId);

  //   let player;
  //   if (!lastPlayer) {
  //     player = connection.caller.toString();
  //   } else {
  //     player = lastPlayer.player.toString();
  //   }

  //   if (player !== userId.toString()) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, getApiMessages('CAN_NOT_MOVE'));
  //   }

  //   const createObj = {
  //     connectionId: connectionId,
  //     from: from,
  //     to: to,
  //   };

  //   connection.chessBoard = connection.chessBoard.map((value) => {
  //     if (value.index === from.index) {
  //       value.piece = '';
  //     } else if (value.index === to.index) {
  //       value.piece = from.piece;
  //     }
  //     return value;
  //   });

  //   const session = await mongoose.startSession();
  //   try {
  //     session.startTransaction();
  //     const movePiece = await MovePiece.create([createObj], { session });
  //     await connection.save({ session });

  //     await session.commitTransaction();
  //     session.endSession();

  //     return movePiece;
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();

  //     throw new ApiError(httpStatus.BAD_REQUEST, error);
  //   }
  // };

  // getRowCol = (index) => {
  //   index = parseInt(index, 10);

  //   let row = Math.ceil((index + 1) / 8);
  //   let col = index + 1 - (row - 1) * 8;

  //   return { row, col };
  // };

  // nPiece = (index, user, square) => {
  //   let suggestionResult = [];
  //   index = parseInt(index, 10);
  //   const result = getRowCol(index);

  //   for (let piece of square) {
  //     const pieceIndex = piece.index;
  //     const pieceUser = piece.user;
  //     const { row, col } = getRowCol(i);
  //     if (
  //       (result.row - 2 === row && (result.col + 1 === col || result.col - 1 === col)) ||
  //       (result.row + 2 === row && (result.col + 1 === col || result.col - 1 === col)) ||
  //       (result.col - 2 === col && (result.row + 1 === row || result.row - 1 === row)) ||
  //       (result.col + 2 === col && (result.row + 1 === row || result.row - 1 === row))
  //     ) {
  //       if (pieceIndex !== index || pieceUser !== user) {
  //         suggestionResult.push(pieceIndex);
  //       }
  //     }
  //   }

  //   return suggestionResult;
  // };

  // qPiece = (index, user, square) => {
  //   let suggestionResult = [];
  //   index = parseInt(index, 10);

  //   const { row, col } = getRowCol(index);

  //   for (let i = index; i < 64; i += 8) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   for (let i = index; i >= 0; i -= 8) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   const start = (row - 1) * 8;

  //   for (let i = start; i < start + 8; i += 1) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   const deff = row - col;
  //   const sum = row + col;

  //   for (let piece of square) {
  //     const pieceIndex = piece.index;
  //     const pieceUser = piece.user;
  //     const { row, col } = getRowCol(i);
  //     if (deff === row - col || sum === row + col) {
  //       if (pieceIndex !== index || pieceUser !== user) {
  //         suggestionResult.push(pieceIndex);
  //       }
  //     }
  //   }

  //   return suggestionResult;
  // };

  // kPiece = (index, user, square) => {
  //   let suggestionResult = [];
  //   index = parseInt(index, 10);
  //   const result = getRowCol(index);

  //   for (let piece of square) {
  //     const pieceIndex = piece.index;
  //     const pieceUser = piece.user;
  //     const { row, col } = getRowCol(pieceIndex);
  //     if (
  //       (result.row - 1 === row && [result.col - 1, result.col + 1, result.col].includes(col)) ||
  //       (result.row + 1 === row && [result.col - 1, result.col + 1, result.col].includes(col)) ||
  //       (result.row === row && [result.col - 1, result.col + 1, result.col].includes(col))
  //     ) {
  //       if (pieceIndex !== index || pieceUser !== user) {
  //         suggestionResult.push(pieceIndex);
  //       }
  //     }
  //   }

  //   return suggestionResult;
  // };

  // bPiece = (index, user, square) => {
  //   let suggestionResult = [];
  //   index = parseInt(index, 10);
  //   const { row, col } = getRowCol(index);
  //   const deff = row - col;
  //   const sum = row + col;

  //   for (let piece of square) {
  //     const pieceIndex = piece.index;
  //     const pieceUser = piece.user;
  //     const { row, col } = getRowCol(pieceIndex);
  //     if (deff === row - col || sum === row + col) {
  //       if (pieceIndex !== index || pieceUser !== user) {
  //         suggestionResult.push(pieceIndex);
  //       }
  //     }
  //   }

  //   return suggestionResult;
  // };

  // rPiece = (index, user, square) => {
  //   let suggestionResult = [];
  //   index = parseInt(index, 10);

  //   let row = Math.ceil((index + 1) / 8);

  //   for (let i = index; i < 64; i += 8) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   for (let i = index; i >= 0; i -= 8) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   const start = (row - 1) * 8;

  //   for (let i = start; i < start + 8; i += 1) {
  //     if (pieceIndex !== index || pieceUser !== user) {
  //       suggestionResult.push(pieceIndex);
  //     }
  //   }

  //   return suggestionResult;
  // };

  // pPiece = (index, user, square) => {
  //   let suggestionResult;
  //   index = parseInt(index, 10);

  //   let moves = Math.ceil((index + 1) / 8);
  //   moves = user === 'B' ? moves : moves - 5;

  //   if (user === 'A') {
  //     suggestionResult = moves === 2 ? [index - 8, index - 16] : [index - 8];
  //   } else if (user === 'B') {
  //     suggestionResult = moves === 2 ? [index + 8, index + 16] : [index + 8];
  //   } else {
  //     throw new ApiError(httpStatus.BAD_REQUEST, getApiMessages('INVALIED_USER', 'en'));
  //   }

  //   return suggestionResult;
  // };

  // moveAndEmit = async (data, emitEvent) => {
  //   const { userId, connectionId, from, to } = data;
  //   const connection = await this.getConnection({ _id: connectionId });

  //   const createObj = {
  //     connectionId: connectionId,
  //     from: from,
  //     to: to,
  //   };

  //   connection.chessBoard = connection.chessBoard.map((value) => {
  //     if (value.index === from.index) {
  //       value.piece = '';
  //     } else if (value.index === to.index) {
  //       value.piece = from.piece;
  //     }
  //     return value;
  //   });

  //   const session = await mongoose.startSession();
  //   try {
  //     session.startTransaction();
  //     const movePiece = await MovePiece.create([createObj], { session });
  //     await connection.save({ session });

  //     await session.commitTransaction();
  //     session.endSession();

  //     return connection.chessBoard;
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();

  //     throw new ApiError(httpStatus.BAD_REQUEST, error);
  //   }
  // };
}
