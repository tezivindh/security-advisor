import mongoose, { Document, Schema } from 'mongoose';

export interface IPRReview extends Document {
  repositoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  headSha: string;
  baseSha: string;
  status: 'pending' | 'reviewed' | 'failed';
  findings: Array<{
    filePath: string;
    lineStart: number;
    lineEnd: number;
    severity: string;
    owaspCategory: string;
    message: string;
    suggestion: string;
  }>;
  reviewCommentId?: number;
  reviewBody?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prReviewSchema = new Schema<IPRReview>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    prNumber: { type: Number, required: true },
    prTitle: { type: String, required: true },
    prUrl: { type: String, required: true },
    headSha: { type: String, required: true },
    baseSha: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'failed'], default: 'pending' },
    findings: [
      {
        filePath: String,
        lineStart: Number,
        lineEnd: Number,
        severity: String,
        owaspCategory: String,
        message: String,
        suggestion: String,
      },
    ],
    reviewCommentId: { type: Number },
    reviewBody: { type: String, maxlength: 10000 },
  },
  { timestamps: true }
);

export const PRReview = mongoose.model<IPRReview>('PRReview', prReviewSchema);
