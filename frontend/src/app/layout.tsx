import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SecOps | AI-Powered Security Intelligence Platform',
  description:
    'Continuously scan your JavaScript and TypeScript repositories for vulnerabilities using AI-powered analysis, OWASP mapping, and automated patch suggestions.',
  keywords: ['security', 'vulnerability scanner', 'AI', 'OWASP', 'GitHub', 'DevSecOps'],
  openGraph: {
    title: 'SecOps – AI Security Copilot',
    description: 'Scan GitHub repos for vulnerabilities with AI-powered analysis.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  );
}
