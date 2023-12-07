import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { square } from 'src/utils/square';
import { UsersService } from 'src/users/users.service';
import { CallS } from './entities/call.entity';

@Injectable()
export class CallService {
  constructor(
    @InjectModel(CallS.name) private readonly callModel: Model<CallS>,
    // private readonly userService: UsersService,
  ) { }

  createCall = async (caller: Types.ObjectId, receiver: Types.ObjectId, deviceId: Types.ObjectId, type: string): Promise<CallS> => {
    const connectBody = {
      caller: {
        userId: caller,
        deviceId,
      },

      receiver: {
        userId: receiver,
        deviceId: null,
      },
      type
    };

    const connection = await this.callModel.create(connectBody);

    return connection;
  };

  disconnect = async (chessConnectionId: Types.ObjectId, userId: Types.ObjectId): Promise<any> => {
    const connection = await this.callModel.findOne({ _id: chessConnectionId, });

    if (!connection) {
      throw new BadRequestException('messages.chess.connection_not_found')
    }

    const updateObj = {
      status: 'COMPLETED',
      disconnectedBy: userId,
      disconnectedAt: new Date(),
    }

    Object.assign(connection, updateObj);
    await connection.save()

    return connection;
  };

  getConnection = async (filter: Record<string, any>) => {
    const connection = await this.callModel.findOne(filter);

    if (!connection) {
      throw new BadRequestException('messages.call.not_found');
    }

    switch (connection.status) {
      case 'ACCEPTED': {
        throw new BadRequestException('messages.call.accepted');
      }
      case 'REJECTED': {
        throw new BadRequestException('messages.call.rejected');
      }
      case 'CANCELED': {
        throw new BadRequestException('messages.call.cancelled');
      }
      case 'COMPLETED': {
        throw new BadRequestException('messages.call.completed');
      }
    }

    return connection;
  };

  accept = async (connectionId: Types.ObjectId, receiverDevice: Types.ObjectId,) => {
    const connection = await this.getConnection({ _id: connectionId });

    const updateChessObj = {
      caller: {
        userId: connection.caller.userId,
        deviceId: connection.caller.deviceId,
      },

      receiver: {
        userId: connection.receiver.userId,
        deviceId: receiverDevice,
      },

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
}
