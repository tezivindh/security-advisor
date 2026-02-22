import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  encryptedAccessToken: string;
  plan: 'free' | 'pro' | 'enterprise';
  scansUsedThisMonth: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    login: { type: String, required: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    encryptedAccessToken: { type: String, required: true, select: false },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    scansUsedThisMonth: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
