import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { userCollection } from '../../users/users.entity';

const environments = ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'UAT', 'LOCAL']

@Schema({ timestamps: true })
export class Device extends Document {
  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: userCollection, required: true })
  userId: string;

  @Prop({ type: String, enum: environments, required: true, })
  appEnvironment: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, enum: ['IOS', 'ANDROID', 'WEB'], required: true })
  deviceType: string;

  @Prop({ type: String, required: true })
  deviceName: string;

  @Prop({ type: String, required: false, default: null })
  deviceToken: string;

  @Prop({ type: String, required: true })
  osVersion: string;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: Date, required: false, default: Date.now() })
  lastLogin: string;

  @Prop({ type: Date, required: false, default: null })
  lastLogout: string;

  @Prop({ type: String, enum: ['LOGIN', 'LOGOUT'], default: 'LOGIN' })
  loginStatus: string;
}

export const deviceCollection = 'devices';
export const deviceSchema = SchemaFactory.createForClass(Device);
