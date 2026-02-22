export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TeamRole = 'owner' | 'developer' | 'viewer';
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: UserPlan;
}

export interface Repository {
  id: number;
  _id?: string;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string;
  description: string | null;
  stargazersCount: number;
  updatedAt: string | null;
  // DB fields
  scanningEnabled: boolean;
  lastScanScore: number | null;
  lastScanAt: string | null;
  prAutomationEnabled: boolean;
  tracked: boolean;
}

export interface Scan {
  _id: string;
  repositoryId: string | Repository;
  status: ScanStatus;
  branch: string;
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
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
}

export interface Vulnerability {
  _id: string;
  scanId: string;
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: string;
  owaspId: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  aiConfirmed: boolean;
  aiExplanation?: string;
  aiPatchSuggestion?: string;
  aiImpactSummary?: string;
  patchApplied: boolean;
  prUrl?: string;
  falsePositive: boolean;
  createdAt: string;
}

export interface Team {
  _id: string;
  name: string;
  slug: string;
  plan: UserPlan;
  role?: string; // populated from TeamMember when returned via getMyTeams
}

export interface TeamMember {
  _id: string;
  teamId: string;
  userId: User;
  role: TeamRole;
  joinedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PRReview {
  _id: string;
  repositoryId: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
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
  reviewBody?: string;
  createdAt: string;
}

export interface LiveScanResult {
  domain: string;
  scannedAt: string;
  overallScore: number;
  checks: LiveCheckResult[];
  // convenience counts (computed client-side)
  passCount?: number;
  warnCount?: number;
  failCount?: number;
}

export interface LiveCheckResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  message: string;
  details?: string;
  recommendation?: string;
}

export interface DashboardSummary {
  globalScore: number;
  recentScans: Scan[];
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  owaspDistribution: Array<{ _id: string; count: number }>;
}

// Shape returned by /trends/repository/:id
export interface TrendData {
  date: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Shape returned by /trends/global  (Mongo $group aggregation)
export interface GlobalTrendData {
  _id: string;       // date string, e.g. "2026-02-22"
  avgScore: number;
  totalCritical: number;
  totalHigh: number;
}

export interface DemoAnalysisResult {
  securityScore: number;
  owaspMapping: string;
  owaspId: string;
  severity: string;
  explanation: string;
  suggestedFix: string;
  confirmed: boolean;
}
