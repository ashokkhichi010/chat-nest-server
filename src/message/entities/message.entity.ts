import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  receiver: Types.ObjectId;

  @Prop({ type: String, required: true })
  connectionId: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, required: false, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date;

  @Prop({ type: Boolean, required: false, default: true })
  isSent: boolean;

  @Prop({ type: Date, required: false, default: null })
  sentAt: Date;

  @Prop({ type: Boolean, required: false, default: false })
  isSeen: boolean;

  @Prop({ type: Date, required: false, default: null })
  seenAt: Date;

  @Prop({ type: Boolean, required: false, default: false })
  isReceived: boolean;

  @Prop({ type: Date, required: false, default: null })
  receivedAt: Date;
}

export const messageCollection = 'messages';
export const messageSchema = SchemaFactory.createForClass(Message);