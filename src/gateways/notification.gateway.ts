// // notification.gateway.ts
// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({ namespace: '/notification' }) // Specify a unique namespace
// export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer()
//     server: Server;

//     handleConnection(client: Socket) {
//         console.log(`Client connected to notification: ${client.id}`);
//     }

//     handleDisconnect(client: Socket) {
//         console.log(`Client disconnected from notification: ${client.id}`);
//     }

//     // Add event handlers for this gateway
// }
