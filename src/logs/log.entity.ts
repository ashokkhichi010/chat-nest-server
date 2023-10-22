import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Log extends Document {
  @Prop({ type: String, required: true, default: null }) uri: string;
  @Prop({ type: Object, required: true, default: null }) headers: object;
  @Prop({ type: String, required: true, default: null }) method: string;
  @Prop({ type: String, required: true, default: null }) ipAddress: string;
  @Prop({ type: Object, required: true, default: null }) body: object;
  @Prop({ type: Object, required: true, default: null }) params: object;
  @Prop({ type: Object, required: true, default: null }) query: object;
  @Prop({ type: Date, required: true, default: null }) startTime: Date;
  @Prop({ type: Date, required: true, default: null }) endTime: Date;
  @Prop({ type: Number, required: true, default: null }) rtime: number;
  @Prop({ type: Number, required: true, default: null }) status: number;
  @Prop({ type: Object, required: true, default: null }) response: object;
}

export const logCollection = 'logs';
export const logSchema = SchemaFactory.createForClass(Log);
