import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: 'free' | 'pro' | 'enterprise';
  activeScans: number;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    activeScans: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', teamSchema);
