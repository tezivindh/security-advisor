'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  Bot,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { prApi, githubApi } from '@/lib/api';
import { PRReview, Repository, Severity } from '@/types';
import { getSeverityBadgeClass, formatRelative, cn } from '@/lib/utils';

function PRReviewCard({ review }: { review: PRReview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <GitPullRequest className="h-4 w-4 text-purple-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            PR #{review.prNumber}{review.prTitle ? ` — ${review.prTitle}` : ''}
          </div>
          <div className="text-xs text-white/40 mt-0.5 font-mono truncate">
            {review.prUrl ?? ''}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.findings.length > 0 ? (
            <span className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded-full">
              {review.findings.length} issue{review.findings.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs text-green-400 border border-green-500/20 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Clean
            </span>
          )}
          <span className="text-xs text-white/30">{formatRelative(review.createdAt)}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-white/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Findings */}
          {review.findings.length > 0 && (
            <div>
              <div className="text-xs text-white/40 mb-2">Findings</div>
              <div className="space-y-2">
                {review.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 mt-0.5',
                        getSeverityBadgeClass(f.severity as Severity)
                      )}
                    >
                      {f.severity}
                    </span>
                    <div>
                      <div className="text-sm">{f.message}</div>
                      <div className="text-xs text-white/30 font-mono mt-0.5">
                        {f.filePath}:{f.lineStart}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bot Comment Preview */}
          {review.reviewBody && (
            <div>
              <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
                <Bot className="h-3 w-3 text-blue-400" />
                <span className="text-blue-400">Bot Comment Preview</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/60 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {review.reviewBody}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PRAutomationPage() {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(true);
  const [autoReview, setAutoReview] = useState(true);
  const [repos, setRepos] = useState<{ id: string; fullName: string }[]>([]);

  // Load real tracked repos on mount
  useEffect(() => {
    const fetchRepos = async () => {
      setReposLoading(true);
      try {
        const { data } = await githubApi.listRepos();
        const tracked = (data.repos as Repository[])
          .filter((r) => r.tracked && r._id)
          .map((r) => ({ id: r._id as string, fullName: r.fullName }));
        setRepos(tracked);
        if (tracked.length > 0) setSelectedRepoId(tracked[0].id);
      } catch {}
      setReposLoading(false);
    };
    fetchRepos();
  }, []);

  const loadReviews = async (repoId: string) => {
    setLoading(true);
    try {
      const { data } = await prApi.getRepositoryPRs(repoId);
      setReviews(data.reviews ?? []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedRepoId) loadReviews(selectedRepoId);
  }, [selectedRepoId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">PR Automation</h1>
        <p className="text-white/40 text-sm mt-1">
          Automated security review bot for pull requests
        </p>
      </div>

      {/* How It Works Banner */}
      <div className="border border-purple-500/20 bg-purple-500/5 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-purple-300">How it works</div>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              When a PR is opened or updated, the GitHub webhook sends a diff to the security
              analyzer. The bot posts a comment summarizing newly introduced vulnerabilities,
              their severity, and AI-generated fix suggestions directly into the PR.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Repo Selector */}
        <select
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          disabled={reposLoading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer disabled:opacity-50"
        >
          {reposLoading ? (
            <option className="bg-[#0d0d0d]">Loading repositories…</option>
          ) : repos.length === 0 ? (
            <option className="bg-[#0d0d0d]">No tracked repositories — enable scanning first</option>
          ) : (
            <>
              <option value="" className="bg-[#0d0d0d]">Select a repository…</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0d0d0d]">
                  {r.fullName}
                </option>
              ))}
            </>
          )}
        </select>

        {/* Auto Review Toggle */}
        <button
          onClick={() => setAutoReview(!autoReview)}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm hover:bg-white/5 transition-colors"
        >
          {autoReview ? (
            <>
              <ToggleRight className="h-5 w-5 text-green-400" />
              <span className="text-green-400">Auto-review ON</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5 text-white/30" />
              <span className="text-white/50">Auto-review OFF</span>
            </>
          )}
        </button>

        {/* Refresh */}
        {selectedRepoId && (
          <button
            onClick={() => loadReviews(selectedRepoId)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        )}
      </div>

      {/* Reviews List */}
      {!selectedRepoId ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <GitPullRequest className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Select a repository to view PR reviews</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <AlertTriangle className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No PR reviews found for this repository</p>
          <p className="text-white/20 text-xs mt-1">
            Open a pull request with the webhook configured to see reviews here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <PRReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
