import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, notificationCollection, notificationSchema } from './entities/notification.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: notificationSchema, collection: notificationCollection },
    ])
  ],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule { }
