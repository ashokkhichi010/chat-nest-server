import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/message/message.service';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { SocketService } from './socket.service';
import { ObjectId, Types } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ContactService } from 'src/contact/contact.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({ cors: { origin: process.env.APP_URL, credentials: false }, transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messageService: MessageService,
    private readonly socketService: SocketService,
    private readonly contactService: ContactService,
    private readonly userService: UsersService,
    private readonly notificationService: NotificationsService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    const clientId = socket.id;
    const token = socket.handshake.auth.token;

    if (!token) {
      return socket.disconnect();
    }

    const clientServerConnection = await this.socketService.connectClient(clientId, token);
    const { userId, deviceId } = clientServerConnection;

    this.messageService.getNewMessages(userId);
    // const connectionId = this.contactService.getGroupId(userId,)
    // let messages2: any = this.messageService.getMessages({ limit: 100, page: 1, search: "", connectionId, contactUser: userId, userId: contactUser });

    let contacts1: any = this.contactService.getContacts({ userId, limit: 100, page: 1, search: "" });
    let users1: any = this.userService.getUsers({ userId, limit: 100, page: 1, search: "" });

    [contacts1, users1] = await Promise.all([contacts1, users1]);
    this.emitEvents(userId, 'online', { contacts: contacts1, users: users1 }, () => { });

    const contactsId: Types.ObjectId[] = [];
    contacts1.results.forEach((obj: { _id: Types.ObjectId, onlineStatus: Record<string, any> }) => {
      const onlineStatus = obj?.onlineStatus;
      onlineStatus?.status === 'CONNECTED' && contactsId.push(obj._id)
    });

    for (let contactUser of contactsId) {
      let contacts: any = this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
      let messages: any = this.messageService.getMessages({ userId: contactUser, contactUser: userId, limit: 100, page: 1, search: "", connectionId: null });

      [contacts, messages] = await Promise.all([contacts, messages]);

      await this.emitEvents(contactUser, 'online', { contacts, messages }, () => { });
    }

  }

  @SubscribeMessage('new-message')
  async handleGetNewMessages(@ConnectedSocket() socket: Socket, @MessageBody() messageObj: CreateMessageDto) {
    const clientId: string = socket.id;

    const newMessage = await this.messageService.createMessage(messageObj)
    // const friendClientId = await clientServer

    socket.to('394822033os02k9a9c99s9d93').timeout(1000).emit('new-message', newMessage);
  }
  /**********************************************************************************************************/
  /**********************************************************************************************************/
  /**********************************************************************************************************/
  /**********************************************************************************************************/
  /**********************************************************************************************************/
  /**********************************************************************************************************/
  // @SubscribeMessage('message-updated')
  // messageUpdated(@ConnectedSocket() socket: Socket, @MessageBody() data: Message) {
  //   const clientId: string = socket.id;

  //   try {
  //     const { } = data
  //     const updatedMessage = await messageService.updateMessage(messageId, { isSeen: true, seenAt: new Date().toISOString() });
  //     callback({ ...updatedMessage.toObject(), status: "RECEIVED" });

  //     clientServerConnectionService.emitEventToClient(message.sender, 'message read', emitEvent, { ...updatedMessage.toObject(), status: "SENT" });
  //   } catch (error) {
  //     callback(error);
  //   }
  // }


  // @SubscribeMessage("call-request")
  // callRequest(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { type, receiver, caller, receiverName, callerName, offer } = data;
  //   const callHistory = await callHistoryService.createCallHistory({ caller, receiver, type });
  //   const responseObj = { ...callHistory.toObject(), receiverName, callerName, offer };

  //   clientServerConnectionService.emitEventToClient(receiver.userId, 'call-request', emitEvent, responseObj, (err, res) => { callback(res.length && res[0]) });
  // }


  // @SubscribeMessage("call-accepted")
  // callAccepted(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   console.log("🚀 ~ file: socket.js:53 ~ socket.on ~ data:", data)
  //   const { type, receiver, caller, receiverName, callerName, answer, _id } = data;
  //   const callHistory = await callHistoryService.callAccepted(receiver, _id);
  //   const responseObj = { ...callHistory.toObject(), receiverName, callerName, answer };

  //   const clientId = await clientServerConnectionService.getClientId({ ...caller });
  //   emitEvent(clientId, 'call-accepted', responseObj);
  // }


  // @SubscribeMessage("call-rejected")
  // callRejected(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { type, receiver, caller, receiverName, callerName, _id } = data;
  //   const callHistory = await callHistoryService.callDeclined(receiver, _id);
  //   const responseObj = { ...callHistory.toObject(), receiverName, callerName };

  //   const clientId = await clientServerConnectionService.getClientId({ ...caller });
  //   emitEvent(clientId, 'call-rejected', responseObj);
  // }


  // @SubscribeMessage("call-canceled")
  // callCanceled(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { type, receiver, caller, receiverName, callerName, _id } = data;
  //   const callHistory = await callHistoryService.callCanceled(_id);
  //   const responseObj = { ...callHistory.toObject(), receiverName, callerName };

  //   clientServerConnectionService.emitEventToClient(receiver.userId, 'call-canceled', emitEvent, responseObj);
  // }


  // @SubscribeMessage("call-end")
  // callEnd(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { type, receiver, caller, receiverName, callerName, duration } = data;
  //   const callHistory = await callHistoryService.callEnd(receiver, _id);
  //   const responseObj = { ...callHistory.toObject(), receiverName, callerName };

  //   const clientId = await clientServerConnectionService.getClientId({ ...caller });
  //   emitEvent(clientId, 'call-rejected', responseObj);
  // }


  // @SubscribeMessage("chess-connection-request")
  // chessConnectionRequest(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { player1, player2, receiverName, callerName } = data;
  //   const connection = await chessService.connect(player1, player2);
  //   const responseObj = { ...connection.toObject(), receiverName, callerName }

  //   clientServerConnectionService.emitEventToClient(player2.userId, 'chess-connection-request', emitEvent, responseObj);
  // }


  // @SubscribeMessage("chess-connection-accepted")
  // chessConnectionAccepted(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { player1, player2, _id, receiverName, callerName } = data;
  //   const connection = await chessService.accept(player2, _id);
  //   const responseObj = { ...connection.toObject(), receiverName, callerName }

  //   const clientId = await clientServerConnectionService.getClientId({ ...player1 });
  //   emitEvent(clientId, 'chess-connection-accepted', responseObj);
  // }


  // @SubscribeMessage("chess-connection-rejected")
  // chessConnectionRejected(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { player1, player2, _id, receiverName, callerName } = data;
  //   const connection = await chessService.reject(player2, _id);

  //   const responseObj = { ...connection.toObject(), receiverName, callerName }
  //   const clientId = await clientServerConnectionService.getClientId({ ...player1 });
  //   emitEvent(clientId, 'chess-connection-canceled', responseObj);
  // }


  // @SubscribeMessage("chess-connection-canceled")
  // chessConnectionCanceled(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   const { player1, player2, _id, receiverName, callerName } = data;
  //   const responseObj = { ...connection.toObject(), receiverName, callerName }

  //   const connection = await chessService.cancel(_id);
  //   clientServerConnectionService.emitEventToClient(player2.userId, 'chess-connection-rejected', emitEvent, responseObj);
  // }


  // @SubscribeMessage('move')
  // move(@ConnectedSocket() socket: Socket, @MessageBody() data: object) {
  //   const clientId: string = socket.id;

  //   try {
  //     const { userId, connectionId, from, to } = moveInfo;
  //     const chessBoard = await chessService.moveAndEmit(moveInfo, emitEvent);
  //     callback(chessBoard)
  //   } catch (error) {
  //     console.log("🚀 ~ file: socket.js:70 ~ socket.on ~ error:", error)
  //     callback(error)
  //   }
  // }

  /**********************************************************************************************************/
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
        let contacts: any = await this.contactService.getContacts({ userId: contactUser, limit: 100, page: 1, search: "" });
        await this.emitEvents(contactUser, 'offline', { contacts }, () => { });
      }
    }
  }

  emitEvents = async (userId: Types.ObjectId, event: string, data: any, callback: Function | null = null) => {
    console.log("🚀 ~ file: socket.gateway.ts:243 ~ SocketGateway ~ emitEvents= ~ userId:", userId)
    const clientIds = await this.socketService.getConnectedClientIds(userId);
    console.log("🚀 ~ file: socket.gateway.ts:245 ~ SocketGateway ~ emitEvents= ~ clientIds:", clientIds)

    const customCallback = (err: Error, res: any) => {
      if (!res[0]?.success) {
        const notification = data?.notification;
        notification && this.notificationService.createNotification({ userId, ...notification })
      }
    }

    this.server.timeout(2000).to(clientIds).emit(event, data, callback || customCallback);
  }
}
