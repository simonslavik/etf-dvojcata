# Technické detaily

Pre toho, koho zaujíma, ako je riešenie postavené. Stručný prehľad je v [README](../README.md).

## Stack a architektúra

Monorepo (npm workspaces): **FE Next.js · BE NestJS · DB Postgres**, spustené cez Docker Compose.

| Vrstva | Voľba | Prečo |
|---|---|---|
| **FE** – [apps/web](../apps/web) | **Next.js 16** (App Router), React 19, TypeScript, **Tailwind CSS 4** | Obe varianty reklamy sú staticky predrenderované (rýchle LCP na mobile), interaktívne časti sú klientske „ostrovčeky“. Tokeny dizajnu sú v [globals.css](../apps/web/app/globals.css) |
| Varianty | **`proxy.ts`** (v Next 16 nahrádza middleware) | `/?ad=fees` → interný rewrite na `/v/fees`, varianta sa drží v cookie |
| FE ↔ BE | **rewrite `/api/*` → NestJS** | Prehliadač komunikuje s jednou doménou: bez CORS a admin cookie zostáva first-party. Admin stránky sa renderujú na serveri z JSON-u z API |
| **BE** – [apps/api](../apps/api) | **NestJS 12** (ESM), moduly `Database`, `Tracking`, `Pipeline`, `Email`, `Admin`, `Health` | Každá fáza lievika má svoju službu. Guardy: `OriginGuard` (formuláre), `AdminGuard` (podpísaná cookie s expiráciou),  `CronGuard` (Bearer secret), `ThrottlerGuard` (limity na IP per route). Tajomstvá sa porovnávajú v konštantnom čase. Validácia cez Zod (`ZodPipe`), env sa validuje pri štarte (`@nestjs/config`). Dotazy pre dashboard sú v injektovateľnej `StatsService` |
| Plánovač | V Dockeri **`@nestjs/schedule`** (denne 7:00, Europe/Prague), na Verceli **Vercel Cron**. Oba volajú chránený `GET /cron/emails` | Kroky sekvencie D2/D5/D9 a opakovanie neúspešných odovzdaní |
| **DB** | **Postgres 17** + **Drizzle ORM** (`pg` Pool) | Schéma v TypeScripte, migrácie generuje `drizzle-kit` a API ich pri štarte spustí v transakcii ([apps/api/drizzle](../apps/api/drizzle)) |
| Zdieľané – [packages/shared](../packages/shared) | čisté TS bez frameworku | Dáta ETF, kalkulačka, pravidlá skóre, sekvencia, súhlasy, udalosti. FE aj BE počítajú rovnako |
| E-maily | **Resend** (REST) | Okamžitý e-mail + sekvencia, one-click odhlásenie (RFC 8058), atomické „zabratie“ jobu, retry |
| Beh lokálne | **Docker Compose**: `db` + `api` + `web` (+ `demo-data`) | Reviewer spustí všetko jedným príkazom. Image sú multi-stage, bežia pod neprivilegovaným používateľom a majú health checky |
| Produkcia | **Vercel** (2 projekty, región Frankfurt) + **Neon Postgres** | Web je Next.js projekt, API beží ako Vercel Function: tsc výstup zabalený cez esbuild do jedného ESM súboru ([bundle.mjs](../apps/api/bundle.mjs)). Migrácie bežia raz pri builde, denný beh spúšťa Vercel Cron s `CRON_SECRET`. Kód je rovnaký ako v Dockeri, líši sa len vstupný bod ([serverless.ts](../apps/api/src/serverless.ts) vs. [main.ts](../apps/api/src/main.ts)) |
| Testy | **Vitest** (25 shared + 39 API proti reálnemu Postgresu cez supertest) + **Puppeteer E2E** | E2E prejde celú cestu v oboch variantoch cez celý stack až po žiadosť o hovor, vrátane navigácie v prehľade |
| Kvalita kódu | **ESLint** (Next core-web-vitals + typescript-eslint), **Prettier** (+ triedenie Tailwind tried), **knip** (mŕtvy kód a závislosti), striktný TypeScript | `npm run check` spustí typecheck, lint, formát, knip aj testy jedným príkazom |

```
Prehliadač ──▶ web (Next.js :3000)
  /?ad=twin|fees ─ proxy.ts ─▶ /v/twin | /v/fees (statické HTML)
  /api/* ─────── rewrite ────▶ api (NestJS :4000) ──▶ db (Postgres)
      POST /track     → TrackingService          → events
      POST /lead      → LeadsService.capture     → leads + email_jobs → EmailService (Resend, D0)
      POST /qualify   → LeadsService.qualify     → ScoringService.rescore
      POST /call      → LeadsService.requestCall → HandoffService → HANDOFF_WEBHOOK_URL (CRM / call centrum)
      GET  /r, /unsubscribe → LinksController (klik v e-maile, odhlásenie)
      /admin/*        → AdminGuard → dashboard, lead, export, útrata, ručné odovzdanie
  /admin (SSR) ── fetch s cookie ──▶ api /admin/dashboard …
PipelineScheduler (@nestjs/schedule, denne) → SequenceService.runDue (D2/D5/D9) + HandoffService.retryFailed
```

## Lead pipeline (podľa lievika Clientela)

`Reklama → Návštěva → Lead → Kvalifikace → Předání → Péče`

| Fáza | Čo sa deje | Kde |
|---|---|---|
| **Návštěva** | Udalosti bez cookies (anonymné ID relácie v `sessionStorage`): príchod, interakcia, CTA, formulár… | `events` |
| **Lead** | E-mail → upsert (opakované odoslanie neprepíše pôvodný zdroj), naplánovanie sekvencie, okamžitý e-mail | `leads`, `email_jobs` |
| **Kvalifikace** | Skóre z odpovede a zo správania. Hranica pre „kvalifikovaný“ je 35 bodov | [packages/shared/src/score.ts](../packages/shared/src/score.ts) |
| **Předání** | Iba s **telefónom a výslovným súhlasom**: webhook do CRM. Bez webhooku je lead vo fronte a v adminu sa dá odovzdať ručne | [apps/api/src/pipeline](../apps/api/src/pipeline) |
| **Péče** | D0 prehľad · D2 ako kúpiť · D5 dane · D9 „už máte prvé ETF?“ + ponuka pomoci (→ späť do odovzdania) | [apps/api/src/email](../apps/api/src/email) |

**Skóre leadu:** e-mail +10 · investuje do 2 tis. +10 / 2 – 10 tis. +25 / nad 10 tis. +40 · počítal poplatky +5 · skopíroval ISIN +10 · otvoril prehľad +5 · klikol v e-maile +10 · chce hovor +30. Dashboard pri každom leade ukazuje rozpis, takže obchodník vidí, prečo je lead „horúci“.

**Admin** (`/admin`, `ADMIN_TOKEN`): pipeline s počtami, KPI (leady, **náklad na lead** z útraty zadanej ku kreatíve, kvalifikovaní, odovzdaní), lievik návštevníka, leady za 14 dní, tabuľka A/B, kampane podľa `utm_content`, štatistiky sekvencie, posledné leady, detail leadu s celou cestou relácie, náhľad e-mailov a CSV export. Postrehy počíta jednoduché pravidlo, nie LLM: najväčší únik pred leadom a z-test konverzie A vs. B.

## Meranie celej cesty

| Krok lievika (dashboard) | Udalosti |
|---|---|
| Návštěva (+ UTM, variant, zariadenie) | `page_view` |
| Interakce s nástrojem | `finder_select`, `calc_change`, `isin_copy` |
| Klik na CTA | `cta_click` (zdroj: finder / calc / header) |
| Viděl formulář → Začal psát | `form_view` → `form_start` (+ `form_error`, `form_submit`) |
| **Lead** | `lead_ok` – zapisuje **server**, z prehliadača sa nedá podvrhnúť |
| Kvalifikace → Předání | `qualify` → `call_request` → `handoff` (server) |
| Péče | `email_click`, `unsubscribe` (server), stavy v `email_jobs` |
| Ostatné | `scroll` 25/50/75/100, `faq_open`, `term_open`, `report_open/view` |

Lievik počíta **unikátne relácie** v každom kroku, zvlášť pre každú variantu. Pri leade sa ukladá zdroj, UTM, variant, ticker, o ktorý mal záujem, a suma z kalkulačky. Voliteľne sa dá pripojiť PostHog (`NEXT_PUBLIC_POSTHOG_KEY`, bez cookies) kvôli heatmapám a záznamom relácií.

## Výkon, dizajn a animácie

**Výkon (Lighthouse, mobil, reálne spomalenie siete a CPU, produkčný build):** výkon **99** (LCP 1,6 – 1,7 s, CLS 0), prístupnosť **100**, best practices **100**, SEO **100**, pre oba varianty. Simulovaný režim Lighthouse proti lokálnemu serveru ukazuje 92 (LCP 3,2 s): simulácia započíta do kritickej cesty aj JS a písma, ktoré sa na lokálnom serveri stihnú stiahnuť pred vykreslením, hoci nadpis je vykreslený na serveri a na ne nečaká.

**Dizajn** vychádza z vizuálneho jazyka clientelo.cz: serifové nadpisy (Lora) + Lexend, tmavá petrolejová a tehlová, eyebrow nadpisy s rozšíreným prestrihom, ikony v tónovaných štvorcoch, náhľad prehľadu v rámčeku „okna aplikácie“, slovníček s otáznikom pri pojme a reťazec krokov ako v ukážke dashboardu. Značka zostáva vlastná („ETF dvojčata“). Stránka by tak zapadla do portfólia Clientela, a pritom sa za Clientelo nevydáva.

**Animácie sú jemné a vysvetľujú:** americký ticker sa prečiarkne a dvojča sa vysunie, suma úspory sa plynulo dopočíta, čísla sa pri zobrazení dopočítajú od nuly, sekcie pod prvou obrazovkou sa jemne vynoria, po odoslaní sa vykreslí fajka s krátkou oslavou vo farbách značky. Čo je vidno hneď po načítaní, sa nikdy neskryje. Všetko rešpektuje nastavenie „obmedziť pohyb“.

## Úplný zoznam toho, čo chýba pred kampaňou

- [x] **Verejný hosting:** Vercel (Hobby) + Neon (free), E2E prechádza proti produkcii. Bez Resend kľúča sa e-maily iba logujú. Pred kampaňou doplniť `RESEND_API_KEY` + overenú doménu a vlastnú doménu namiesto `*.vercel.app`. Vercel Cron na pláne Hobby beží raz denne s presnosťou ±1 h, čo pre sekvenciu D2/D5/D9 stačí.
- [ ] **Produkčné env:** silné `ADMIN_TOKEN` a `CRON_SECRET` (v compose sú len demo hodnoty), `SITE_URL` s HTTPS, `RESEND_API_KEY` + `RESEND_FROM` (overená doména), voliteľne `HANDOFF_WEBHOOK_URL`. Zálohy Postgresu.
- [ ] **Právne:** prevádzkovateľ v `/privacy`, kto volá (vlastný tým alebo partner), posúdenie súhlasov, srovnávacia reklama s konkrétnym fondom (reklama B), Meta „special ad category“.
- [ ] **Prehľad je „mäkko“ zamknutý:** `/report` je dostupný aj bez e-mailu (noindex). Kto ho hľadá cez URL, by e-mail aj tak nezadal.
- [ ] **PDF** je zatiaľ „uložiť ako PDF“ cez tlač, nie generovaný súbor.
- [ ] **Dostupnosť u brokerov** je overená iba pre XTB.
- [ ] **Aktualizácia dát:** TER a veľkosti fondov sú snímka k 22. 10. 2026. Pre produkciu by bol potrebný mesačný job s výskumným a kontrolným agentom.
- [ ] **Limity na IP** (`@nestjs/throttler`) sú v pamäti procesu. Na Verceli má každá inštancia funkcie vlastné počítadlo, takže limit je len približný. Pred kampaňou s väčším rozpočtom treba Redis storage (napr. Upstash). Denné stropy e-mailov sú v Postgrese.
- [ ] **Turnstile / captcha** pred ostrou kampaňou. Teraz chráni honeypot, kontrola Origin, limity na IP a denný strop 50 leadov na IP v Postgrese.
- [ ] **Retencia dát:** tabuľka `events` sa zatiaľ nečistí a výmaz leadu na žiadosť je ručný SQL. Pred kampaňou pridať úlohu na výmaz po 3 rokoch a výmaz z adminu.
- [ ] **Skenery odkazov** (Outlook Safe Links) môžu zaznamenať „klik v e-maile“. Riešením je počítať klik až z beaconu na cieľovej stránke.
- [ ] **Double opt-in** e-mailu, ak to bude vyžadovať právny posudok.

## Spustenie

Najrýchlejšie cez Docker (pozri [README](../README.md#spustenie)). Pre vývoj bez kontajnerov pre API a web:

```bash
npm install
cp .env.example .env             # DATABASE_URL na Postgres z docker compose
npm run db                       # iba Postgres v Dockeri (localhost:5544, + testovacia DB etfd_test)
npm run dev:api                  # NestJS na :4000 (watch)
npm run dev:web                  # Next.js na :3000, /api/* → :4000
npm test                         # 25 testov shared + 39 integračných testov API proti Postgresu
npm run check                    # typecheck + lint + prettier + knip + testy
npm run format                   # Prettier na celý repozitár
npm run e2e -- http://localhost:3000                              # celá cesta v prehliadači (vývoj: admin otvorený)
ADMIN_TOKEN=review-token npm run e2e -- http://localhost:3000     # to isté proti Docker stacku
npm run simulate -- http://localhost:3000 400                     # simulovaná návštevnosť do dashboardu
npm run ads                      # vyrenderuje reklamy a OG obrázok
npm run shots -- http://localhost:3000 review-token   # screenshoty do README
```

**Štruktúra:** `apps/web` (Next.js: `app/` stránky + admin UI, `components/` po oblastiach `landing/`, `report/`, `lead/`, `admin/`, `ui/`, `hooks/` (stav prehliadača cez `useSyncExternalStore`, animované čísla), `lib/` (klient API, tracking, úložisko), `proxy.ts`) · `apps/api` (NestJS: `src/<modul>/`, `drizzle/` migrácie, `test/`) · `packages/shared` (dáta a pravidlá, `test/`) · `ads/` · `scripts/` (E2E, simulácia, screenshoty, reklamy) · `docker-compose.yml`
