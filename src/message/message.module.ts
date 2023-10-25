import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, messageCollection, messageSchema } from './entities/message.entity';
import { ContactService } from '../contact/contact.service';
import { Contact, contactCollection, contactSchema } from '../contact/entities/contact.entity';
import { User, userCollection, userSchema } from '../users/users.entity';
import { SocketModule } from '../socket/socket.module';

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
