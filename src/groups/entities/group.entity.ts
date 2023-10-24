import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Groups extends Document {
    @Prop({ type: String, required: true, trim: true })
    name: string;

    @Prop({ type: String, required: true, trim: true })
    description: string;

    @Prop({ type: String, required: false, trim: true })
    image: string;

    @Prop({ type: Array, required: true })
    users: Types.ObjectId[];

    @Prop({ type: Boolean, required: false, default: false })
    isDeleted: boolean;

    @Prop({ type: Date, required: false, default: null })
    deletedAt: Date;
}

export const groupsCollection = 'Groups';
export const groupsSchema = SchemaFactory.createForClass(Groups);
