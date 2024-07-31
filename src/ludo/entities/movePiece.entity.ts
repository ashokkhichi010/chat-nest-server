import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { userCollection } from "../../users/users.entity";
import { ludoCollection } from "./ludo.entity";

@Schema({ timestamps: true })
export class LudoMove extends Document {
  @Prop({ type: Types.ObjectId, ref: ludoCollection, required: true, })
  connectionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true, })
  playerId: Types.ObjectId;

  @Prop({ type: String, required: true })
  pieceIndex: string;

  @Prop({ type: String, required: true })
  from: string;

  @Prop({ type: String, required: true })
  to: string;

  @Prop({ type: Number, required: true })
  duration: number;

  @Prop({ type: Date, required: true })
  moveTime: Date;

  @Prop({ type: String, required: false, default: null })
  capturedPiece: string
}

export const ludoMoveCollection = 'ludo-moves'
export const ludoMoveSchema = SchemaFactory.createForClass(LudoMove)
