'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '@/lib/api';
import { DemoAnalysisResult } from '@/types';
import { getSeverityBadgeClass, getScoreColor, getScoreLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const EXAMPLE_CODE = `// Example: Vulnerable Express.js code
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

// Vulnerable: SQL injection via string concatenation
app.get('/user', async (req, res) => {
  const { id } = req.query;
  const user = await db.query(
    "SELECT * FROM users WHERE id = " + id
  );
  res.json(user);
});

// Vulnerable: JWT decoded without verification
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = jwt.decode(token); // Should be jwt.verify!
  res.json(payload);
});

// Vulnerable: Hardcoded secret
const API_SECRET = "sk-live-f8a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6";

// Vulnerable: CORS wildcard
app.use(cors({ origin: '*' }));
`;

export default function DemoPage() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [result, setResult] = useState<DemoAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await aiApi.analyzeDemo(code);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          <span className="font-semibold text-sm">SecOps</span>
        </div>
        <span className="text-white/20">|</span>
        <span className="text-white/50 text-sm">Interactive Demo Analyzer</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Try the Security Analyzer</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Paste any JavaScript or TypeScript code snippet. Our hybrid rule engine + Groq AI will
            analyze it for vulnerabilities and suggest fixes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-white/40 font-mono">snippet.ts</span>
              <button
                onClick={() => setCode(EXAMPLE_CODE)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Load Example
              </button>
            </div>
            <MonacoEditor
              height="400px"
              language="typescript"
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
            <div className="bg-white/5 border-t border-white/10 p-3">
              <button
                onClick={handleAnalyze}
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Analyze Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-medium text-white/60 mb-4">Analysis Results</h2>

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-white/20">
                <Shield className="h-12 w-12 mb-3" />
                <p className="text-sm">Paste your code and click Analyze</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score */}
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                    <div>
                      <div className="text-xs text-white/40 mb-1">Security Score</div>
                      <div className={cn('text-4xl font-bold', getScoreColor(result.securityScore))}>
                        {result.securityScore}
                        <span className="text-sm text-white/40">/100</span>
                      </div>
                      <div className={cn('text-xs font-medium', getScoreColor(result.securityScore))}>
                        {getScoreLabel(result.securityScore)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40 mb-1">OWASP Category</div>
                      <div className="text-xs font-medium text-white/80 max-w-45 text-right leading-snug">
                        {result.owaspMapping}
                      </div>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Severity:</span>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
                        getSeverityBadgeClass(result.severity as any)
                      )}
                    >
                      {result.severity}
                    </span>
                    {result.confirmed ? (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> AI confirmed
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">Rule-based detection</span>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <div className="text-xs text-white/40 font-medium">What&apos;s wrong?</div>
                    <div className="text-sm text-white/70 leading-relaxed bg-white/5 rounded-lg p-3">
                      {result.explanation}
                    </div>
                  </div>

                  {/* Fix */}
                  <div className="space-y-1">
                    <div className="text-xs text-white/40 font-medium">Suggested Fix</div>
                    <div className="text-white/70 leading-relaxed bg-green-500/5 border border-green-500/10 rounded-lg p-3 font-mono whitespace-pre-wrap text-xs">
                      {result.suggestedFix}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
