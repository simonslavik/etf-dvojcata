import path from 'node:path';
import type { NextConfig } from 'next';
import { API_URL } from './lib/config';

// API_URL: rewrity se vyhodnocují při buildu – v Dockeru se předává jako build arg

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
