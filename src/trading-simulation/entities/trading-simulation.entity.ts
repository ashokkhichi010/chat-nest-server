import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { portfolioCollection } from 'src/portfolio/entities/portfolio.entity';
import { userCollection } from 'src/users/users.entity';

@Schema({ timestamps: true })
export class Trade extends Document {
    @Prop({ type: String, required: true })
    stockSymbol:  String;

    @Prop({ type: String, enum: ['buy', 'sell'], required: true })
    tradeType:  String;

    @Prop({ type: Number, required: true })
    quantity:  Number;

    @Prop({ type: Number, required: true })
    price:  Number;

    @Prop({ type: Number, required: true })
    totalValue:  Number;

    @Prop({ type: Date, default: Date.now })
    tradeDate:  Date;

    @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: portfolioCollection, required: true })
    portfolioId: Types.ObjectId;
}

export const tradeCollection = 'trades';
export const tradeSchema = SchemaFactory.createForClass(Trade);