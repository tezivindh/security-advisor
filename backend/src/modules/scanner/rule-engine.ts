import { Severity } from '../../models/Vulnerability';

export interface RuleMatch {
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: string;
  owaspId: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  filePath: string;
}

interface Rule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: string;
  owaspId: string;
  patterns: RegExp[];
  contextLines?: number;
}

const RULES: Rule[] = [
  // A01 - Injection
  {
    id: 'SQL_INJECTION_CONCAT',
    title: 'Potential SQL Injection via String Concatenation',
    description: 'SQL query built using string concatenation with user-controlled input.',
    severity: 'critical',
    owaspCategory: 'A01:2021 – Injection',
    owaspId: 'A01',
    patterns: [
      /`SELECT\s+.+\$\{/i,
      /["']SELECT\s.+\+\s*(req\.|body\.|params\.|query\.)/i,
      /query\s*\(?\s*["'`].*SELECT.*\+/i,
    ],
  },
  // A02 - Cryptographic Failures
  {
    id: 'HARDCODED_SECRET',
    title: 'Hardcoded Secret / Credential',
    description: 'Sensitive credential or secret found hardcoded in source code.',
    severity: 'critical',
    owaspCategory: 'A02:2021 – Cryptographic Failures',
    owaspId: 'A02',
    patterns: [
      /(?:password|passwd|secret|api_?key|apiKey|private_?key|token|auth)\s*[:=]\s*["'][^"']{8,}["']/i,
      /(?:AWS|GCP|AZURE)_(?:ACCESS|SECRET)_KEY\s*=\s*["'][^"']{10,}["']/i,
    ],
  },
  {
    id: 'WEAK_CRYPTO',
    title: 'Weak Cryptographic Algorithm',
    description: 'Use of deprecated or weak cryptographic algorithms (MD5, SHA1, DES, RC4).',
    severity: 'high',
    owaspCategory: 'A02:2021 – Cryptographic Failures',
    owaspId: 'A02',
    patterns: [
      /createHash\s*\(\s*["'](?:md5|sha1|des|rc4)["']/i,
      /crypto\.createCipher\s*\(/i,
    ],
  },
  // A03 - Injection (XSS / Command)
  {
    id: 'DANGEROUS_EVAL',
    title: 'Use of eval() or Function Constructor',
    description: 'eval() and Function() are dangerous and can lead to code injection.',
    severity: 'critical',
    owaspCategory: 'A03:2021 – Injection',
    owaspId: 'A03',
    patterns: [
      /\beval\s*\(/,
      /new\s+Function\s*\(/,
      /setTimeout\s*\(\s*["'`]/,
      /setInterval\s*\(\s*["'`]/,
    ],
  },
  {
    id: 'COMMAND_INJECTION',
    title: 'Potential Command Injection via exec/spawn',
    description: 'Shell commands executed with unsanitized user input.',
    severity: 'critical',
    owaspCategory: 'A03:2021 – Injection',
    owaspId: 'A03',
    patterns: [
      /(?:exec|execSync|spawn|spawnSync)\s*\(\s*(?:req\.|body\.|params\.|query\.|\$\{|`[^`]*\$)/i,
      /child_process\.exec\s*\(\s*[`"''][^)]*\+/i,
    ],
  },
  // A05 - Security Misconfiguration
  {
    id: 'CORS_WILDCARD',
    title: 'CORS Wildcard Origin (*)',
    description: 'Application allows all origins via CORS wildcard, enabling cross-origin attacks.',
    severity: 'high',
    owaspCategory: 'A05:2021 – Security Misconfiguration',
    owaspId: 'A05',
    patterns: [
      /origin\s*:\s*["'`]\*["'`]/i,
      /cors\s*\(\s*\{\s*origin\s*:\s*["'`]\*["'`]/i,
      /Access-Control-Allow-Origin.*\*/i,
    ],
  },
  {
    id: 'MISSING_HELMET',
    title: 'Missing Security Headers (Helmet not used)',
    description: 'Express app does not appear to use Helmet for security headers.',
    severity: 'medium',
    owaspCategory: 'A05:2021 – Security Misconfiguration',
    owaspId: 'A05',
    patterns: [/express\s*\(\s*\)(?![\s\S]{0,500}helmet)/],
  },
  // A07 - Auth & Access Control
  {
    id: 'MISSING_AUTH_MIDDLEWARE',
    title: 'Route without Authentication Middleware',
    description: 'API route registered without authentication guard.',
    severity: 'high',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    owaspId: 'A07',
    // Matches routes where the path is NOT a known-public endpoint AND the line has no auth-related word
    patterns: [
      /router\.(get|post|put|delete|patch)\s*\(\s*["'`](?!\/?(login|logout|callback|health|public|static|webhook|auth|oauth|signup|register|verify|ping))[^"'`]+["'`]\s*,\s*(?!.*\b(?:auth|verify|protect|guard|passport|authenticate|middleware|session|token|jwt|require))/i,
    ],
  },
  {
    id: 'JWT_NO_VERIFY',
    title: 'JWT Token Not Verified',
    description: 'JWT decoded without verification using jwt.decode() instead of jwt.verify().',
    severity: 'high',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    owaspId: 'A07',
    patterns: [/jwt\.decode\s*\(/i],
  },
  // A09 - SSRF
  {
    id: 'SSRF_PATTERN',
    title: 'Potential Server-Side Request Forgery (SSRF)',
    description: 'HTTP request made using user-supplied URL without validation.',
    severity: 'high',
    owaspCategory: 'A10:2021 – Server-Side Request Forgery',
    owaspId: 'A10',
    patterns: [
      /(?:axios|fetch|got|request|http\.get|https\.get)\s*\(\s*(?:req\.|body\.|params\.|query\.|\$\{)/i,
    ],
  },
  // A06 - Vulnerable components
  {
    id: 'PROTOTYPE_POLLUTION',
    title: 'Prototype Pollution Risk',
    description: 'Object merge/assign operations without prototype protection.',
    severity: 'medium',
    owaspCategory: 'A08:2021 – Software and Data Integrity Failures',
    owaspId: 'A08',
    patterns: [
      /Object\.assign\s*\(\s*(?:req\.|body\.|params\.)/i,
      /\bmerge\s*\(\s*(?:req\.|body\.|params\.)/i,
    ],
  },
];

// Detects router.use() or app.use() with an auth middleware applied globally in the file
const GLOBAL_AUTH_USE_RE = /(?:router|app)\.use\s*\([^)]*(?:auth|verify|protect|guard|passport|authenticate|token|jwt)[^)]*\)/i;

function extractContext(lines: string[], lineIndex: number, contextRadius = 3): string {
  const start = Math.max(0, lineIndex - contextRadius);
  const end = Math.min(lines.length - 1, lineIndex + contextRadius);
  return lines.slice(start, end + 1).join('\n').substring(0, 1500);
}

export function runRuleEngine(filePath: string, content: string): RuleMatch[] {
  const lines = content.split('\n');
  const matches: RuleMatch[] = [];
  const seen = new Set<string>();

  // If the file has a global router.use(authMiddleware) call, the MISSING_AUTH_MIDDLEWARE
  // rule is not applicable — all routes below it are protected
  const fileHasGlobalAuth = GLOBAL_AUTH_USE_RE.test(content);

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      lines.forEach((line, idx) => {
        // Skip auth-middleware check if file-level auth is detected
        if (rule.id === 'MISSING_AUTH_MIDDLEWARE' && fileHasGlobalAuth) return;

        if (pattern.test(line)) {
          const dedupeKey = `${rule.id}:${filePath}:${idx}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            matches.push({
              ruleId: rule.id,
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              owaspCategory: rule.owaspCategory,
              owaspId: rule.owaspId,
              lineStart: idx + 1,
              lineEnd: idx + 1,
              codeSnippet: extractContext(lines, idx),
              filePath,
            });
          }
        }
      });

      // Only test against the full file for patterns that explicitly span newlines (\n in source)
      if (pattern.source.includes('\\n')) {
        const fullMatch = content.match(pattern);
        if (fullMatch) {
          const matchedLine = content.substring(0, fullMatch.index || 0).split('\n').length;
          const dedupeKey = `${rule.id}:${filePath}:${matchedLine - 1}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            matches.push({
              ruleId: rule.id,
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              owaspCategory: rule.owaspCategory,
              owaspId: rule.owaspId,
              lineStart: matchedLine,
              lineEnd: matchedLine,
              codeSnippet: extractContext(lines, matchedLine - 1),
              filePath,
            });
          }
        }
      }
    }
  }

  return matches;
}
