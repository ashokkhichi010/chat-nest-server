import { Module } from '@nestjs/common';
import { ChessService } from './chess.service';
import { ChessController } from './chess.controller';
import { ContactService } from '../contact/contact.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChessConnection, chessConnectionCollection, chessConnectionSchema } from './entities/chess.entity';
import { Contact, contactCollection, contactSchema } from '../contact/entities/contact.entity';
import { User, userCollection, userSchema } from '../users/users.entity';
import { SocketModule } from 'src/socket/socket.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChessConnection.name, schema: chessConnectionSchema, collection: chessConnectionCollection },
      { name: Contact.name, schema: contactSchema, collection: contactCollection },
      { name: User.name, schema: userSchema, collection: userCollection },
    ]),
    SocketModule,
    UsersModule,
  ],
  controllers: [ChessController],
  providers: [ChessService, ContactService],
})
export class ChessModule { }
