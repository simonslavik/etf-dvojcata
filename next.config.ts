import type { NextConfig } from 'next';

const config: NextConfig = {
  // PGlite (lokální Postgres ve WASM) se nesmí bundlovat – načítá .wasm a .data soubory z node_modules
  serverExternalPackages: ['@electric-sql/pglite'],
  // PGlite migruje za běhu (lib/db) – SQL soubory a WASM musí být v balíčku serverových funkcí
  outputFileTracingIncludes: { '/**': ['./lib/db/migrations/**/*', './node_modules/@electric-sql/pglite/dist/**/*'] },
  poweredByHeader: false,
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
