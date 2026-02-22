'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Filter,
  FileCode,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Loader2,
  Info,
  Wrench,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { scannerApi } from '@/lib/api';
import { Scan, Vulnerability, Severity } from '@/types';
import {
  getSeverityBadgeClass,
  getScoreColor,
  getScoreLabel,
  formatRelative,
  formatDuration,
  cn,
} from '@/lib/utils';

const SEVERITY_FILTERS: { label: string; value: Severity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

function VulnerabilityCard({ vuln }: { vuln: Vulnerability }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full border capitalize shrink-0',
            getSeverityBadgeClass(vuln.severity)
          )}
        >
          {vuln.severity}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{vuln.title}</div>
          <div className="text-xs text-white/40 font-mono truncate mt-0.5">
            {vuln.filePath}:{vuln.lineStart}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
            {vuln.owaspId}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-white/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4 border-t border-white/5 pt-3">
              {/* Code Snippet */}
              <div>
                <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  Code Snippet
                </div>
                <pre className="bg-white/5 rounded-lg p-3 text-xs font-mono text-white/70 overflow-x-auto whitespace-pre-wrap">
                  {vuln.codeSnippet}
                </pre>
              </div>

              {/* AI Analysis */}
              {vuln.aiExplanation && (
                <div>
                  <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-400" />
                    <span className="text-blue-400">AI Explanation</span>
                    {vuln.aiConfirmed && (
                      <span className="text-green-500 text-xs ml-1">• confirmed</span>
                    )}
                  </div>
                  <div className="text-sm text-white/70 leading-relaxed bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                    {vuln.aiExplanation}
                  </div>
                </div>
              )}

              {/* Impact */}
              {vuln.aiImpactSummary && (
                <div>
                  <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-400">Exploit Impact</span>
                  </div>
                  <div className="text-sm text-white/60 bg-orange-500/5 border border-orange-500/10 rounded-lg p-3">
                    {vuln.aiImpactSummary}
                  </div>
                </div>
              )}

              {/* Patch Suggestion */}
              {vuln.aiPatchSuggestion && (
                <div>
                  <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Suggested Fix</span>
                  </div>
                  <pre className="text-xs font-mono text-white/70 bg-green-500/5 border border-green-500/10 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                    {vuln.aiPatchSuggestion}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RepositoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repoName = decodeURIComponent(params.slug as string);

  const [scan, setScan] = useState<Scan | null>(null);
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [vulnsLoading, setVulnsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanQueued, setScanQueued] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [owner, repo] = repoName.split('/');
        const { data } = await scannerApi.getLatestScanByFullName(owner, repo);
        if (data.scan) setScan(data.scan);
        if (data.repositoryId) setRepositoryId(data.repositoryId);
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [repoName]);

  const handleRescan = async () => {
    if (!repositoryId) return;
    setScanning(true);
    try {
      await scannerApi.triggerScan(repositoryId);
      setScanQueued(true);
      setTimeout(() => setScanQueued(false), 3000);
    } catch {}
    setScanning(false);
  };

  const loadVulnerabilities = async (scanId: string, severity?: Severity | 'all') => {
    setVulnsLoading(true);
    try {
      const { data } = await scannerApi.getVulnerabilities(
        scanId,
        severity === 'all' ? undefined : severity
      );
      setVulnerabilities(data.vulnerabilities);
    } catch {}
    setVulnsLoading(false);
  };

  useEffect(() => {
    if (scan?._id) {
      loadVulnerabilities(scan._id, severityFilter);
    }
  }, [scan, severityFilter]);

  // Group by file for heatmap
  const fileGroups = vulnerabilities.reduce(
    (acc, v) => {
      if (!acc[v.filePath]) acc[v.filePath] = [];
      acc[v.filePath].push(v);
      return acc;
    },
    {} as Record<string, Vulnerability[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Repositories
          </button>
          <h1 className="text-2xl font-bold font-mono">{repoName}</h1>
          <p className="text-white/40 text-sm mt-1">Repository security analysis</p>
        </div>
        {repositoryId && (
          <button
            onClick={handleRescan}
            disabled={scanning}
            className={cn(
              'flex items-center gap-2 text-sm border px-4 py-2 rounded-lg transition-colors',
              scanQueued
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            )}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : scanQueued ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {scanning ? 'Queuing…' : scanQueued ? 'Queued!' : 'Re-scan'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-white/30" />
        </div>
      )}

      {/* Scan Overview */}
      {scan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-white/10 rounded-xl p-4 bg-white/2">
            <div className="text-xs text-white/40 mb-1">Score</div>
            <div className={cn('text-3xl font-bold', getScoreColor(scan.securityScore))}>
              {scan.securityScore}
            </div>
            <div className="text-xs mt-1 text-white/30">{getScoreLabel(scan.securityScore)}</div>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/2">
            <div className="text-xs text-white/40 mb-1">Files Scanned</div>
            <div className="text-3xl font-bold">{scan.scannedFiles}</div>
            <div className="text-xs mt-1 text-white/30">/ {scan.totalFiles} total</div>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/2">
            <div className="text-xs text-white/40 mb-1">Critical / High</div>
            <div className="text-3xl font-bold text-red-500">
              {scan.vulnerabilityCounts.critical}
              <span className="text-white/30 text-xl">/</span>
              <span className="text-orange-500">{scan.vulnerabilityCounts.high}</span>
            </div>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/2">
            <div className="text-xs text-white/40 mb-1">Duration</div>
            <div className="text-2xl font-bold">{formatDuration(scan.durationMs)}</div>
            <div className="text-xs mt-1 text-white/30">{formatRelative(scan.createdAt)}</div>
          </div>
        </div>
      )}

      {!scan && !loading && (
        <div className="border border-white/10 rounded-xl p-8 text-center">
          <Shield className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">
            No scan data available. Go to Repositories and trigger a scan.
          </p>
        </div>
      )}

      {/* File Heatmap */}
      {Object.keys(fileGroups).length > 0 && (
        <div className="border border-white/10 rounded-xl p-5 bg-white/2">
          <h2 className="text-sm font-medium mb-3">File Vulnerability Heatmap</h2>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(fileGroups).map(([file, vulns]) => {
              const maxSev = vulns.find((v) => v.severity === 'critical')
                ? 'critical'
                : vulns.find((v) => v.severity === 'high')
                ? 'high'
                : vulns.find((v) => v.severity === 'medium')
                ? 'medium'
                : 'low';

              const colors = {
                critical: 'bg-red-500/30 border-red-500/40 text-red-400',
                high: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
                medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
                low: 'bg-green-500/10 border-green-500/20 text-green-500',
              };

              return (
                <div
                  key={file}
                  className={cn(
                    'border rounded px-2 py-1 text-xs font-mono cursor-default',
                    colors[maxSev]
                  )}
                  title={`${vulns.length} issue(s)`}
                >
                  {file.split('/').pop()}
                  <span className="ml-1 opacity-60">{vulns.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vulnerability Table */}
      {scan && (
        <div className="border border-white/10 rounded-xl bg-white/2">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/30" />
              <h2 className="text-sm font-medium">
                Vulnerabilities ({vulnerabilities.length})
              </h2>
            </div>
            <div className="flex gap-1">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSeverityFilter(f.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg transition-colors',
                    severityFilter === f.value
                      ? 'bg-white/15 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {vulnsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : vulnerabilities.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <Shield className="h-8 w-8 mx-auto mb-3" />
              <p className="text-sm">No vulnerabilities found for this filter</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {vulnerabilities.map((vuln) => (
                <VulnerabilityCard key={vuln._id} vuln={vuln} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
