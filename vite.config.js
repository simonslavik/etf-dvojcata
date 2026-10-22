import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/** V dev režimu obslouží /api/* stejné handlery jako Vercel (nepotřebujeme `vercel dev`). */
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const m = req.url.match(/^\/api\/([a-z]+)(?:\?|$)/);
      if (!m) return next();
      try {
        const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
        await mod.default(req, res);
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end('dev api error');
      }
    });
  },
});

export default defineConfig({
  plugins: [devApi()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        prehled: resolve(import.meta.dirname, 'prehled.html'),
        stats: resolve(import.meta.dirname, 'stats.html'),
        soukromi: resolve(import.meta.dirname, 'soukromi.html'),
      },
    },
  },
});
