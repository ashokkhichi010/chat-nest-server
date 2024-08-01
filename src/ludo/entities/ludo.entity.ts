import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { userCollection } from "../../users/users.entity";
import { LudoPlayer, PlayerPieceDto } from "../dto/piece-info.dto";

@Schema({ timestamps: true })
export class LudoConnection extends Document {

    @Prop({ type: Array, ref: 'User', required: true })
    players: LudoPlayer[];

    @Prop({ type: Number, required: true })
    roomNumber: number;
    
    @Prop({ type: String, enum: ['PENDING', 'STARTED', 'CANCELED', 'COMPLETED'], default: 'PENDING' })
    status: String | string;

    @Prop({ type: Array, required: true })
    piecesInfo: PlayerPieceDto[];

    @Prop({ type: Boolean, default: false })
    isStarted: boolean;

    @Prop({ type: Date, default: null })
    startedAt: Date;

    @Prop({ type: Boolean, default: false })
    isCanceled: boolean;

    @Prop({ type: Date, default: null })
    canceledAt: Date;

    @Prop({ type: Date, default: null })
    sessionTimeOut: Date;

    @Prop({ type: Array, ref: userCollection, required: false, default: [] })
    winners: Types.ObjectId[];
}

export const ludoCollection = 'ludo-connections'
export const ludoSchema = SchemaFactory.createForClass(LudoConnection)