import { InjectModel } from "@nestjs/mongoose";
import { SocketConnection } from "./entities/socketConnection.entity";
import mongoose, { Model, Types } from "mongoose";
import { TokenService } from "../auth/services/token.service";
import { UsersService } from "../users/users.service";
import { customConfig } from "../config/config";
import { User } from "../users/users.entity";

export class SocketService {
  constructor(
    @InjectModel(SocketConnection.name) private readonly socketConnection: Model<SocketConnection>,

    private readonly tokenService: TokenService,
    private readonly userService: UsersService,
  ) { }

  config = customConfig();

  saveClientData = async (userId: Types.ObjectId, deviceId: Types.ObjectId, clientId: string): Promise<SocketConnection> => {
    userId = new Types.ObjectId(userId);
    deviceId = new Types.ObjectId(deviceId);
    const clientServerObj = { userId, deviceId, clientId, status: 'CONNECTED' };

    let csc = await this.socketConnection.findOne({ userId, deviceId }).sort({ createdAt: -1 });

    if (!csc) {
      csc = await this.socketConnection.create(clientServerObj);
      console.log('🚀New Client connected with server:', clientId);
    } else {
      Object.assign(csc, clientServerObj);
      await csc.save();
      console.log('Old Client connected with server:', clientId);
    }

    return csc
  }

  connectClient = async (clientId: string, token: string): Promise<SocketConnection> => {
    const tokenData = await this.tokenService.verifyToken(token, this.config.TOKEN_TYPES.REFRESH);
    const user: User = await this.userService.getUserById(tokenData.user);
    if (!user) {
      // throw new Error('User Not Found');
      return
    }

    let clientServerConnection = await this.saveClientData(user._id, tokenData.device, clientId)

    return clientServerConnection;
  };

  disconnectClient = async (clientId: string) => {
    const csc = await this.socketConnection.findOne({ clientId });

    if (csc) {
      const updatedSocketConnection = {
        status: "DISCONNECTED",
        clientId: ""
      }

      Object.assign(csc, updatedSocketConnection);

      console.log(`Client disconnected from server: ${clientId}`);
      return await csc.save()
    }
    return csc;
  }

  getClientId = async ({ userId, deviceId }) => {
    userId = new Types.ObjectId(userId);
    deviceId = new Types.ObjectId(deviceId);
    const csc = await this.socketConnection.findOne({ userId, deviceId, status: "CONNECTED" }).select({ clientId: 1 });

    return csc ? csc.clientId : ''
  }

  getConnectedClientIds = async (users: Types.ObjectId[]): Promise<string[]> => {
    const csc = await this.socketConnection.find({ userId: { $in: users.map(id => new Types.ObjectId(id)) }, status: "CONNECTED" }).select({ clientId: 1 });

    return csc.map(device => device.clientId);
  }

  getClientIdsByDevices = async (devices: Types.ObjectId[]): Promise<string[]> => {
    const csc = await this.socketConnection.find({ deviceId: { $in: devices }, status: "CONNECTED" }).select({ clientId: 1 });

    return csc.map(device => device.clientId);
  }
}