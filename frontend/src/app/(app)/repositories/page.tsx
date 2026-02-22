'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  GitBranch,
  Lock,
  Unlock,
  Zap,
  RefreshCw,
  Search,
  Star,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { githubApi, scannerApi } from '@/lib/api';
import { Repository } from '@/types';
import { getScoreColor, formatRelative, cn } from '@/lib/utils';

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanQueued, setScanQueued] = useState<string | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const { data } = await githubApi.listRepos();
      setRepos(data.repos);
    } catch {}
    setLoading(false);
  };

  const handleToggle = async (repo: Repository) => {
    setToggling(repo.id);
    try {
      const enabled = !repo.scanningEnabled;
      const { data } = await githubApi.toggleScanning(repo.id, {
        enabled,
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.owner,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        htmlUrl: repo.htmlUrl,
        isPrivate: repo.private,
      });
      setRepos((prev) =>
        prev.map((r) =>
          r.id === repo.id
            ? {
                ...r,
                ...data.repo,
                id: r.id,                          // keep GitHub numeric id
                _id: data.repo._id?.toString(),    // MongoDB _id as string
                scanningEnabled: enabled,
                tracked: enabled,                  // tracked once scanning is enabled
              }
            : r
        )
      );
    } catch {}
    setToggling(null);
  };

  const handleScan = async (repo: Repository) => {
    const repoId = repo._id;
    if (!repoId) return;
    setScanning(repo.fullName);
    try {
      await scannerApi.triggerScan(repoId);
      setScanQueued(repo.fullName);
      setTimeout(() => setScanQueued(null), 3000);
    } catch {}
    setScanning(null);
  };

  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (r.language || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-white/40 text-sm mt-1">Manage and scan your GitHub repositories</p>
        </div>
        <button
          onClick={loadRepos}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Repository List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((repo, i) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border border-white/10 rounded-xl p-4 hover:border-white/20 hover:bg-white/2 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Repo info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-white/30 shrink-0" />
                    <span className="font-medium text-sm truncate">{repo.fullName}</span>
                    {repo.private ? (
                      <Lock className="h-3 w-3 text-white/30 shrink-0" />
                    ) : (
                      <Unlock className="h-3 w-3 text-white/20 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {repo.language && (
                      <span className="text-xs text-white/30">{repo.language}</span>
                    )}
                    {repo.stargazersCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Star className="h-3 w-3" />
                        {repo.stargazersCount}
                      </span>
                    )}
                    {repo.lastScanAt && (
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="h-3 w-3" />
                        Last scan: {formatRelative(repo.lastScanAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                {repo.lastScanScore !== null && (
                  <div className="text-center">
                    <div className={cn('text-lg font-bold', getScoreColor(repo.lastScanScore))}>
                      {repo.lastScanScore}
                    </div>
                    <div className="text-xs text-white/30">score</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Enable/Disable toggle */}
                  <button
                    onClick={() => handleToggle(repo)}
                    disabled={toggling === repo.id}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                      repo.scanningEnabled
                        ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {toggling === repo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : repo.scanningEnabled ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {repo.scanningEnabled ? 'Enabled' : 'Enable'}
                  </button>

                  {/* Scan button */}
                  {repo.scanningEnabled && (
                    <button
                      onClick={() => handleScan(repo)}
                      disabled={scanning === repo.fullName || !repo._id}
                      className={cn(
                        'flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-colors',
                        scanQueued === repo.fullName
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                      )}
                    >
                      {scanning === repo.fullName ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : scanQueued === repo.fullName ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {scanning === repo.fullName
                        ? 'Scanning…'
                        : scanQueued === repo.fullName
                        ? 'Queued!'
                        : 'Scan'}
                    </button>
                  )}

                  {/* View details */}
                  {repo.tracked && (
                    <Link
                      href={`/repositories/${encodeURIComponent(repo.fullName)}`}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      View
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <GitBranch className="h-8 w-8 mx-auto mb-3" />
              <p className="text-sm">No repositories found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
