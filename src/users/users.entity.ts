import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true, trim: true })
  password: string;

  @Prop({ type: String, required: false, trim: true })
  image: string;

  @Prop({ type: Number, required: false, trim: true })
  phoneNumber: number;

  @Prop({ type: String, required: true, trim: true, enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ type: Boolean, required: false, default: true })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date;
}

export const userCollection = 'users';
export const userSchema = SchemaFactory.createForClass(User);
