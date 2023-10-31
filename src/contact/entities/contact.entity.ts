import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { userCollection } from "../../users/users.entity";

@Schema({ timestamps: true })
export class Contact extends Document {
  @Prop({ type: String, required: true })
  connectionId: string;

  @Prop({ type: Types.ObjectId, ref: userCollection })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: userCollection })
  contactUser: Types.ObjectId;

  @Prop({ type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', "DELETED"], default: 'PENDING' })
  status: string;

  @Prop({ type: Boolean, default: false })
  isAccepted: Boolean;

  @Prop({ type: Date, default: null })
  acceptedAt: Date;

  @Prop({ type: Boolean, default: false })
  isRejected: Boolean;

  @Prop({ type: Date, default: null })
  rejectedAt: Date;

  @Prop({ type: Boolean, default: false })
  isCanceled: Boolean;

  @Prop({ type: Date, default: null })
  canceledAt: Date;

  // @Prop({ type: Object, required: false, default: null })
  // lastMessage: object;

  @Prop({ type: Boolean, required: false, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date;
}

export const contactCollection = 'contacts';
export const contactSchema = SchemaFactory.createForClass(Contact);