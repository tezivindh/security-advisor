import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  mongoUri: required('MONGO_URI'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  sessionSecret: required('SESSION_SECRET'),

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  github: {
    clientId: required('GITHUB_CLIENT_ID'),
    clientSecret: required('GITHUB_CLIENT_SECRET'),
    callbackUrl: required('GITHUB_CALLBACK_URL'),
    appId: process.env.GITHUB_APP_ID,
    appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },

  groq: {
    apiKey: required('GROQ_API_KEY'),
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '1024', 10),
  },

  tokenEncryptionKey: required('TOKEN_ENCRYPTION_KEY'),

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  limits: {
    maxConcurrentScansPerTeam: parseInt(process.env.MAX_CONCURRENT_SCANS_PER_TEAM || '3', 10),
    maxFilesPerScan: parseInt(process.env.MAX_FILES_PER_SCAN || '500', 10),
    maxSnippetTokens: parseInt(process.env.MAX_SNIPPET_TOKENS || '800', 10),
  },
};
