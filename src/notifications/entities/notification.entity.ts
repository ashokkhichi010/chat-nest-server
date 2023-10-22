import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: Types.ObjectId, required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, required: true, trim: true })
    title: string;

    @Prop({ type: String, required: true, trim: true })
    body: string;

    @Prop({ type: Boolean, required: false, default: true })
    isReceived: boolean;

    @Prop({ type: Date, required: false, default: null })
    receivedAt: Date;

    @Prop({ type: Boolean, required: false, default: false })
    isDeleted: boolean;

    @Prop({ type: Date, required: false, default: null })
    deletedAt: Date;
}

export const notificationCollection = 'notification';
export const notificationSchema = SchemaFactory.createForClass(Notification);
