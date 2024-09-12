import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { userCollection } from 'src/users/users.entity';

@Schema({ timestamps: true })
export class AIRecommendation extends Document {
    @Prop({ type: String, required: true })
    stockSymbol: String;

    @Prop({ type: String, enum: ['buy', 'sell', 'hold'], required: true })
    recommendationType: String;

    @Prop({ type: Number, required: true })
    confidenceScore: Number;

    @Prop({ type: String })
    analysis: String;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop({ type: Types.ObjectId, ref: userCollection })
    userId: Types.ObjectId;
}

export const aiRecommendationCollection = 'aiRecommendations';
export const aiRecommendationSchema = SchemaFactory.createForClass(AIRecommendation);