import Groq from 'groq-sdk';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { RuleMatch } from '../scanner/rule-engine';
import { Severity } from '../../models/Vulnerability';

const groq = new Groq({ apiKey: config.groq.apiKey });

export interface AIEnrichedVulnerability extends RuleMatch {
  aiConfirmed: boolean;
  aiExplanation?: string;
  aiPatchSuggestion?: string;
  aiImpactSummary?: string;
}

const SYSTEM_PROMPT = `You are a senior application security engineer. 
Analyze the provided code snippet for security vulnerabilities.
Respond ONLY with valid JSON. Never suggest offensive payloads or exploitation techniques.
Your role is to help developers understand and fix vulnerabilities.`;

function buildAnalysisPrompt(match: RuleMatch): string {
  return `Analyze this ${match.severity.toUpperCase()} severity potential vulnerability in file: ${match.filePath}

Rule triggered: ${match.ruleId}
Initial finding: ${match.title}

Code snippet (lines ${match.lineStart}-${match.lineEnd}):
\`\`\`
${match.codeSnippet.substring(0, config.limits.maxSnippetTokens)}
\`\`\`

Respond with EXACTLY this JSON structure (no other text):
{
  "confirmed": boolean,
  "owaspCategory": "string",
  "owaspId": "A##",
  "severity": "critical|high|medium|low|info",
  "explanation": "Clear explanation of the vulnerability for a developer (max 300 words)",
  "patchSuggestion": "Concrete code fix suggestion (max 300 words)",
  "impactSummary": "Descriptive impact summary - NO offensive content (max 150 words)"
}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Parse retry delay from Groq 429 message, e.g. "try again in 920ms"
function parseRetryDelay(err: any): number {
  try {
    const body = JSON.parse(err.message.replace(/^\d+ /, ''));
    const msg: string = body?.error?.message || '';
    const match = msg.match(/try again in ([\d.]+)ms/i);
    if (match) return Math.ceil(parseFloat(match[1])) + 200;
  } catch {}
  return 2000;
}

async function analyzeSnippet(
  match: RuleMatch,
  retries = 4
): Promise<AIEnrichedVulnerability> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildAnalysisPrompt(match) },
        ],
        model: config.groq.model,
        max_tokens: config.groq.maxTokens,
        temperature: 0.1,
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in Groq response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        ...match,
        aiConfirmed: parsed.confirmed ?? true,
        owaspCategory: parsed.owaspCategory || match.owaspCategory,
        owaspId: parsed.owaspId || match.owaspId,
        severity: (parsed.severity as Severity) || match.severity,
        aiExplanation: parsed.explanation,
        aiPatchSuggestion: parsed.patchSuggestion,
        aiImpactSummary: parsed.impactSummary,
      };
    } catch (err: any) {
      const is429 = err?.status === 429 || /429/.test(err?.message || '');
      if (is429 && attempt < retries) {
        const delay = parseRetryDelay(err);
        logger.warn(`[Groq] 429 rate limit hit for ${match.ruleId}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }
      logger.warn(`Groq analysis failed for ${match.ruleId}, using rule-only result:`, err);
      return { ...match, aiConfirmed: false };
    }
  }
  return { ...match, aiConfirmed: false };
}

// Rate-limited batch analysis: 2 concurrent, 1.5 s gap between batches
export async function analyzeVulnerabilityBatch(
  matches: RuleMatch[]
): Promise<AIEnrichedVulnerability[]> {
  const results: AIEnrichedVulnerability[] = [];
  const concurrency = 2;

  for (let i = 0; i < matches.length; i += concurrency) {
    const batch = matches.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((m) => analyzeSnippet(m)));
    results.push(...batchResults);

    // Pause between batches to stay within Groq free-tier TPM limits
    if (i + concurrency < matches.length) {
      await sleep(1500);
    }
  }

  return results;
}

export interface DemoAnalysisResult {
  securityScore: number;
  owaspMapping: string;
  owaspId: string;
  severity: string;
  explanation: string;
  suggestedFix: string;
  confirmed: boolean;
}

const QUICK_RULES = [
  { pattern: /eval\s*\(/, owaspId: 'A03', severity: 'critical', label: 'Dangerous eval()' },
  {
    pattern: /(?:password|secret|apikey|token)\s*[:=]\s*["'][^"']{4,}/i,
    owaspId: 'A02',
    severity: 'critical',
    label: 'Hardcoded secret',
  },
  { pattern: /jwt\.decode\s*\(/, owaspId: 'A07', severity: 'high', label: 'JWT not verified' },
  {
    pattern: /origin\s*:\s*["']\*["']/i,
    owaspId: 'A05',
    severity: 'high',
    label: 'CORS wildcard',
  },
  {
    pattern: /createHash\s*\(\s*["']md5["']/i,
    owaspId: 'A02',
    severity: 'medium',
    label: 'Weak hash (MD5)',
  },
];

const OWASP_LABELS: Record<string, string> = {
  A01: 'A01:2021 – Broken Access Control',
  A02: 'A02:2021 – Cryptographic Failures',
  A03: 'A03:2021 – Injection',
  A04: 'A04:2021 – Insecure Design',
  A05: 'A05:2021 – Security Misconfiguration',
  A06: 'A06:2021 – Vulnerable Components',
  A07: 'A07:2021 – Identification & Authentication Failures',
  A08: 'A08:2021 – Software and Data Integrity Failures',
  A09: 'A09:2021 – Security Logging Failures',
  A10: 'A10:2021 – Server-Side Request Forgery',
};

export async function analyzeDemoSnippet(code: string): Promise<DemoAnalysisResult> {
  // Run quick rule-based check first
  let detectedOwaspId = 'A05';
  let detectedSeverity = 'medium';
  let baseScore = 75;

  for (const rule of QUICK_RULES) {
    if (rule.pattern.test(code)) {
      detectedOwaspId = rule.owaspId;
      detectedSeverity = rule.severity;
      if (rule.severity === 'critical') baseScore = 30;
      else if (rule.severity === 'high') baseScore = 50;
      break;
    }
  }

  // Ask Groq for explanation
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this code snippet for security issues:

\`\`\`javascript
${code.substring(0, 1500)}
\`\`\`

Respond with EXACTLY this JSON:
{
  "confirmed": boolean,
  "owaspId": "A##",
  "owaspCategory": "full OWASP category name",
  "severity": "critical|high|medium|low|info",
  "explanation": "short developer-friendly explanation (max 200 words)",
  "fix": "concrete fix with code example (max 200 words)",
  "score": number between 0-100
}`,
        },
      ],
      model: config.groq.model,
      max_tokens: 800,
      temperature: 0.1,
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      securityScore: parsed.score || baseScore,
      owaspMapping: parsed.owaspCategory || OWASP_LABELS[detectedOwaspId] || detectedOwaspId,
      owaspId: parsed.owaspId || detectedOwaspId,
      severity: parsed.severity || detectedSeverity,
      explanation: parsed.explanation || 'Analysis unavailable',
      suggestedFix: parsed.fix || 'No fix suggestion available',
      confirmed: parsed.confirmed ?? true,
    };
  } catch {
    return {
      securityScore: baseScore,
      owaspMapping: OWASP_LABELS[detectedOwaspId] || detectedOwaspId,
      owaspId: detectedOwaspId,
      severity: detectedSeverity,
      explanation: 'Rule-based detection identified a potential security issue.',
      suggestedFix: 'Please review the code for security best practices.',
      confirmed: false,
    };
  }
}
