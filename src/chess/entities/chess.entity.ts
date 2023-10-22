import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";
import { deviceCollection } from "src/auth/entities/device.entity";
import { userCollection } from "src/users/users.entity";

@Schema({ timestamps: true })
export class ChessConnection extends Document {

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
  "player1.userId": ObjectId

  @Prop({ type: Types.ObjectId, ref: deviceCollection, required: true })
  "player1.deviceId": ObjectId

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
  "player2.userId": ObjectId

  @Prop({ type: Types.ObjectId, ref: deviceCollection, required: false })
  "player2.deviceId": ObjectId

  @Prop({ type: Array, required: true })
  chessBoard: object[]

  @Prop({ type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'COMPLETED'], default: 'PENDING' })
  status: String | string

  @Prop({ type: Boolean, default: false })
  isAccepted: boolean

  @Prop({ type: Date, default: null })
  acceptedAt: Date

  @Prop({ type: Boolean, default: false })
  isRejected: boolean

  @Prop({ type: Date, default: null })
  rejectedAt: Date

  @Prop({ type: Boolean, default: false })
  isCanceled: boolean

  @Prop({ type: Date, default: null })
  canceledAt: Date

  @Prop({ type: Types.ObjectId, ref: userCollection, required: false, default: null })
  winner: ObjectId

}

export const chessConnectionCollection = 'chess-connections'
export const chessConnectionSchema = SchemaFactory.createForClass(ChessConnection)