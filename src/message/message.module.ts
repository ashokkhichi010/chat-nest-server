import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, messageCollection, messageSchema } from './entities/message.entity';
import { ContactService } from '../contact/contact.service';
import { Contact, contactCollection, contactSchema } from 'src/contact/entities/contact.entity';
import { User, userCollection, userSchema } from 'src/users/users.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { SocketModule } from 'src/socket/socket.module';
import { SocketService } from 'src/socket/socket.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: messageSchema, collection: messageCollection },
      { name: Contact.name, schema: contactSchema, collection: contactCollection },
      { name: User.name, schema: userSchema, collection: userCollection },
    ]),
    SocketModule,
    // ContactModule
    // UsersModule
  ],
  controllers: [MessageController],
  providers: [MessageService, ContactService],
  exports: [MessageService]
})
export class MessageModule { }
