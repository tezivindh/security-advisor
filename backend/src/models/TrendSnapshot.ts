import mongoose, { Document, Schema } from 'mongoose';

export interface ITrendSnapshot extends Document {
  repositoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  securityScore: number;
  vulnerabilityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  owaspDistribution: Record<string, number>;
  improvementPercent?: number;
  recurrentVulnerabilityIds: string[];
  snapshotAt: Date;
  createdAt: Date;
}

const trendSnapshotSchema = new Schema<ITrendSnapshot>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    scanId: { type: Schema.Types.ObjectId, ref: 'Scan', required: true },
    securityScore: { type: Number, required: true },
    vulnerabilityCounts: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    owaspDistribution: { type: Map, of: Number, default: {} },
    improvementPercent: { type: Number },
    recurrentVulnerabilityIds: [{ type: String }],
    snapshotAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const TrendSnapshot = mongoose.model<ITrendSnapshot>('TrendSnapshot', trendSnapshotSchema);
