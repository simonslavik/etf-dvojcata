import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Nest DI potřebuje emitDecoratorMetadata – esbuild (výchozí ve Vitestu) ho neumí, SWC ano
export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true } },
    }),
  ],
  test: { include: ['test/**/*.test.ts'], fileParallelism: false, testTimeout: 20_000, hookTimeout: 60_000 },
});
