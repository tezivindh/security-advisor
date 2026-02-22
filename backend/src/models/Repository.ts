import mongoose, { Document, Schema } from 'mongoose';

export interface IRepository extends Document {
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  githubRepoId: number;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  language: string;
  htmlUrl: string;
  scanningEnabled: boolean;
  lastScanId?: mongoose.Types.ObjectId;
  lastScanScore?: number;
  lastScanAt?: Date;
  prAutomationEnabled: boolean;
  webhookId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const repositorySchema = new Schema<IRepository>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    githubRepoId: { type: Number, required: true, index: true },
    fullName: { type: String, required: true },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    private: { type: Boolean, default: false },
    defaultBranch: { type: String, default: 'main' },
    language: { type: String, default: '' },
    htmlUrl: { type: String, default: '' },
    scanningEnabled: { type: Boolean, default: false },
    lastScanId: { type: Schema.Types.ObjectId, ref: 'Scan' },
    lastScanScore: { type: Number, min: 0, max: 100 },
    lastScanAt: { type: Date },
    prAutomationEnabled: { type: Boolean, default: false },
    webhookId: { type: Number },
  },
  { timestamps: true }
);

repositorySchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

export const Repository = mongoose.model<IRepository>('Repository', repositorySchema);
