import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Severity } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-green-500';
    case 'info': return 'text-blue-500';
    default: return 'text-gray-500';
  }
}

export function getSeverityBadgeClass(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'security-badge-critical';
    case 'high': return 'security-badge-high';
    case 'medium': return 'security-badge-medium';
    case 'low': return 'security-badge-low';
    case 'info': return 'security-badge-info';
    default: return '';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Critical';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelative(date: string | Date): string {
  const now = Date.now();
  const ts = new Date(date).getTime();
  const diff = now - ts;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function getOAuthGithubUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${apiUrl}/api/auth/github`;
}
