import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentInfoDto } from '../dto/payment-info.dto';
import { userCollection } from 'src/users/users.entity';

@Schema({ timestamps: true })
export class Subscription extends Document {
    @Prop({ type: Types.ObjectId, ref: userCollection, required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, enum: ['free', 'basic', 'premium'], required: true })
    plan: string;

    @Prop({ type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' })
    status:string;

    @Prop({ type: Date, default: Date.now })
    startDate: string;

    @Prop({ type: PaymentInfoDto, required: true })
    paymentInfo: PaymentInfoDto;

    @Prop({ type: Boolean, required: false, default: false })
    isDeleted: boolean;

    @Prop({ type: Date, required: false, default: null })
    deletedAt: Date;
}

export const SubscriptionCollection = 'subscriptions';
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
