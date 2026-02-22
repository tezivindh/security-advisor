'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  Server,
  Eye,
  Cookie,
  RefreshCw,
} from 'lucide-react';
import { liveScanApi } from '@/lib/api';
import { LiveScanResult, LiveCheckResult } from '@/types';
import { cn } from '@/lib/utils';

type CheckStatus = 'pass' | 'fail' | 'warn' | 'info';

interface CheckGroup {
  label: string;
  icon: React.ReactNode;
  checks: LiveCheckResult[];
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  transport: { label: 'Transport Security', icon: <Lock className="h-4 w-4 text-blue-400" /> },
  headers: { label: 'Security Headers', icon: <Shield className="h-4 w-4 text-purple-400" /> },
  cookies: { label: 'Cookies', icon: <Cookie className="h-4 w-4 text-orange-400" /> },
  cors: { label: 'CORS Policy', icon: <Globe className="h-4 w-4 text-cyan-400" /> },
  'exposed-paths': { label: 'Exposed Paths', icon: <Eye className="h-4 w-4 text-red-400" /> },
  server: { label: 'Server Info', icon: <Server className="h-4 w-4 text-white/30" /> },
};

function buildCheckGroups(result: LiveScanResult): CheckGroup[] {
  const grouped: Record<string, LiveCheckResult[]> = {};
  for (const check of result.checks) {
    const cat = check.category ?? 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(check);
  }
  return Object.entries(grouped).map(([cat, checks]) => ({
    label: CATEGORY_META[cat]?.label ?? cat,
    icon: CATEGORY_META[cat]?.icon ?? <Globe className="h-4 w-4 text-white/30" />,
    checks,
  }));
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />;
}

function statusColor(s: CheckStatus) {
  return s === 'pass' ? 'text-green-400' : s === 'fail' ? 'text-red-400' : 'text-yellow-400';
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const pct = (score / 100) * 283;
  const strokeColor = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={`${pct} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold', color)}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-white/40 mt-1">Security Score</span>
    </div>
  );
}

export default function LiveScanPage() {
  const [url, setUrl] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<LiveScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setError('');
    try {
      const { data } = await liveScanApi.scan(url.trim(), domainVerified);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Scan failed. Please check the URL and try again.');
    }
    setScanning(false);
  };

  const groups = result ? buildCheckGroups(result) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Live Deployment Scan</h1>
        <p className="text-white/40 text-sm mt-1">
          Passively analyze a live URL for security misconfigurations
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-white/50 leading-relaxed">
          This tool only performs passive checks (headers, cookies, CORS, exposed paths). It does
          not send attack payloads. You must own or have permission to scan the target domain.
        </p>
      </div>

      {/* Input Form */}
      <div className="border border-white/10 rounded-xl p-5 bg-white/2 space-y-4">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Target URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => e.key === 'Enter' && !scanning && handleScan()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 font-mono"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setDomainVerified(!domainVerified)}
            className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-colors',
              domainVerified ? 'bg-green-500/80 border-green-500' : 'border-white/20'
            )}
          >
            {domainVerified && (
              <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-white/60">
            I confirm I own or have permission to scan this domain
          </span>
        </label>
        <button
          onClick={handleScan}
          disabled={!url.trim() || !domainVerified || scanning}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              Start Scan
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score Card */}
            <div className="border border-white/10 rounded-xl p-5 bg-white/2 flex items-center gap-6">
              <ScoreGauge score={result.overallScore} />
              <div>
                <div className="text-lg font-bold">Scan Complete</div>
                <div className="text-sm text-white/40 font-mono mt-0.5">{url}</div>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="text-green-400">
                    {result.checks.filter((c) => c.status === 'pass').length} passed
                  </span>
                  <span className="text-yellow-400">
                    {result.checks.filter((c) => c.status === 'warn').length} warnings
                  </span>
                  <span className="text-red-400">
                    {result.checks.filter((c) => c.status === 'fail').length} failed
                  </span>
                </div>
              </div>
              <button
                onClick={handleScan}
                className="ml-auto border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Re-scan
              </button>
            </div>

            {/* Check Groups */}
            {groups.map((group) => (
              <div key={group.label} className="border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 bg-white/2">
                  {group.icon}
                  <span className="text-sm font-medium">{group.label}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {group.checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <StatusIcon status={c.status} />
                      <span className="text-sm flex-1">{c.name}</span>
                      {(c.details || c.message) && (
                        <span className={cn('text-xs opacity-60', statusColor(c.status))}>
                          {c.details ?? c.message}
                        </span>
                      )}
                      <span className={cn('text-xs font-medium capitalize', statusColor(c.status))}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
