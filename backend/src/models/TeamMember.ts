import mongoose, { Document, Schema } from 'mongoose';

export type TeamRole = 'owner' | 'developer' | 'viewer';

export interface ITeamMember extends Document {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: TeamRole;
  invitedByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'developer', 'viewer'], default: 'viewer' },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);
