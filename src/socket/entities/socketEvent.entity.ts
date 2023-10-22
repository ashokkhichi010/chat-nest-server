import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class SocketEvent extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Object, required: true })
  data: object;
}

export const socketEventCollection = 'socket-events';
export const socketEventSchema = SchemaFactory.createForClass(SocketEvent);