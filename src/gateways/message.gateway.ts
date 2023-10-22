// // message.gateway.ts
// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';


// @WebSocketGateway({ namespace: '/message', cors: { origin: process.env.APP_URL, credentials: false }, transports: ['websocket'] })
// export class messageGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   handleConnection(socket: Socket) {
//     const clientId = socket.id;
//     const token = socket.handshake.auth
//     console.log("🚀 ~ file: message.gateway.ts:14 ~ messageGateway ~ handleConnection ~ token:", token);
//     console.log(`Client connected to message: ${clientId}`);

//     token || socket.disconnect()
//   }

//   handleDisconnect(client: Socket) {
//     console.log(`Client disconnected from message: ${client.id}`);
//   }

//   @SubscribeMessage('new-message')
//   handleGetNewMessages(@MessageBody() data: object, @ConnectedSocket() socket: Socket) {
//     const clientId: string = socket.id;

//   }

//   // Add event handlers for this gateway
// }
