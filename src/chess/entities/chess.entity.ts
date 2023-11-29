import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";
import { deviceCollection } from "../../auth/entities/device.entity";
import { userCollection } from "../../users/users.entity";

@Schema({ timestamps: true })
export class ChessConnection extends Document {

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
  caller: {
    userId: Types.ObjectId;
    deviceId: Types.ObjectId;
    captured: string[];
  };

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
  receiver: {
    userId: Types.ObjectId;
    deviceId?: Types.ObjectId; // Use `?` for optional fields
    captured: string[];
  };

  @Prop({ type: Array, required: false, default: null })
  chessBoard: object[];

  @Prop({ type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'COMPLETED'], default: 'PENDING' })
  status: String | string;

  @Prop({ type: Boolean, default: false })
  isAccepted: boolean;

  @Prop({ type: Date, default: null })
  acceptedAt: Date;

  @Prop({ type: Boolean, default: false })
  isRejected: boolean;

  @Prop({ type: Date, default: null })
  rejectedAt: Date;

  @Prop({ type: Boolean, default: false })
  isCanceled: boolean;

  @Prop({ type: Date, default: null })
  canceledAt: Date;

  @Prop({ type: Types.ObjectId, ref: userCollection, required: false, default: null })
  winner: Types.ObjectId;
}

export const chessConnectionCollection = 'chess-connections'
export const chessConnectionSchema = SchemaFactory.createForClass(ChessConnection)