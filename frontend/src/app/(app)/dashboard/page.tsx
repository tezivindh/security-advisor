'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  Info,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { scannerApi, trendsApi } from '@/lib/api';
import { DashboardSummary, GlobalTrendData, Scan } from '@/types';
import { getScoreColor, getScoreLabel, formatRelative, cn } from '@/lib/utils';

const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Critical', color: '#ef4444', icon: AlertOctagon },
  { key: 'high', label: 'High', color: '#f97316', icon: AlertTriangle },
  { key: 'medium', label: 'Medium', color: '#eab308', icon: AlertTriangle },
  { key: 'low', label: 'Low', color: '#22c55e', icon: Info },
];

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 80" className="w-40 h-28">
        <path
          d="M 15 70 A 50 50 0 0 1 105 70"
          fill="none"
          stroke="#ffffff10"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 15 70 A 50 50 0 0 1 105 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 157} 157`}
          className="transition-all duration-1000"
        />
        <text x="60" y="68" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" fill="#ffffff60" fontSize="9">
          / 100
        </text>
      </svg>
    </div>
  );
}

function ScanStatusBadge({ status }: { status: Scan['status'] }) {
  const config: Record<string, { color: string; label: string }> = {
    completed: { color: 'text-green-500', label: 'Completed' },
    running: { color: 'text-blue-500', label: 'Running' },
    queued: { color: 'text-yellow-500', label: 'Queued' },
    failed: { color: 'text-red-500', label: 'Failed' },
    cancelled: { color: 'text-white/40', label: 'Cancelled' },
  };
  const { color, label } = config[status] || { color: 'text-white/40', label: status };
  return <span className={cn('text-xs font-medium', color)}>{label}</span>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<GlobalTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [summaryRes, trendRes] = await Promise.allSettled([
        scannerApi.getDashboardSummary(),
        trendsApi.getGlobalTrends(),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (trendRes.status === 'fulfilled') setTrendData(trendRes.value.data.trendData || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  const score = summary?.globalScore ?? 100;

  const owaspChartData = (summary?.owaspDistribution || []).map((d) => ({
    name: d._id,
    value: d.count,
  }));

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Overview of your repository security posture</p>
      </div>

      {/* Score + Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Global Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-1 border border-white/10 rounded-xl p-5 bg-white/2 flex flex-col items-center"
        >
          <Shield className="h-5 w-5 text-white/30 mb-2" />
          <ScoreGauge score={score} />
          <div className={cn('text-sm font-medium', getScoreColor(score))}>
            {getScoreLabel(score)}
          </div>
          <div className="text-xs text-white/30 mt-1">Global Security Score</div>
        </motion.div>

        {/* Severity Cards */}
        {SEVERITY_CONFIG.map((s, i) => {
          const count =
            summary?.severityBreakdown?.[s.key as keyof typeof summary.severityBreakdown] ?? 0;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-white/10 rounded-xl p-5 bg-white/2"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40">{s.label}</span>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: s.color }}>
                {count}
              </div>
              <div className="text-xs text-white/30 mt-1">issues found</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 30-Day Trend */}
        <div className="lg:col-span-2 border border-white/10 rounded-xl p-5 bg-white/2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">30-Day Security Trend</h2>
              <p className="text-xs text-white/30 mt-0.5">Average security score over time</p>
            </div>
            <TrendingUp className="h-4 w-4 text-white/20" />
          </div>
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">
              No trend data yet. Complete a scan to start tracking.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="_id"
                  tick={{ fill: '#ffffff30', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#ffffff30', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #ffffff10',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* OWASP Distribution */}
        <div className="border border-white/10 rounded-xl p-5 bg-white/2">
          <h2 className="text-sm font-medium mb-4">OWASP Category Breakdown</h2>
          {owaspChartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">
              No data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={owaspChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {owaspChartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid #ffffff10',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {owaspChartData.slice(0, 5).map((d, idx) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-white/50">{d.name}</span>
                    </div>
                    <span className="text-white/70">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="border border-white/10 rounded-xl bg-white/2">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/30" />
            <h2 className="text-sm font-medium">Recent Scans</h2>
          </div>
        </div>
        {!summary?.recentScans?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <Shield className="h-8 w-8 mb-3" />
            <p className="text-sm">No scans yet. Enable a repository to start scanning.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {summary.recentScans.map((scan) => (
              <div key={scan._id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {typeof scan.repositoryId === 'object'
                      ? (scan.repositoryId as any).fullName
                      : scan.repositoryId}
                  </div>
                  <div className="text-xs text-white/30">{formatRelative(scan.createdAt)}</div>
                </div>
                <ScanStatusBadge status={scan.status} />
                {scan.status === 'completed' && (
                  <div className={cn('text-sm font-bold', getScoreColor(scan.securityScore))}>
                    {scan.securityScore}
                  </div>
                )}
                <div className="flex gap-2 text-xs">
                  {scan.vulnerabilityCounts.critical > 0 && (
                    <span className="text-red-500">{scan.vulnerabilityCounts.critical}C</span>
                  )}
                  {scan.vulnerabilityCounts.high > 0 && (
                    <span className="text-orange-500">{scan.vulnerabilityCounts.high}H</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
