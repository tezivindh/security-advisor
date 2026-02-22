import { Severity } from '../../models/Vulnerability';

interface VulnCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 25,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};

const MAX_DEDUCTION = 100;

export function calculateSecurityScore(counts: VulnCount): number {
  let totalDeduction = 0;

  totalDeduction += counts.critical * SEVERITY_WEIGHTS.critical;
  totalDeduction += counts.high * SEVERITY_WEIGHTS.high;
  totalDeduction += counts.medium * SEVERITY_WEIGHTS.medium;
  totalDeduction += counts.low * SEVERITY_WEIGHTS.low;

  // Cap deduction at 100
  totalDeduction = Math.min(totalDeduction, MAX_DEDUCTION);

  return Math.max(0, 100 - totalDeduction);
}

export function countBySeverity(severities: Severity[]): VulnCount {
  return severities.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  );
}

export function buildOwaspDistribution(owaspIds: string[]): Record<string, number> {
  return owaspIds.reduce(
    (acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
