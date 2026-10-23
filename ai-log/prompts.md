# Ako pracujem s AI – kľúčové prompty

Výber mojich promptov a všetkých zadaní pre agentov z oboch konverzácií. Prompty sú **doslovné** (aj s preklepmi), skrátené sú len vložené texty a obrázky. Úplný kontext je v [surových exportoch](README.md). Každý riadok vedie na commit, ktorý z promptu vznikol. Časy sú miestne (SELČ).

## V skratke

- **Plán pred kódom.** Každé kolo začalo zápisom do [PLAN.md](../PLAN.md) (v1 → v3), až potom implementácia.
- **Stránku testujem ako návštevník.** Väčšinu iterácií riadili moje screenshoty s krátkou spätnou väzbou („overwhelming“, „nepochopí“, „prespamované“). Claude najprv zmeral problém a až potom upravoval.
- **AI nepreberám bez kontroly.** Keď návrh nesedel na cieľ (lead z mobilu za pár sekúnd), zamietol som ho. Prehľad je nižšie.
- **Úzke zadania pre agentov.** Výskum dát, kontrola dát a review kódu robili samostatní agenti s pravidlom „zdroj pri každej hodnote, radšej null než odhad“ a „iba reportuj, nič neupravuj“.
- **Hotovo = overené.** Testy (25 + 39), E2E cez celý stack, screenshoty mobilu aj desktopu, Lighthouse a nezávislý review pred každým zverejnením.

## Kde som AI opravil

| Moja námietka | Čo bolo zle | Výsledok |
|---|---|---|
| „to preklikavanie neviem či si uživatel všimne“ | Claude navrhol prepínač dvoch nástrojov v hero. Návštevník z reklamy ho za pár sekúnd prehliadne | Jeden nástroj v hero, druhý vo vlastnej sekcii · [`f9a0577`](https://github.com/simonslavik/etf-dvojcata/commit/f9a0577) |
| „Otevrit prehlad je potom prespamovane“ | Po odomknutí sa CTA opakovalo 6× a na stránke boli dva formuláre s rovnakým `id` | Jedno CTA, opravené id · [`97b7b90`](https://github.com/simonslavik/etf-dvojcata/commit/97b7b90) |
| „klikne Jak Koupit a nie dvojcata“ | Claude chybu „opravil“ bez overenia. Pravidlo scrollspy bolo zlé a odstup sa počítal dvakrát | Overené automatickým testom, ktorý zostal v E2E · [`39b55da`](https://github.com/simonslavik/etf-dvojcata/commit/39b55da) |
| „nepochopi uzivatel co to mesicne znamena“ | Texty kalkulačky písané pre analytika, nie pre začiatočníka | Popisy prepísané pre laika · [`1db3f1b`](https://github.com/simonslavik/etf-dvojcata/commit/1db3f1b) |
| „aby … ich AI nemali co vytknut“ | Review našiel open redirect cez `//`, otvorený admin pri chýbajúcom `NODE_ENV` a ďalšie | 10 opráv s testami, overené v produkcii · [`fc4fcf3`](https://github.com/simonslavik/etf-dvojcata/commit/fc4fcf3) |

## Prompty po fázach

### Kolo 1 – plán a prvá verzia

| Kedy | Prompt | Výsledok | Commit |
|---|---|---|---|
| 22.&nbsp;10.&nbsp;12:06 | „*(zadanie z e-mailu vložené celé)*“ | Plán do [PLAN.md](../PLAN.md) pred kódom, výber zadania B, výskum dát tromi paralelnými agentmi | [`docs(plan)`](https://github.com/simonslavik/etf-dvojcata/commit/203c3be) [`feat(data)`](https://github.com/simonslavik/etf-dvojcata/commit/c7377f5) |
| 22.&nbsp;10.&nbsp;12:51 | „rob commity ale ich este nepushuj prosim ale cele to implementuj a potom to pretestujem, čo najlepší dizajn a UX, takto vyzera ich stranka …“ | Implementácia po krokoch s commitmi, push až po mojom teste. Nezávislá kontrola dát a review kódu | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/c974286) [`fix(api)`](https://github.com/simonslavik/etf-dvojcata/commit/87b75e4) |

### Kolo 2 a 3 – stack a lead pipeline

| Kedy | Prompt | Výsledok | Commit |
|---|---|---|---|
| 22.&nbsp;10.&nbsp;13:26 | „ešte ten dizajn viacej vymakaj a malo by to mat aj nejaky stack ked tomu zadaniu rozumiem *(+ screenshoty clientelo.cz)*“ | Claude sa spýtal, čo myslím „stackom“. Rozhodol som: tech stack **aj** lead pipeline podľa lievika Clientela | [`docs(plan): v2`](https://github.com/simonslavik/etf-dvojcata/commit/0ce489b) [`refactor!`](https://github.com/simonslavik/etf-dvojcata/commit/09c5505) |
| 22.&nbsp;10.&nbsp;14:07 | „este mozno to dockerizovat aby si to vedel kazdy spustit kto bude robit review“ | Reviewer spustí celé riešenie jedným príkazom, bez účtov a bez Node | [`build(docker)`](https://github.com/simonslavik/etf-dvojcata/commit/c8f112e) |
| 22.&nbsp;10.&nbsp;14:10 | „aky je teraz stack implementovany? FE chcem next a BE nest a DB postgres“ | Oddelený backend v NestJS, monorepo, integračné testy proti Postgresu | [`docs(plan): v3`](https://github.com/simonslavik/etf-dvojcata/commit/19cc7f8) [`feat(api)`](https://github.com/simonslavik/etf-dvojcata/commit/c996a39) |

### Konverzia – stránka z pohľadu návštevníka

| Kedy | Prompt | Výsledok | Commit |
|---|---|---|---|
| 22.&nbsp;10.&nbsp;14:51 | „predtym nez to deployneme a pushneme chcem ten dizajn naozaj vymakat aj tu funkcionalitu aby to potencialne mohlo nabrat leadov …“ | Cieľ je kontakt, nie funkcie: kratšia stránka, jasnejšie CTA | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/d8f10e2) |
| 22.&nbsp;10.&nbsp;14:59 | „… ten header moze byt fixed aby bola ta moznost prihlasit sa stale na ociach uzivatelovi … lebo cielom je ziskat leada predsa“ | Výzva k akcii vždy na očiach: lepkavý header s CTA | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/44621c6) |
| 22.&nbsp;10.&nbsp;15:22 | „ešte niektore segmenty su priliš velké musi uživatel scrollovať veľa … len nevyhnutne informacie“ | Claude výšku sekcií najprv zmeral v obrazovkách. Mobil z 8 na 5,8, potom 4 sekcie | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/e366dad) [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/756aa10) |
| 22.&nbsp;10.&nbsp;15:59 | „*(citácia zo zadania)* … čiže asi defaultne by to malo byt na najit dvojče to to preklikavanie neviem či si uživatel všimne zvažujem či ich nerozdelit na dve segmenty...“ | Námietka proti návrhu AI. Jeden nástroj v hero, druhý vo vlastnej sekcii | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/f9a0577) |
| 22.&nbsp;10.&nbsp;16:18 | „ale aj ta page by mala koncit niecim cim toho lead by sme mohli ziskat či ?“ | Každý koniec stránky vedie ku kontaktu | [`feat(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/1ca6591) |
| 22.&nbsp;10.&nbsp;16:31 | „nakoniec myslim že to je Otevrit prehlad je potom prespamovane v tom landing page“ | E2E potvrdilo 6× opakované CTA a duplicitné `id` | [`fix(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/97b7b90) |
| 22.&nbsp;10.&nbsp;16:46 | „tu nepochopi uzivatel co to mesicne znamena: musi byt všetko jasne pre tych potencialnych leadov“ | Texty pre začiatočníka, nie pre analytika | [`fix(landing)`](https://github.com/simonslavik/etf-dvojcata/commit/1db3f1b) |
| 23.&nbsp;10.&nbsp;09:52 | „ešte keď som scrollnuty dole a kliknem na dvojčata … tak to klikne Jak Koupit a nie dvojcata“ | Bug z ručného testu. Prvá oprava bez overenia nefungovala, automatický test ju odhalil a zostal v E2E | [`fix(report)`](https://github.com/simonslavik/etf-dvojcata/commit/39b55da) |
| 23.&nbsp;10.&nbsp;15:26 | „ešte tieto karty by som vymakal: UI/UX“ | Kopírovanie ISIN už nerozbaľuje kartu, fakty o fonde a alternatívy s vlastným kopírovaním | [`feat(report)`](https://github.com/simonslavik/etf-dvojcata/commit/868040c) |

### Kvalita, bezpečnosť a nasadenie

| Kedy | Prompt | Výsledok | Commit |
|---|---|---|---|
| 23.&nbsp;10.&nbsp;10:42 | „splaňa to teda to zadanie? *(zadanie)* alebo by si ešte niečo zlepšíl?“ | Kontrola voči zadaniu bod po bode, Lighthouse 99/100/100/100 | [`perf(web)`](https://github.com/simonslavik/etf-dvojcata/commit/0078add) |
| 23.&nbsp;10.&nbsp;11:34 | „ano ale predtym skontroluj kod či niečo nieje redundant, chcem aby ma ten kod vedel naozaj predať aj ten technologický stack“ | Review agent + knip, refaktor API a webu, ESLint, Prettier, `npm run check` | [`chore`](https://github.com/simonslavik/etf-dvojcata/commit/bfd8631) [`refactor(api)`](https://github.com/simonslavik/etf-dvojcata/commit/35afee7) |
| 23.&nbsp;10.&nbsp;13:40 | „okej cize teraz to deployni na vercel“ | Dva projekty na Verceli + Neon. Chyba runtime (ESM) zachytená až v produkcii a opravená bundlom | [`build(vercel)`](https://github.com/simonslavik/etf-dvojcata/commit/63bcd60) |
| 23.&nbsp;10.&nbsp;14:08 | „daj este pozor na security veci v repository celkovo aby ked to bude niekto prechadzat s AI cely codebase aby on alebo ich AI nemali co vytknut“ | Nezávislý bezpečnostný review, meranie IP na Verceli, 10 opráv s testami, [SECURITY.md](../SECURITY.md) | [`fix(security)`](https://github.com/simonslavik/etf-dvojcata/commit/fc4fcf3) |
| 23.&nbsp;10.&nbsp;14:58 | „okej tak ešte tuto čast vymakaj prosim *(admin dashboard)*“ | Dashboard podľa krokov pipeline s konverziou medzi krokmi, čitateľný na mobile | [`feat(admin)`](https://github.com/simonslavik/etf-dvojcata/commit/8b6e9cc) |
## Zadania pre agentov

Paralelné úlohy (výskum dát, nezávislé kontroly) Claude delegoval subagentom. Každé zadanie má zúžený rozsah, požadovaný formát výstupu a pravidlo proti halucináciám. Texty sú doslovné.

<details><summary><b>22. 10. 12:52 · Research US NYSE ETF data</b> – Každé číslo musí mať zdroj, inak `null`</summary>

```text
You are a data researcher. Collect VERIFIED, CURRENT facts about popular US-domiciled ETFs for a landing page aimed at Czech retail investors. Accuracy matters more than coverage: every number must come from a page you actually fetched (use WebFetch/WebSearch). Prefer the issuer's official fund page (vanguard.com / investor.vanguard.com, ishares.com, ssga.com, schwabassetmanagement.com, invesco.com); stockanalysis.com or etf.com only as fallback, and say so.

ETFs: VOO, SPY, IVV, VTI, VT, VXUS, VEA, VWO, SCHD, VUG, VIG, BND, IWM, GLD, QQQ.

For each, return:
- ticker, full name, issuer
- primary listing exchange (NYSE Arca vs Nasdaq etc.) — important, we only want NYSE-listed ones as primary set; flag QQQ's exchange explicitly
- index tracked
- expense ratio (%) exactly as published
- AUM / total net assets (USD, with the "as of" date shown on the page)
- inception date
- distribution policy (distributing / accumulating) and dividend frequency
- 10-year annualized total return (NAV) if shown on the page, with its as-of date
- source_url for each value (may be the same URL) and the as_of date shown on the source (or today's date 2026-10-22 as access date if none shown — label it "accessed")

Output: a single JSON array in a ```json code block, one object per ETF, using keys: ticker, name, issuer, exchange, index, ter_pct, aum_usd, aum_as_of, inception, distribution, return_10y_pct, return_as_of, sources (array of {field, url, as_of, accessed}). Use null for anything you could not verify — never guess. After the JSON, list in plain text: any value you could not verify, any conflicts between sources, and anything surprising. Do not write any files.
```

</details>

<details><summary><b>22. 10. 12:53 · Research UCITS twin ETFs</b> – Paralelne s US dátami, s definíciou „exact“ vs „close“</summary>

```text
You are a data researcher. Czech retail investors usually cannot buy US-domiciled ETFs (no PRIIPs KID). For each US ETF below, find its European UCITS "twin" that a Czech retail investor can buy, with VERIFIED facts. Every number must come from a page you actually fetched (WebFetch/WebSearch). Prefer issuer pages (vanguard.co.uk / vanguard.de, ishares.com (EU sites), ssga.com (EU), invesco.com (EU), xtrackers.com); justetf.com is acceptable and good for TER/ISIN/fund size — cite which you used.

US ETFs and the index they track:
- VOO / SPY / IVV — S&P 500 (give 3 options: Vanguard S&P 500 UCITS Acc (VUAA), iShares Core S&P 500 UCITS Acc (CSPX/SXR8), SPDR S&P 500 UCITS Acc (SPYL / SPY5 — check current name, ticker and TER))
- VTI — CRSP US Total Market (closest UCITS alternative, e.g. MSCI USA or total market fund)
- VT — FTSE Global All Cap (e.g. Vanguard FTSE All-World UCITS Acc VWCE, and/or iShares MSCI ACWI SSAC)
- VXUS — Total International ex US
- VEA — developed ex-US
- VWO — emerging markets (e.g. iShares Core MSCI EM IMI EIMI, Vanguard FTSE EM VFEA/VFEM)
- SCHD — US dividend (Dow Jones US Dividend 100) — closest alternative
- VUG — US growth
- VIG — US dividend growers / appreciation
- BND — US total bond
- IWM — Russell 2000 (e.g. SPDR Russell 2000 US Small Cap UCITS)
- GLD — physical gold (note: in EU this is usually an ETC, not UCITS — say so; e.g. iShares Physical Gold ETC, Xetra-Gold, Invesco Physical Gold)
- QQQ — Nasdaq-100 (e.g. iShares Nasdaq 100 UCITS CNDX/SXRV, Invesco EQQQ)

For each twin return: for_us_ticker, name, issuer, isin, tickers (with exchange: Xetra, LSE, etc. — and which trade in EUR/USD), domicile, legal form (UCITS ETF / ETC), index, ter_pct, fund_size (with currency and as_of), distribution (Acc/Dist), match ("exact" if same index, "close" if different but comparable index — explain), sources (array of {field, url, as_of_or_accessed}). Today is 2026-10-22.

Output a single JSON array in a ```json block. Use null for anything unverifiable — never guess. After the JSON, list unverifiable items, conflicts and surprises in plain text. Do not write files.
```

</details>

<details><summary><b>22. 10. 12:53 · Research Czech rules and fund fees</b> – Právne a daňové tvrdenia s istotou high/medium/low</summary>

```text
You are a researcher for a Czech-language landing page for retail ETF investors. Verify the following with primary or reputable sources (fetch pages with WebFetch/WebSearch; cite exact URL and date). Today is 2026-10-22. Never guess; mark anything unverified.

1. PRIIPs: confirm that EU Regulation (EU) No 1286/2014 requires a KID for retail investors and that this is why EU brokers don't sell US-domiciled ETFs (VOO, SPY…) to retail clients. Cite EUR-Lex and one broker help page (e.g. Trading 212, XTB, DEGIRO, Interactive Brokers) that states it. Also: the option of becoming an "elective professional client" — mention briefly with source.
2. Czech tax on selling ETFs/securities (zákon č. 586/1992 Sb. o daních z příjmů, § 4 odst. 1): the 3-year "časový test" exemption, the 100 000 Kč annual gross-income exemption, and the cap on the time-test exemption introduced from 2025 (40 mil. Kč?). Cite zakonyprolidi.cz or financnisprava.cz and/or a reputable Czech source. Quote the relevant paragraph letters.
3. Dividends: US withholding tax for Czech residents on US-domiciled ETFs (15% with W-8BEN, US–CZ treaty) vs. Irish-domiciled UCITS accumulating funds (fund pays 15% on US dividends internally, investor doesn't need to declare dividends). Cite sources.
4. Typical fees of actively managed equity mutual funds (podílové fondy) sold by Czech banks: find 2–3 concrete real examples with their ongoing charges (TER / průběžné náklady) and entry fee (vstupní poplatek) from the fund's KID/sdělení klíčových informací or the bank's fund page (e.g. Česká spořitelna/Erste Asset Management, ČSOB/KBC, Komerční banka/Amundi, Conseq). Prefer funds investing in global/US equities. Give fund name, ISIN, ongoing charges %, max entry fee %, URL, date.
5. Which popular Czech-accessible brokers (XTB, Trading 212, DEGIRO, Interactive Brokers, Fio e-Broker, Revolut, Portu) offer UCITS ETFs like CSPX / VUAA / VWCE — only claim what a fetched page shows. Also each broker's headline fee for ETF trades (e.g. XTB 0% commission up to 100k EUR monthly turnover) with source.

Return structured findings in Markdown with, for each claim: claim (in English), short Czech phrasing suitable for a landing page, source URL, source date/accessed date, confidence (high/medium/low). End with a list of things you could NOT verify. Do not write files.
```

</details>

<details><summary><b>22. 10. 13:00 · Verify ETF dataset independently</b> – Skeptický kontrolór bez prístupu k zápisu, výstup ako tabuľka verdiktov</summary>

```text
You are an independent fact-checker. Be skeptical: your job is to find errors, not to confirm. Read /Users/simon.slavik/clientelo-task/data/etfs.json (do NOT modify any files).

It contains 12 pairs: a US-domiciled ETF ("us") and its suggested European UCITS/ETC "twin". Today is 2026-10-22.

For EVERY pair, fetch the twin's `source_url` (justETF / issuer pages) with WebFetch and verify: isin, ter_pct, distribution (Acc/Dist), index, that the Xetra ticker in `ticker` is correct for that ISIN (if a page lists exchanges/tickers), and size_eur_m roughly (±10%).
For the US side, verify ter_pct and exchange (NYSE Arca) for at least 6 of the 12 using `source_url` (or stockanalysis.com if the issuer page doesn't render).
Also judge each `match` value: "exact" must mean the twin tracks literally the same index as the US ETF; otherwise it should be "close". Flag any wrong label.
Also check the `alts` entries' ISIN and TER for at least 4 of them.

Output a Markdown table: pair | field | value in file | value found | source URL | verdict (OK / WRONG / UNVERIFIABLE). Then list all WRONG items first with the correction, then a one-line accuracy figure: verified-correct fields / fields checked.
```

</details>

<details><summary><b>22. 10. 13:14 · Review landing page code for bugs</b> – Iba report, bez úprav, max. 600 slov</summary>

```text
Review the code in /Users/simon.slavik/clientelo-task (a Vite static landing page + Vercel serverless functions in api/). Do NOT modify any files — report only. Focus on real defects, ranked by severity, each with file:line, a concrete failure scenario and a suggested fix. Skip style nitpicks.

Check specifically:
1. api/lead.js, api/track.js, api/stats.js, api/_lib/*: input validation, injection (Redis command args, HTML in the Resend email), abuse (spam, rate limiting, honeypot), anything that would crash on Vercel's Node runtime (e.g. the JSON import attribute `with { type: 'json' }`, reading req.body when Vercel already parsed it, sendBeacon Blob bodies). Does stats leak data without STATS_TOKEN?
2. src/main.js, src/track.js, src/render.js, index.html inline script: bugs in the form flow (double submit, error states, dialog behaviour on iOS Safari / browsers without <dialog>), localStorage edge cases, tracking events that could be miscounted (e.g. form_view fired multiple times, variant detection mismatch between inline script and track.js), XSS via URL params (utm_content, ad).
3. vite.config.js prerender plugin and vercel.json: will the production build on Vercel serve /api/* functions and the static dist correctly with "type": "module" in package.json?
4. Accessibility/UX bugs on mobile that a test with puppeteer would miss.

You may run `npm test`, `npm run build`, and read files. Keep the report under 600 words.
```

</details>

<details><summary><b>22. 10. 13:53 · Code review of Next.js rewrite</b> – Iba report, každý nález s konkrétnym scenárom zlyhania</summary>

```text
You are reviewing a Next.js 16 (App Router) + TypeScript + Drizzle/Postgres lead-generation app in /Users/simon.slavik/clientelo-task. REPORT ONLY — do not edit any files, do not commit, do not run destructive commands. Note: Next.js 16 differs from older versions (middleware is now `proxy.ts`, params/searchParams are Promises); docs are in node_modules/next/dist/docs/ if you need to check something.

Context: a Czech ETF lead-magnet landing page for mobile ad traffic. Visitor uses a "twin finder" / fee calculator, leaves an email (1 field) in a bottom sheet, then optionally answers a qualification question and optionally requests a phone call (explicit consent) which hands the lead to a CRM webhook. Emails: immediate report + nurture sequence via a daily Vercel Cron and Resend. Admin dashboard at /admin protected by ADMIN_TOKEN (HMAC cookie checked in proxy.ts and in server actions). DB: Neon (DATABASE_URL) in prod, PGlite locally. Key files: proxy.ts, lib/server/*.ts (pipeline.ts, auth.ts, email.ts, http.ts, rate.ts, stats.ts), lib/db/*, app/api/**/route.ts, app/admin/**, components/landing/*.tsx, lib/track.ts, lib/pipeline/*.ts.

Look for real defects, ranked by severity, especially:
1. Security: auth bypasses (proxy matcher gaps, server actions, /api/admin), token leakage (lead token returned to client, unsubscribe/call/qualify by token), open redirects (/api/r), injection, CSV injection, abuse of /api/lead as an email relay, rate limiting, GDPR/consent handling.
2. Correctness of the pipeline: upsert semantics (xmax trick on Neon http vs PGlite), rescore logic, stage transitions, email job status handling (daily cap, disabled, failed retries), cron auth, unsubscribe cancellation, duplicate submissions, race conditions.
3. Things that will break on Vercel deploy: runtime migrations (file tracing of lib/db/migrations), PGlite fallback on Vercel, neon-http limitations, env vars, static prerender + proxy rewrite of `/` with query (?ad=fees) and the variant cookie, caching of /admin.
4. Front-end bugs: React state/effects in components/landing (LeadProvider, LeadSheet with <dialog>, StickyCta IntersectionObserver, Term tooltip), tracking correctness (events double-fired, sid handling), accessibility issues, mobile issues.

For each finding give: severity (high/medium/low), file:line, concrete failure scenario, and a suggested fix in 1-2 sentences. Verify each finding by reading the code carefully (and run `npx tsc --noEmit` / `npx vitest run` if useful); drop anything speculative. Max ~15 findings. Final answer = the findings list only.
```

</details>

<details><summary><b>23. 10. 11:35 · Code quality review for redundancy</b> – Pohľad technického reviewera, bez opakovania nálezov z knipu</summary>

```text
Review the monorepo at /Users/simon.slavik/clientelo-task for CODE QUALITY, not features. REPORT ONLY – do not edit, commit or run destructive commands. The code will be read by a technical interviewer (Clientelo, junior AI developer role), so it must look clean, idiomatic and intentional for its stack.

Stack: npm workspaces. apps/web = Next.js 16 App Router + React 19 + Tailwind 4 (front-end only; /api/* is rewritten to the API). apps/api = NestJS 12 (ESM) + Drizzle ORM + pg + Zod. packages/shared = framework-free TS shared by both. scripts/ = Puppeteer E2E, simulation, screenshots. docker-compose.yml + per-app Dockerfiles. Note Next.js 16 uses proxy.ts instead of middleware; NestJS 12 is ESM-only.

A `knip` run already flagged these, so don't repeat them: unused icons (ArrowDown, Message, Database, Calendar, Calculator, Ban), unused exports TAX (lib/content.tsx), clientIp (api common/http.ts), feeView/EMAIL_RE/GLOSSARY exported but only used locally, scripts shot.mjs/readme-shots.mjs not wired to npm scripts, postcss not listed.

Look for, with file:line and a concrete suggestion each:
1. Dead or leftover code from earlier iterations: components/props/CSS classes/keyframes no longer used (e.g. check globals.css utilities like .window*, .facets, .lift, .stagger, animate-*, .how-line, .strike, .draw-check, keyframes; component props like StatCard `prefix`, LeadForm `autoFocus/stacked/id`, Term `tone`; files like apps/web/components/Shell.tsx, TrackView, PrintButton; leftover AGENTS.md files; `sticky_view` event; anything Vercel/Neon/PGlite-specific left after moving to Docker).
2. Duplication that should be one helper (e.g. repeated window.scrollTo/IntersectionObserver patterns, duplicated logo SVG in Logo/ReportNav/ReportCover, duplicated "copy ISIN" buttons in TwinFinder vs report TwinList, duplicated consent/phone logic, duplicated email-regex in web vs api, duplicated DIST maps).
3. Inconsistencies a reviewer would notice: mixed languages in comments/identifiers, inconsistent import style (e.g. multiple separate imports from '@etfd/shared' in one file), naming, file organisation, error handling patterns in Nest (exceptions vs returns), missing types, `any`, magic numbers.
4. NestJS/Next idioms: anything that looks un-idiomatic (e.g. reading process.env inside decorators, controllers doing service work, module boundaries, DTO/validation placement), and anything in package.json scripts/deps that is redundant.
5. README/PLAN accuracy vs code only if something is clearly wrong.

Run `npx tsc --noEmit` in apps/web and apps/api if useful. Rank by how much each issue would hurt the impression on a reviewer. Max ~20 findings, concise. Final answer = findings list only.
```

</details>

## Ako by som zadal prvý prompt dnes

Spätne (nie je to prompt z konverzácie) by som do prvého pokynu dal mantinely, ktoré som dopĺňal postupne a ktoré stáli dve kolá prepisovania:

```text
Zadanie B z e-mailu nižšie. Najprv plán do PLAN.md, kód až po mojom schválení.
Stack: FE Next.js, BE NestJS, DB Postgres, všetko spustiteľné cez docker compose.
Kód a cesty v angličtine, texty pre návštevníka v češtine. Conventional Commits, nepushuj.
Dizajn podľa clientelo.cz (screenshoty v prílohe). Cieľ: max. leadov z mobilnej reklamy,
prvá obrazovka = sľub reklamy, čo najmenej textu.
Hotovo = testy + E2E cez Docker stack + screenshot mobilu a desktopu.
```
