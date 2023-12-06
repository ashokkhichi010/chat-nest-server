import { Module } from '@nestjs/common';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChessConnection, chessConnectionCollection, chessConnectionSchema } from 'src/chess/entities/chess.entity';
import { Contact, contactCollection, contactSchema } from 'src/contact/entities/contact.entity';
import { User, userCollection, userSchema } from 'src/users/users.entity';
import { SocketModule } from 'src/socket/socket.module';
import { UsersModule } from 'src/users/users.module';
import { CallS, callCollection, callSchema } from './entities/call.entity';
import { ContactService } from 'src/contact/contact.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChessConnection.name, schema: chessConnectionSchema, collection: chessConnectionCollection },
      { name: Contact.name, schema: contactSchema, collection: contactCollection },
      { name: User.name, schema: userSchema, collection: userCollection },
      { name: CallS.name, schema: callSchema, collection: callCollection },
    ]),
    SocketModule,
    UsersModule,
  ],
  controllers: [CallController],
  providers: [CallService, ContactService],
  exports: [CallService]
})
export class CallModule { }