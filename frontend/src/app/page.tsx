'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Zap,
  GitPullRequest,
  Globe,
  Users,
  BarChart3,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { getOAuthGithubUrl } from '@/lib/utils';

const FEATURES = [
  {
    icon: Shield,
    title: 'AI-Powered Vulnerability Detection',
    description:
      'Regex rule engine + Groq AI detects SQL injection, hardcoded secrets, SSRF, command injection, weak crypto, and more.',
  },
  {
    icon: Zap,
    title: 'Real-Time Security Score',
    description:
      'Every scan produces a clear 0–100 security score with OWASP category mapping and severity breakdown.',
  },
  {
    icon: GitPullRequest,
    title: 'Automated PR Reviews',
    description:
      'SecOps bot automatically reviews pull requests and posts security findings as review comments.',
  },
  {
    icon: Globe,
    title: 'Live Deployment Scanning',
    description:
      'Passive security checks on live domains: TLS, security headers, cookie flags, CORS, exposed paths.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite developers, assign roles (Owner / Developer / Viewer), and share a unified security dashboard.',
  },
  {
    icon: BarChart3,
    title: '30-Day Security Trends',
    description:
      'Track your security posture over time. See improvement percentages and recurrent vulnerabilities.',
  },
];

const OWASP_CATEGORIES = [
  { id: 'A01', label: 'Broken Access Control', color: '#ef4444' },
  { id: 'A02', label: 'Cryptographic Failures', color: '#f97316' },
  { id: 'A03', label: 'Injection', color: '#ef4444' },
  { id: 'A05', label: 'Security Misconfiguration', color: '#eab308' },
  { id: 'A07', label: 'Auth & Session Failures', color: '#f97316' },
  { id: 'A08', label: 'Data Integrity Failures', color: '#eab308' },
  { id: 'A10', label: 'SSRF', color: '#ef4444' },
];

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individual developers and open source projects',
    features: [
      '5 repository scans/month',
      'Up to 3 repositories',
      'OWASP vulnerability mapping',
      'AI explanations (basic)',
      'Security score & trends',
      'Community support',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professional developers and small teams',
    features: [
      'Unlimited scans',
      'Unlimited repositories',
      'PR automation bot',
      'Live deployment scanning',
      'AI patch suggestions',
      'Team workspace (5 seats)',
      'Priority support',
      'API access',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For larger teams and organizations',
    features: [
      'Everything in Pro',
      'Unlimited team seats',
      'SSO / SAML support',
      'Custom rules engine',
      'Audit logs & compliance',
      'SLA guarantee',
      'Dedicated support',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-sm tracking-tight">SecOps</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
          </div>
          <a
            href={getOAuthGithubUrl()}
            className="flex items-center gap-2 bg-white text-black text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-150 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-100 h-100 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 text-red-400 text-xs font-medium mb-6">
              <AlertTriangle className="h-3 w-3" />
              AI-Powered Security Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
              Your AI Security{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
                Copilot
              </span>{' '}
              for Every Repo
            </h1>

            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Continuously scan GitHub repositories for vulnerabilities. Get AI-powered
              explanations, OWASP mapping, and automated patch suggestions. Ship secure code faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={getOAuthGithubUrl()}
                className="flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Start Scanning Free
              </a>
              <Link
                href="/demo"
                className="flex items-center justify-center gap-2 border border-white/10 text-white/70 font-medium px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                Try Demo Analyzer
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Mock Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-left shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-white/30 text-xs font-mono">secops dashboard</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Security Score', value: '73', unit: '/100', color: 'text-yellow-500' },
                  { label: 'Critical Issues', value: '3', unit: '', color: 'text-red-500' },
                  { label: 'High Issues', value: '8', unit: '', color: 'text-orange-500' },
                  { label: 'Repos Scanned', value: '12', unit: '', color: 'text-blue-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-lg p-3">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                      <span className="text-sm text-white/40">{stat.unit}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { file: 'src/routes/api.ts', issue: 'SQL Injection via string concat', severity: 'critical' },
                  { file: 'src/auth/jwt.ts', issue: 'JWT decoded without verification', severity: 'high' },
                  { file: 'src/config/cors.ts', issue: 'CORS wildcard origin (*)', severity: 'high' },
                ].map((item) => (
                  <div key={item.file} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        item.severity === 'critical'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-white/60 text-xs font-mono flex-1">{item.file}</span>
                    <span className="text-white/40 text-xs hidden md:block">{item.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to ship secure code
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              SecOps combines regex-based static analysis and Groq AI into a unified security
              intelligence platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/10 rounded-xl p-6 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <feature.icon className="h-6 w-6 text-red-500 mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OWASP Coverage Section */}
      <section className="py-16 px-4 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/40 text-sm mb-6 uppercase tracking-widest font-medium">
            OWASP Top 10 Coverage
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {OWASP_CATEGORIES.map((cat) => (
              <span
                key={cat.id}
                className="border rounded-full px-3 py-1 text-xs font-medium"
                style={{ borderColor: `${cat.color}40`, color: cat.color, background: `${cat.color}10` }}
              >
                {cat.id} – {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/50">Start free. Scale as your team grows.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border transition-all ${
                  plan.highlight
                    ? 'border-white/20 bg-white/10 shadow-xl shadow-white/5'
                    : 'border-white/10 hover:border-white/15'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-red-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-sm text-white/50 mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/40 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.name === 'Free' ? getOAuthGithubUrl() : '#'}
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">SecOps</span>
            <span className="text-white/30 text-sm">– AI Security Intelligence Platform</span>
          </div>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} SecOps. Built for developers who care about security.
          </p>
        </div>
      </footer>
    </div>
  );
}
