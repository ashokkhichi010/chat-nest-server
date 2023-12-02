import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketConnection, socketConnectionCollection, socketConnectionSchema } from './entities/socketConnection.entity';
import { Token, tokenCollection, tokenSchema } from '../auth/entities/token.entity';
import { User, userCollection, userSchema } from '../users/users.entity';
import { TokenService } from '../auth/services/token.service';
import { UsersService } from '../users/users.service';
import { MessageService } from '../message/message.service';
import { Message, messageCollection, messageSchema } from '../message/entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification, notificationCollection, notificationSchema } from '../notifications/entities/notification.entity';
import { ContactService } from '../contact/contact.service';
import { Contact, contactCollection, contactSchema } from '../contact/entities/contact.entity';
import { ChessService } from 'src/chess/chess.service';
import { ChessConnection, chessConnectionCollection, chessConnectionSchema } from 'src/chess/entities/chess.entity';
import { ChessMove, chessMoveCollection, chessMoveSchema } from 'src/chess/entities/movePiece.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SocketConnection.name, schema: socketConnectionSchema, collection: socketConnectionCollection },
            { name: Token.name, schema: tokenSchema, collection: tokenCollection },
            { name: User.name, schema: userSchema, collection: userCollection },
            { name: Message.name, schema: messageSchema, collection: messageCollection },
            { name: Notification.name, schema: notificationSchema, collection: notificationCollection },
            { name: Contact.name, schema: contactSchema, collection: contactCollection },
            { name: ChessConnection.name, schema: chessConnectionSchema, collection: chessConnectionCollection },
            { name: ChessMove.name, schema: chessMoveSchema, collection: chessMoveCollection },
        ])
        // AuthModule, UsersModule, MessageModule,
    ],
    controllers: [],
    providers: [SocketGateway, SocketService, TokenService, UsersService, ContactService, MessageService, NotificationsService, ChessService],
    exports: [SocketGateway, SocketService]
})
export class SocketModule { }
