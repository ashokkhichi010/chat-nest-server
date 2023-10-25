import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";
import { deviceCollection } from "../../auth/entities/device.entity";
import { userCollection } from "../../users/users.entity";

@Schema({ timestamps: true })
export class SocketConnection extends Document {
  @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: deviceCollection, required: true })
  deviceId: Types.ObjectId;

  @Prop({ type: String, required: false })
  clientId: string

  @Prop({ type: String, enum: ['CONNECTED', 'DISCONNECTED'], default: 'CONNECTED', required: true })
  status: string
}

export const socketConnectionCollection = 'socket-connections';
export const socketConnectionSchema = SchemaFactory.createForClass(SocketConnection);
