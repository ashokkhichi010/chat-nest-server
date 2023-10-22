import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId, Types } from 'mongoose';
import { deviceCollection } from './device.entity';
import { userCollection } from '../../users/users.entity';

@Schema({ timestamps: true })
export class Token {
  @Prop({ type: Types.ObjectId, ref: userCollection, required: true, trim: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: deviceCollection, required: false, trim: true })
  device: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  token: string;

  @Prop({ type: String, required: true, trim: true })
  type: string;

  @Prop({ type: Date, required: true })
  expires: Date;

  @Prop({ type: String, required: false })
  blacklisted: string;
}

export const tokenCollection = 'tokens';
export const tokenSchema = SchemaFactory.createForClass(Token);
