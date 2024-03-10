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

  // disconnectClient = async (userId, deviceId, emitEvent, session = null, lang = 'en') => {
  //   const user = await userService.getUserById(userId);
  //   if (!user) {
  //     return new Error(getApiMessages('USER_NOT_FOUND', lang));
  //   }

  //   userId = Types.Types.ObjectId(userId);
  //   deviceId = Types.Types.ObjectId(deviceId);

  //   let clientServerConnection = await this.socketConnection.findOne({ userId, deviceId, status: "CONNECTED" }).sort({ createdAt: -1 });

  //   if (!clientServerConnection) {
  //     return new Error('clientDevice Not Found');
  //   }

  //   const clientServerObj = { clientId: '', status: 'DISCONNECTED' };
  //   console.log('Old Client disconnected to server:', clientServerConnection.clientId);

  //   Object.assign(clientServerConnection, clientServerObj);
  //   const options = {};
  //   session && (options.session = session);

  //   await clientServerConnection.save(options);
  //   await contactService.getOnlineContacts(userId, 'offline', emitEventToClient, emitEvent);

  //   return;
  // };

  // emitEventToClient = async (userId, event, emitEvent, data, callback = null, timeout = 1000) => {
  //   const csc = await this.socketConnection.find({ userId: Types.Types.ObjectId(userId), status: 'CONNECTED' });

  //   const receiverClient = [];

  //   csc.forEach((value) => {
  //     receiverClient.push(value.clientId);
  //   });

  //   if (receiverClient.length) {
  //     emitEvent(receiverClient, event, [data, callback], timeout);
  //   }
  // };

  // disconnectClientByClientId = async (clientId, emitEvent) => {
  //   const csc = await this.socketConnection.findOne({ clientId });

  //   csc && await disconnectClient(csc.userId, csc.deviceId, emitEvent)
  // };

  getClientId = async ({ userId, deviceId }) => {
    userId = new Types.ObjectId(userId);
    deviceId = new Types.ObjectId(deviceId);
    const csc = await this.socketConnection.findOne({ userId, deviceId, status: "CONNECTED" });

    return csc ? csc.clientId : ''
  }

  getConnectedClientIds = async (userId: Types.ObjectId): Promise<string[]> => {
    const csc = await this.socketConnection.find({ userId: new mongoose.Types.ObjectId(userId), status: "CONNECTED" });

    return csc.map(device => device.clientId);
  }
  // emitEvents = async ( to: Types.ObjectId, event: string, data: any, callback: Function) => { }
}