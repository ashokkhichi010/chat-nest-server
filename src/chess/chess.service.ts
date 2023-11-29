import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChessConnection } from './entities/chess.entity';
import { Model, Types } from 'mongoose';
import { square } from 'src/utils/square';

@Injectable()
export class ChessService {
  constructor(
    @InjectModel(ChessConnection.name) private readonly chessConnectionModel: Model<ChessConnection>
  ) { }

  isConnectionExist = async (caller: Types.ObjectId, receiver: Types.ObjectId) => {
    const connection = await this.chessConnectionModel.find({ caller, receiver, status: 'PENDING' });

    return connection[0] || null;
  };

  connect = async (caller: Types.ObjectId, receiver: Types.ObjectId, deviceId: Types.ObjectId): Promise<ChessConnection> => {
    const connectBody = {
      caller: {
        userId: caller,
        deviceId
      },
      receiver: { userId: receiver },
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
    console.log("🚀 ~ file: chess.service.ts:84 ~ ChessService ~ accept= ~ receiverDevice:", receiverDevice)
    const connection = await this.getConnection({ _id: connectionId });

    connection.status = 'ACCEPTED';
    connection.isAccepted = true;
    connection.acceptedAt = new Date();
    connection.receiver.deviceId = receiverDevice;
    connection.receiver.captured = [];
    connection.caller.captured = [];
    connection.chessBoard = square;

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
