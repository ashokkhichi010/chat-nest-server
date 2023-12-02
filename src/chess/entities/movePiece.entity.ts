import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { userCollection } from "../../users/users.entity";
import { ChessPieceDto } from "../dto/create-chess.dto";
import { chessConnectionCollection } from "./chess.entity";

@Schema({ timestamps: true })
export class ChessMove extends Document {
  @Prop({ type: Types.ObjectId, ref: chessConnectionCollection, required: true, })
  connectionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: userCollection, required: true, })
  playerId: Types.ObjectId;

  @Prop({ type: ChessPieceDto, required: true })
  from: ChessPieceDto;

  @Prop({ type: ChessPieceDto, required: true })
  to: ChessPieceDto;

  @Prop({ type: Number, required: true })
  duration: number;

  @Prop({ type: Date, required: true })
  moveTime: Date;

  @Prop({ type: String, required: false, default: null })
  capturedPiece: string

  @Prop({ type: Array, required: true })
  chessBoard: ChessPieceDto[];
}

export const chessMoveCollection = 'chess-moves'
export const chessMoveSchema = SchemaFactory.createForClass(ChessMove)
