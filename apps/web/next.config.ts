import path from 'node:path';
import type { NextConfig } from 'next';
import { API_URL } from './lib/config';

// API_URL: rewrity se vyhodnocují při buildu – v Dockeru se předává jako build arg

/*
 * CSP: vše z vlastní domény (API jde přes rewrite /api/*), volitelně PostHog. Inline skripty potřebuje Next
 * pro hydrataci statických stránek (nonce by vypnul statický prerender). Dev server navíc potřebuje eval.
 */
const posthog = 'https://*.posthog.com';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${posthog}${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${posthog}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const config: NextConfig = {
  // Docker image (NEXT_OUTPUT=standalone) – minimální server.js bez celého node_modules
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // Monorepo: trasování závislostí od kořene (packages/shared)
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  poweredByHeader: false,
  // Prohlížeč volá /api/* na stejné doméně (bez CORS, admin cookie zůstává first-party) → Next to přepošle na Nest
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/(report|admin|privacy|unsubscribe|help)(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};

export default config;
