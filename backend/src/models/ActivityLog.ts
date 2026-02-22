import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  action: string;
  resourceType: 'repository' | 'scan' | 'team' | 'pr' | 'liveScan' | 'user';
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    action: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ['repository', 'scan', 'team', 'pr', 'liveScan', 'user'],
      required: true,
    },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Auto-expire after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
