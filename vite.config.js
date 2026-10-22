import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

/** V dev i preview režimu obslouží /api/* stejné handlery jako Vercel (nepotřebujeme `vercel dev`). */
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use(apiMiddleware((path) => server.ssrLoadModule(path)));
  },
  configurePreviewServer(server) {
    server.middlewares.use(apiMiddleware((path) => import(pathToFileURL(resolve(import.meta.dirname, `.${path}`)).href)));
  },
});

const apiMiddleware = (load) => async (req, res, next) => {
  const m = req.url.match(/^\/api\/([a-z]+)(?:\?|$)/);
  if (!m) return next();
  try {
    const mod = await load(`/api/${m[1]}.js`);
    await mod.default(req, res);
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('dev api error');
  }
};

/** Předrenderuje první stav stránky do index.html (sloty <!--ssr:klic-->) ze stejných funkcí, jaké používá prohlížeč. */
const prerender = () => ({
  name: 'prerender-slots',
  async transformIndexHtml(html, ctx) {
    if (!html.includes('<!--ssr:')) return html;
    const data = JSON.parse(readFileSync(resolve(import.meta.dirname, 'data/etfs.json'), 'utf8'));
    const { ssrSlots } = ctx.server
      ? await ctx.server.ssrLoadModule('/src/render.js')
      : await import(pathToFileURL(resolve(import.meta.dirname, 'src/render.js')).href);
    const slots = ssrSlots(data, { monthly: 3000, years: 20 });
    return html.replace(/<!--ssr:(\w+)-->/g, (_, key) => {
      if (!(key in slots)) throw new Error(`Neznámý SSR slot: ${key}`);
      return slots[key];
    });
  },
});

export default defineConfig({
  plugins: [devApi(), prerender()],
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
