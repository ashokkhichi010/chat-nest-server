import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../message/message.service';
import { SocketService } from './socket.service';
import { ObjectId, Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactService } from '../contact/contact.service';
import { UsersService } from '../users/users.service';
import { Message } from '../message/entities/message.entity';
import { EmitEventDto, MoveChessPieceDto } from './dto/create-socket.dto';
import { ChessService } from 'src/chess/chess.service';
import { DeviceService } from 'src/auth/services/device.service';
import { DeviceHeadersDto } from 'src/auth/dto/device.dto';
import { LudoService } from 'src/ludo/ludo.service';
import { LudoMovePieceDto, LudoRollDiceDto, LudoUpdatePieceDto } from './dto/ludo-dto';

@WebSocketGateway({ cors: { origin: process.env.APP_URL, credentials: false }, transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messageService: MessageService,
    private readonly socketService: SocketService,
    private readonly contactService: ContactService,
    private readonly userService: UsersService,
    private readonly notificationService: NotificationsService,
    private readonly chessService: ChessService,
    private readonly ludoService: LudoService,
    private readonly deviceService: DeviceService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    try {
      const clientId = socket.id;
      const token = socket.handshake.auth.token;

      if (!token) {
        return socket.disconnect();
      } else if (token === "QR_CODE") {
        return;
      }

      const clientServerConnection = await this.socketService.connectClient(clientId, token);
      if (!clientServerConnection) {
        return socket.disconnect();
      }

      const { userId, deviceId } = clientServerConnection;

      await this.messageService.getNewMessages(userId);

      let myContacts: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
      let remainingUsers: any = this.userService.getUsers({ userId, limit: 100, page: 1, search: "" });

      [myContacts, remainingUsers] = await Promise.all([myContacts, remainingUsers]);

      //  this deviceId is used because of we should send response back only for these device which requests new connection insted of all connected device for that user.
      const emitEventToSelf = new EmitEventDto();

      emitEventToSelf.devices = [deviceId];
      emitEventToSelf.event = 'online';
      emitEventToSelf.data = { contacts: myContacts, users: remainingUsers };

      this.emitEvents(emitEventToSelf);

      const contactsId: Types.ObjectId[] = [];
      myContacts.results.forEach((obj: { _id: Types.ObjectId, onlineStatus: Record<string, any> }) => {
        const onlineStatus = obj?.onlineStatus;
        onlineStatus?.status === 'CONNECTED' && contactsId.push(obj._id)
      });

      for (let contactUser of contactsId) {
        let friendsContacts: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
        let friendsMessages: any = this.messageService.getMessages({ userId: contactUser, contactUser: userId, limit: 100, page: 1, search: "", connectionId: null });

        [friendsContacts, friendsMessages] = await Promise.all([friendsContacts, friendsMessages]);

        const emitEventToFriend = new EmitEventDto();

        emitEventToFriend.users = [contactUser];
        emitEventToFriend.event = 'online';
        emitEventToFriend.data = { contacts: friendsContacts, messages: friendsMessages, friendId: userId };

        this.emitEvents(emitEventToFriend);
      }
    } catch (error) {
      console.log("🚀 ~ SocketGateway ~ handleConnection ~ error:", error)
      socket.disconnect();
    }
  }

  @SubscribeMessage('connect-new-device')
  async handleNewDeviceConnection(@MessageBody() { clientId, deviceId, refreshToken, headers }: { clientId: string, deviceId: Types.ObjectId, refreshToken: string, headers: DeviceHeadersDto }) {
    clientId && await this.deviceService.connectNewDevice(refreshToken, deviceId, clientId, headers, this.emitEvents, this.socketService.saveClientData);
  }

  @SubscribeMessage('message-read')
  async handleMessageRead(@MessageBody() messageObj: Message) {
    const { _id, sender, receiver } = messageObj;
    const updatedMessage = await this.messageService.updateMessage(_id, { isSeen: true, seenAt: new Date().toISOString() })

    let senderContacts: any = this.contactService.getContacts({ userId: sender, limit: 100, page: 1 });
    let receiverContacts: any = this.contactService.getContacts({ userId: receiver, limit: 100, page: 1 });

    [senderContacts, receiverContacts] = await Promise.all([senderContacts, receiverContacts]);

    const emitEventToSender = new EmitEventDto();
    const emitEventToReceiver = new EmitEventDto();

    emitEventToSender.users = [sender];
    emitEventToSender.event = 'message-read';
    emitEventToSender.data = { message: updatedMessage, contacts: senderContacts };

    emitEventToReceiver.users = [receiver];
    emitEventToReceiver.event = 'message-read';
    emitEventToReceiver.data = { message: updatedMessage, contacts: receiverContacts };

    this.emitEvents(emitEventToSender);
    this.emitEvents(emitEventToReceiver);
  }

  @SubscribeMessage('connect-chess-connection')
  async handleChessConnection(@MessageBody() { userId, contactUser }: { userId: ObjectId, contactUser: ObjectId }) {
  }

  @SubscribeMessage('chess-move-piece')
  async handleChessMovePiece(@MessageBody() { from, to, user, chessConnectionId }: MoveChessPieceDto) {
    await this.chessService.handleMoveChessPiece(from, to, user, chessConnectionId, this.emitEvents);
  }

  @SubscribeMessage('ludo-roll-dice')
  async handleLudoRollDice(@MessageBody() ludoRollDiceBody: LudoRollDiceDto) {
    await this.ludoService.rollDice(ludoRollDiceBody.ludoConnectionId, ludoRollDiceBody.playerType, this.emitEvents);
  }

  @SubscribeMessage('ludo-move-piece')
  async handleLudoMovePiece(@MessageBody() ludoMovePieceBody: LudoMovePieceDto) {
    await this.ludoService.movePiece(ludoMovePieceBody.ludoConnectionId, ludoMovePieceBody.playerType, ludoMovePieceBody.pieceIndex, this.emitEvents);
  }

  @SubscribeMessage('ludo-sync-data')
  async handleUpdatePiece(@MessageBody() ludoUpdatePieceBody: LudoUpdatePieceDto) {
    const ludoConnectionId = ludoUpdatePieceBody.ludoConnectionId;
    const ludoPiecesInfo = ludoUpdatePieceBody.ludoPiecesInfo;

    await this.ludoService.updatePlayerPieces(ludoConnectionId, ludoPiecesInfo);
  }

  @SubscribeMessage('web-rtc')
  async handleWebRTC(@MessageBody() { offer, answer, userId }: { offer: any, answer: any, userId: Types.ObjectId }) {
    const emitEventToFriend = new EmitEventDto();

    emitEventToFriend.users = [userId];
    emitEventToFriend.event = 'web-rtc';
    emitEventToFriend.data = { offer, answer };

    this.emitEvents(emitEventToFriend);
  }

  // @SubscribeMessage('call-request')
  // async handleIncomingCall(@MessageBody() callInfo: {
  //   type: string,
  //   receiver: string,
  //   receiverName: string,
  //   caller: string,
  //   callerName: string,
  //   status: string,
  // }) {
  //   console.log("🚀 ~ file: socket.gateway.ts:115 ~ SocketGateway ~ handleIncomingCall ~ callInfo:", callInfo)

  //   // const updatedMessage = await this.messageService.updateMessage(_id, { isSeen: true, seenAt: new Date().toISOString() })

  //   // let contacts1: any = this.contactService.getContacts({ userId: sender, limit: 100, page: 1 });
  //   // let contacts2: any = this.contactService.getContacts({ userId: receiver, limit: 100, page: 1 });

  //   // [contacts1, contacts2] = await Promise.all([contacts1, contacts2]);

  //   // await this.emitEvents(sender, 'message-read', { message: updatedMessage, contacts: contacts1 });
  //   // await this.emitEvents(receiver, 'message-read', { message: updatedMessage, contacts: contacts2 });
  // }

  async handleDisconnect(socket: Socket) {
    const clientServerConnection = await this.socketService.disconnectClient(socket.id);

    const userId = clientServerConnection?.userId;
    if (userId) {
      const contacts: any = await this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });

      const contactsId: Types.ObjectId[] = [];
      contacts.results.forEach((obj: { _id: Types.ObjectId, onlineStatus: Record<string, any> }) => {
        const onlineStatus = obj?.onlineStatus;
        onlineStatus?.status === 'CONNECTED' && contactsId.push(obj._id)
      });

      for (let contactUser of contactsId) {
        let myFriends: any = await this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });

        const emitEventToFriend = new EmitEventDto();

        emitEventToFriend.users = [contactUser];
        emitEventToFriend.event = 'offline';
        emitEventToFriend.data = { contacts: myFriends };

        this.emitEvents(emitEventToFriend);
      }
    }
  }

  emitEvents = async (dto: EmitEventDto, callback: Function | null = null) => {
    const { users, event, data, devices, timeout } = dto;

    const clientIds = devices.length ? await this.socketService.getClientIdsByDevices(devices) : await this.socketService.getConnectedClientIds(users);

    const customCallback = (err: Error, res: any) => {
      if (!res[0]?.success) {
        const notification = data?.notification;
        // notification && this.notificationService.createNotification({ userId, ...notification });
      }
    };

    if (clientIds.length) {
      this.server.timeout(timeout).to(clientIds).emit(event, data, callback || customCallback);
    }
  };
}
