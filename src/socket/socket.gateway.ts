import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../message/message.service';
import { SocketService } from './socket.service';
import { ObjectId, Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactService } from '../contact/contact.service';
import { UsersService } from '../users/users.service';
import { Message } from '../message/entities/message.entity';
import { EmitEventDto } from './dto/create-socket.dto';

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
    if (!clientServerConnection) {
      return socket.disconnect();
    }

    const { userId, deviceId } = clientServerConnection;

    await this.messageService.getNewMessages(userId);
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

      await this.emitEvents(contactUser, 'online', { contacts, messages, friendId: userId }, () => { });
    }

  }

  @SubscribeMessage('message-read')
  async handleMessageRead(@MessageBody() messageObj: Message) {
    const { _id, sender, receiver } = messageObj;
    console.log("🚀 ~ file: socket.gateway.ts:224 ~ SocketGateway ~ handleMessageRead ~ _id:", _id);
    const updatedMessage = await this.messageService.updateMessage(_id, { isSeen: true, seenAt: new Date().toISOString() })

    let contacts1: any = this.contactService.getContacts({ userId: sender, limit: 100, page: 1 });
    let contacts2: any = this.contactService.getContacts({ userId: receiver, limit: 100, page: 1 });

    [contacts1, contacts2] = await Promise.all([contacts1, contacts2]);

    await this.emitEvents(sender, 'message-read', { message: updatedMessage, contacts: contacts1 });
    await this.emitEvents(receiver, 'message-read', { message: updatedMessage, contacts: contacts2 });
  }

  @SubscribeMessage('connect-chess-connection')
  async handleChessConnection(@MessageBody() { userId, contactUser }: { userId: ObjectId, contactUser: ObjectId }) {
    // const updatedMessage = await this.messageService.updateMessage(_id, { isSeen: true, seenAt: new Date().toISOString() })

    // let contacts1: any = this.contactService.getContacts({ userId: sender, limit: 100, page: 1 });
    // let contacts2: any = this.contactService.getContacts({ userId: receiver, limit: 100, page: 1 });

    // [contacts1, contacts2] = await Promise.all([contacts1, contacts2]);

    // await this.emitEvents(sender, 'message-read', { message: updatedMessage, contacts: contacts1 });
    // await this.emitEvents(receiver, 'message-read', { message: updatedMessage, contacts: contacts2 });
  }

  @SubscribeMessage('chess-move-piece')
  async handleChessMovePiece(@MessageBody() { userId, contactUser }: { userId: ObjectId, contactUser: ObjectId }) {
    // const updatedMessage = await this.messageService.updateMessage(_id, { isSeen: true, seenAt: new Date().toISOString() })

    // let contacts1: any = this.contactService.getContacts({ userId: sender, limit: 100, page: 1 });
    // let contacts2: any = this.contactService.getContacts({ userId: receiver, limit: 100, page: 1 });

    // [contacts1, contacts2] = await Promise.all([contacts1, contacts2]);

    // await this.emitEvents(sender, 'message-read', { message: updatedMessage, contacts: contacts1 });
    // await this.emitEvents(receiver, 'message-read', { message: updatedMessage, contacts: contacts2 });
  }

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

  emitEvents = async (
    userId: Types.ObjectId,
    event: string,
    data: any,
    callback: Function | null = null,
    deviceId: Types.ObjectId = null,
    timeout: number = 2000
  ) => {
    const clientIds = deviceId ? [await this.socketService.getClientId({ userId, deviceId })] : await this.socketService.getConnectedClientIds(userId);
    console.log("🚀 ~ file: socket.gateway.ts:133 ~ SocketGateway ~ clientIds:", clientIds)

    const customCallback = (err: Error, res: any) => {
      if (!res[0]?.success) {
        const notification = data?.notification;
        notification && this.notificationService.createNotification({ userId, ...notification })
      }
    }

    clientIds.length && this.server.timeout(timeout).to(clientIds).emit(event, data, callback || customCallback);
  }
}
