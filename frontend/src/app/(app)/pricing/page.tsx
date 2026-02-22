'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individual developers',
    icon: <Zap className="h-5 w-5 text-white/50" />,
    features: [
      '5 repositories',
      '50 scans / month',
      'Rule-based scanning',
      'Basic vulnerability report',
      'Community support',
    ],
    missing: ['AI-powered analysis', 'PR automation', 'Live deployment scan', 'Team workspace', 'Trends & history'],
    cta: 'Current Plan',
    current: true,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For professional developers',
    icon: <Zap className="h-5 w-5 text-blue-400" />,
    features: [
      'Unlimited repositories',
      '500 scans / month',
      'AI-powered analysis (Groq)',
      'PR automation bot',
      'Live deployment scan',
      'Team workspace (5 seats)',
      '30-day trends',
      'Email support',
    ],
    missing: ['SSO / SAML', 'SLA guarantee', 'Dedicated CSM'],
    cta: 'Upgrade to Pro',
    current: false,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For teams and organizations',
    icon: <Building2 className="h-5 w-5 text-purple-400" />,
    features: [
      'Everything in Pro',
      'Unlimited scans',
      'Unlimited seats',
      'SSO / SAML',
      'Custom rule sets',
      'SLA guarantee',
      'Dedicated CSM',
      'On-premise option',
    ],
    missing: [],
    cta: 'Contact Sales',
    current: false,
    highlight: false,
  },
];

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center"
      >
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="h-6 w-6 text-yellow-400" />
        </div>
        <h2 className="text-lg font-bold mb-2">UI Demo Only</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          This is a demo scaffold. No real payment processing is integrated. In a production
          deployment, this would connect to Stripe or a billing provider.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const handleCTA = (planName: string, isCurrent: boolean) => {
    if (isCurrent) return;
    setSelectedPlan(planName);
    setShowModal(true);
  };

  return (
    <>
      <AnimatePresence>{showModal && <DemoModal onClose={() => setShowModal(false)} />}</AnimatePresence>

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Pricing</h1>
          <p className="text-white/40 text-sm mt-1">Choose a plan that fits your workflow</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative border rounded-2xl p-6 flex flex-col',
                plan.highlight
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-white/10 bg-white/2'
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-medium px-3 py-1 bg-blue-500 text-white rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                {plan.icon}
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-white/40 text-sm ml-1">{plan.period}</span>
              </div>
              <p className="text-xs text-white/40 mb-5">{plan.description}</p>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan.name, plan.current)}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-medium transition-colors mb-5',
                  plan.current
                    ? 'bg-white/5 border border-white/10 text-white/40 cursor-default'
                    : plan.highlight
                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                    : 'bg-white text-black hover:bg-white/90'
                )}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-2 grow">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-white/20">
                    <X className="h-4 w-4 text-white/10 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                q: 'Is my source code stored?',
                a: 'No. Repositories are cloned to a temporary directory, scanned, and immediately deleted. Only vulnerability metadata is persisted.',
              },
              {
                q: 'What languages are supported?',
                a: 'Currently JavaScript and TypeScript (.js, .ts, .jsx, .tsx). More languages are on the roadmap.',
              },
              {
                q: 'How does AI analysis work?',
                a: 'Small code snippets (≤800 tokens) are sent to Groq (Llama 3 70B) for contextual validation. Full source code is never sent to AI.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, plans can be cancelled at any time. In this demo, no billing is wired up.',
              },
            ].map((item) => (
              <div key={item.q}>
                <div className="text-sm font-medium mb-1">{item.q}</div>
                <p className="text-xs text-white/40 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
