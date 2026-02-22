import mongoose, { Document, Schema } from 'mongoose';

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScanTrigger = 'manual' | 'scheduled' | 'pr' | 'webhook';

export interface IScan extends Document {
  repositoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  trigger: ScanTrigger;
  status: ScanStatus;
  branch: string;
  commitSha?: string;
  securityScore: number;
  totalFiles: number;
  scannedFiles: number;
  vulnerabilityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  owaspDistribution: Record<string, number>;
  aiSummary?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const scanSchema = new Schema<IScan>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    trigger: { type: String, enum: ['manual', 'scheduled', 'pr', 'webhook'], required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    branch: { type: String, required: true },
    commitSha: { type: String },
    securityScore: { type: Number, default: 100, min: 0, max: 100 },
    totalFiles: { type: Number, default: 0 },
    scannedFiles: { type: Number, default: 0 },
    vulnerabilityCounts: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    owaspDistribution: { type: Map, of: Number, default: {} },
    aiSummary: { type: String },
    errorMessage: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

export const Scan = mongoose.model<IScan>('Scan', scanSchema);
