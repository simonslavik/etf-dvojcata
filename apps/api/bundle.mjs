// Vercel Function: celé API (zkompilované tsc do dist/) zabalené do jednoho ESM souboru.
// Runtime Vercelu neumí require() ES modulů, které používá @nestjs/throttler (CJS) → @nestjs/common (ESM-only od Nest 12).
import { build } from 'esbuild';

await build({
  entryPoints: ['dist/serverless.js'],
  outfile: 'dist/vercel.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // volitelné balíčky, které Nest a pg načítají jen když jsou nainstalované
  external: ['@nestjs/microservices', '@nestjs/websockets', 'class-validator', 'class-transformer', 'pg-native'],
  // require() uvnitř zabalených CJS balíčků (node: moduly, volitelné závislosti)
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
  logLevel: 'warning',
});
