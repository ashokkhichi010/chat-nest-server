import { Module } from '@nestjs/common';
import { ChessService } from './chess.service';
import { ChessController } from './chess.controller';
import { ContactService } from 'src/contact/contact.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChessConnection, chessConnectionCollection, chessConnectionSchema } from './entities/chess.entity';
import { Contact, contactCollection, contactSchema } from 'src/contact/entities/contact.entity';
import { User, userCollection, userSchema } from 'src/users/users.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChessConnection.name, schema: chessConnectionSchema, collection: chessConnectionCollection },
      { name: Contact.name, schema: contactSchema, collection: contactCollection },
      { name: User.name, schema: userSchema, collection: userCollection },
    ])
  ],
  controllers: [ChessController],
  providers: [ChessService, ContactService],
})
export class ChessModule { }
