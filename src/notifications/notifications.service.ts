import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>
  ) { }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    return await this.notificationModel.create({
      ...createNotificationDto, userId: new Types.ObjectId(createNotificationDto.userId)
    });
  }

  async getNotifications(userId: Types.ObjectId) {
    return await this.notificationModel.find({ userId, isReceived: false });
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }
}
