import axios from 'axios';
import { URL } from 'url';
import { logger } from '../../utils/logger';

export interface LiveScanResult {
  domain: string;
  scannedAt: Date;
  overallScore: number;
  checks: LiveCheckResult[];
}

export interface LiveCheckResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  message: string;
  details?: string;
  recommendation?: string;
}

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy',
];

const EXPOSED_PATHS = [
  '/.env',
  '/.git/config',
  '/config.json',
  '/.htaccess',
  '/phpinfo.php',
  '/wp-config.php',
  '/api/config',
];

export async function performLiveScan(targetUrl: string): Promise<LiveScanResult> {
  const checks: LiveCheckResult[] = [];

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL provided');
  }

  const domain = parsedUrl.hostname;

  // 1. HTTPS/TLS Check
  checks.push(checkHTTPS(parsedUrl));

  try {
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': 'SecOps-Scanner/1.0 (Security Assessment)' },
    });

    const headers = response.headers;

    // 2. Security Headers Check
    checks.push(...checkSecurityHeaders(headers));

    // 3. Cookie Analysis
    checks.push(...checkCookies(headers));

    // 4. CORS Analysis
    checks.push(checkCORS(headers));

    // 5. Server Info Leakage
    checks.push(checkServerLeakage(headers));

    // 6. Exposed common paths (passive, read-only)
    const exposedChecks = await checkExposedPaths(parsedUrl.origin);
    checks.push(...exposedChecks);

    // 7. Safe reflection marker
    checks.push(checkReflectionProtection(headers));
  } catch (err: any) {
    logger.warn(`Live scan request failed for ${domain}:`, err.message);
    checks.push({
      name: 'Connection',
      category: 'Availability',
      status: 'fail',
      message: 'Could not reach the target URL',
      details: err.message,
    });
  }

  const score = calculateLiveScore(checks);

  return {
    domain,
    scannedAt: new Date(),
    overallScore: score,
    checks,
  };
}

function checkHTTPS(url: URL): LiveCheckResult {
  if (url.protocol === 'https:') {
    return {
      name: 'HTTPS/TLS',
      category: 'Transport Security',
      status: 'pass',
      message: 'Site uses HTTPS',
      recommendation: 'Ensure TLS is configured with strong cipher suites.',
    };
  }
  return {
    name: 'HTTPS/TLS',
    category: 'Transport Security',
    status: 'fail',
    message: 'Site does not use HTTPS',
    recommendation: 'Enable HTTPS and configure a valid TLS certificate.',
  };
}

function checkSecurityHeaders(headers: Record<string, any>): LiveCheckResult[] {
  return SECURITY_HEADERS.map((header) => {
    const present = !!headers[header];
    return {
      name: `Header: ${header}`,
      category: 'Security Headers',
      status: present ? ('pass' as const) : ('fail' as const),
      message: present ? `${header} is present` : `${header} is missing`,
      details: present ? String(headers[header]).substring(0, 200) : undefined,
      recommendation: present
        ? undefined
        : `Add the ${header} HTTP response header to improve security.`,
    };
  });
}

function checkCookies(headers: Record<string, any>): LiveCheckResult[] {
  const results: LiveCheckResult[] = [];
  const setCookie = headers['set-cookie'];

  if (!setCookie) {
    results.push({
      name: 'Cookie Security',
      category: 'Cookie Analysis',
      status: 'info',
      message: 'No cookies detected in response',
    });
    return results;
  }

  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  cookies.forEach((cookie: string) => {
    const lc = cookie.toLowerCase();
    const name = cookie.split('=')[0].trim();

    if (!lc.includes('httponly')) {
      results.push({
        name: `Cookie: ${name} - HttpOnly`,
        category: 'Cookie Analysis',
        status: 'fail',
        message: `Cookie "${name}" missing HttpOnly flag`,
        recommendation: 'Add HttpOnly flag to prevent XSS cookie theft.',
      });
    }

    if (!lc.includes('secure')) {
      results.push({
        name: `Cookie: ${name} - Secure`,
        category: 'Cookie Analysis',
        status: 'fail',
        message: `Cookie "${name}" missing Secure flag`,
        recommendation: 'Add Secure flag to prevent cookie transmission over HTTP.',
      });
    }

    if (!lc.includes('samesite')) {
      results.push({
        name: `Cookie: ${name} - SameSite`,
        category: 'Cookie Analysis',
        status: 'warn',
        message: `Cookie "${name}" missing SameSite attribute`,
        recommendation: 'Add SameSite=Strict or SameSite=Lax to mitigate CSRF.',
      });
    }
  });

  return results;
}

function checkCORS(headers: Record<string, any>): LiveCheckResult {
  const origin = headers['access-control-allow-origin'];
  if (!origin) {
    return {
      name: 'CORS',
      category: 'CORS Analysis',
      status: 'info',
      message: 'No CORS headers present',
    };
  }

  if (origin === '*') {
    return {
      name: 'CORS Wildcard',
      category: 'CORS Analysis',
      status: 'fail',
      message: 'CORS allows all origins (*)',
      recommendation: 'Restrict CORS to specific trusted origins only.',
    };
  }

  return {
    name: 'CORS',
    category: 'CORS Analysis',
    status: 'pass',
    message: `CORS restricted to: ${origin}`,
  };
}

function checkServerLeakage(headers: Record<string, any>): LiveCheckResult {
  const server = headers['server'];
  const xPowered = headers['x-powered-by'];

  if (server || xPowered) {
    return {
      name: 'Server Information Leakage',
      category: 'Information Exposure',
      status: 'warn',
      message: 'Server technology information exposed',
      details: [server && `Server: ${server}`, xPowered && `X-Powered-By: ${xPowered}`]
        .filter(Boolean)
        .join(', '),
      recommendation: 'Remove Server and X-Powered-By headers to reduce fingerprinting.',
    };
  }

  return {
    name: 'Server Information Leakage',
    category: 'Information Exposure',
    status: 'pass',
    message: 'No server technology information exposed',
  };
}

async function checkExposedPaths(origin: string): Promise<LiveCheckResult[]> {
  const results: LiveCheckResult[] = [];

  for (const exposedPath of EXPOSED_PATHS.slice(0, 5)) {
    try {
      const response = await axios.get(`${origin}${exposedPath}`, {
        timeout: 5000,
        validateStatus: () => true,
        headers: { 'User-Agent': 'SecOps-Scanner/1.0 (Security Assessment)' },
      });

      if (response.status === 200) {
        results.push({
          name: `Exposed Path: ${exposedPath}`,
          category: 'Exposed Files',
          status: 'fail',
          message: `Sensitive path ${exposedPath} is publicly accessible (HTTP 200)`,
          recommendation: 'Restrict access to sensitive configuration files and directories.',
        });
      }
    } catch {
      // Path not reachable - good
    }
  }

  if (results.length === 0) {
    results.push({
      name: 'Exposed Sensitive Paths',
      category: 'Exposed Files',
      status: 'pass',
      message: 'No common sensitive paths exposed',
    });
  }

  return results;
}

function checkReflectionProtection(headers: Record<string, any>): LiveCheckResult {
  const csp = headers['content-security-policy'];
  if (csp && csp.includes("script-src")) {
    return {
      name: 'XSS Reflection Protection',
      category: 'Injection Defense',
      status: 'pass',
      message: 'CSP header configured with script-src directive',
    };
  }
  return {
    name: 'XSS Reflection Protection',
    category: 'Injection Defense',
    status: 'warn',
    message: 'No CSP with script-src detected - XSS reflection risk',
    recommendation: 'Implement a Content-Security-Policy with a strict script-src directive.',
  };
}

function calculateLiveScore(checks: LiveCheckResult[]): number {
  if (checks.length === 0) return 50;

  const weights = { pass: 0, fail: -15, warn: -5, info: 0 };
  let score = 100;

  checks.forEach((c) => {
    score += weights[c.status];
  });

  return Math.max(0, Math.min(100, score));
}
