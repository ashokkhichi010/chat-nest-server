import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { userCollection } from "src/users/users.entity";

@Schema({ timestamps: true })
export class CallS extends Document {
    @Prop({ type: Object, required: true })
    caller: {
        userId: Types.ObjectId;
        deviceId: Types.ObjectId;
    };

    @Prop({ type: Object, required: true })
    receiver: {
        userId: Types.ObjectId;
        deviceId: Types.ObjectId | null; // You can omit the "= null" here
    };

    @Prop({ type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'COMPLETED'], default: 'PENDING' })
    status: String | string;

    @Prop({ type: Number, required: false, default: 0 })
    duration: number;

    @Prop({ type: String, enum: ['VOICE', 'VIDEO'], default: 'VOICE' })
    type: string;

    @Prop({ type: Types.ObjectId, ref: userCollection, default: null })
    disconnectedBy: Types.ObjectId | null;

    @Prop({ type: Date, default: null })
    disconnectedAt: Date;

    @Prop({ type: Boolean, default: false })
    isAccepted: boolean;

    @Prop({ type: Date, default: null })
    acceptedAt: Date;

    @Prop({ type: Boolean, default: false })
    isRejected: boolean;

    @Prop({ type: Date, default: null })
    rejectedAt: Date;

    @Prop({ type: Boolean, default: false })
    isCanceled: boolean;

    @Prop({ type: Date, default: null })
    canceledAt: Date;
}

export const callCollection = 'calls'
export const callSchema = SchemaFactory.createForClass(CallS)