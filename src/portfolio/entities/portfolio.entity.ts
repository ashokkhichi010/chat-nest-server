import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PortfolioStockDto } from '../dto/portfolio.dto';
import { userCollection } from 'src/users/users.entity';

@Schema({ timestamps: true })
export class Portfolio extends Document {
    @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
    userId: Types.ObjectId;

    @Prop({ type: Number, default: 100000 })
    balance: number

    @Prop({ type: [PortfolioStockDto], enum: ['active', 'expired', 'cancelled'], default: 'active' })
    stocks: PortfolioStockDto[];
}

export const portfolioCollection = 'portfolios';
export const portfolioSchema = SchemaFactory.createForClass(Portfolio);
