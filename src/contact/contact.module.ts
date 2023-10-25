import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact, contactCollection, contactSchema } from './entities/contact.entity';
import { User, userCollection, userSchema } from '../users/users.entity';
import { SocketModule } from '../socket/socket.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: contactSchema, collection: contactCollection },
      { name: User.name, schema: userSchema, collection: userCollection },
    ]),
    UsersModule,
    SocketModule
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService]
})
export class ContactModule { }
