// // chess.gateway.ts
// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({ namespace: '/chess' }) // Specify a unique namespace
// export class ChessGateway implements OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer()
//     server: Server;

//     handleConnection(client: Socket) {
//         console.log(`Client connected to chess: ${client.id}`);
//     }

//     handleDisconnect(client: Socket) {
//         console.log(`Client disconnected from chess: ${client.id}`);
//     }

//     // Add event handlers for this gateway
// }
