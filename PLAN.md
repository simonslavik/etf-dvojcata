# Plán – Zadanie B: Konverzná landing page (ETF z NYSE pre českého investora)

> Stav: **návrh na schválenie**. Body označené ❓ čakajú na rozhodnutie.

## 1. Kľúčový insight (na ňom stojí celá stránka)

Český drobný investor si populárne ETF z NYSE (VOO, SPY, IVV, VTI, SCHD…) u bežného
brokera (XTB, Trading 212, Revolut, Portu…) **väčšinou kúpiť nemôže**. Od roku 2018
platí regulácia PRIIPs: americké ETF nemajú KID dokument, a preto ich EU brokeri
retailovým klientom nesmú predať. Väčšina ľudí na to príde až v aplikácii brokera.

Z toho vyplýva hodnota pre návštevníka: **„Pre každé slávne americké ETF vám ukážeme
jeho európske (UCITS) dvojča, ktoré si v ČR naozaj kúpite, a porovnáme poplatky.“**
Je to konkrétna a prekvapivá informácia a dá sa okamžite ukázať, takže hodnota je
viditeľná ešte pred formulárom.

Splní to zadanie: porovnávame ETF obchodované na NYSE (NYSE Arca) a navyše riešime
reálny problém českého investora. QQQ je na Nasdaq, takže ho buď vynecháme, alebo ho
uvedieme s poznámkou.

## 2. Cieľová skupina

- Čech, 25 – 40 rokov, príjem nad mediánom, na mobile (Instagram/Facebook/TikTok reklama).
- O ETF už počul („S&P 500 je najlepšia investícia“) a má alebo zvažuje XTB/Trading 212.
- Investuje 2 – 10 tis. Kč mesačne, prípadne ešte nezačal.
- Bolesť: zahltenie (ktoré z 10 ETF na S&P 500?), strach z poplatkov a daní, neistota.
- Na stránke strávi pár sekúnd, takže prvá obrazovka musí odpovedať na otázku „čo tu dostanem“.

Jazyk stránky je **čeština** (návštevník je Čech). README bude v slovenčine.

## 3. Lead magnet a moment žiadosti o kontakt

**Hodnota zdarma (bez formulára):**
1. Vyhľadávač „dvojčat“: návštevník klikne na VOO/SPY/VTI… a hneď uvidí UCITS ekvivalent,
   TER oboch a kde ho kúpi.
2. Kalkulačka poplatkov: „Pri 5 000 Kč/mesiac za 20 rokov zaplatíte na poplatkoch X Kč
   v drahšom fonde vs. Y Kč v lacnejšom.“ Výsledok sa zobrazí hneď.

**Za e-mail (1 pole + GDPR súhlas):**
„Kompletný prehľad 15 ETF + ich UCITS dvojčat, poplatky, ktorý broker čo ponúka
a ako funguje 3-ročný časový test na dane.“ Dostane ho ako PDF/stránku hneď po
odoslaní (na obrazovke) aj e-mailom.

**Moment žiadosti:** až po prvej interakcii (klik na ETF / výsledok kalkulačky), keď
návštevník už dostal ochutnávku. Plus sticky CTA na mobile a záložný formulár na konci.
Každý interaktívny prvok končí CTA na ten istý formulár.

**Po odoslaní:** okamžite odomknutá plná tabuľka priamo na stránke, odkaz na PDF,
e-mail s rovnakým obsahom a jedna ďalšia otázka (napr. „Koľko mesačne investujete?“)
na segmentáciu, ktorá je nepovinná.

## 4. Štruktúra stránky (návrh poradia)

1. **Hero** nadväzuje na reklamu: „VOO si v Česku nekoupíte. Tady je jeho dvojče.“
   Pod tým sú 3 – 4 klikateľné tickery ako prvá interakcia.
2. **Výsledok dvojčaťa** (inline karta) s CTA „Pošlete mi všech 15 dvojčat“.
3. **Kalkulačka poplatkov** (slider: mesačný vklad, roky) s CTA.
4. **Ukážka tabuľky**, zvyšok rozmazaný (vidno, čo dostane) a formulár.
5. **Dôvera:** zdroje dát s dátumom, kto sme, „nie je to investičné odporúčanie“.
6. **FAQ** (3 otázky: dane, PRIIPs, ktorý broker) a záverečný formulár.

## 5. Dve verzie reklamy

- **A – Problém/prekvapenie:** „Chtěl jsi koupit VOO a XTB ti ho nenabídne? Tady je jeho
  evropské dvojče.“ Vizuál: screenshot „produkt nedostupný“ a šípka na UCITS ticker.
- **B – Peniaze/poplatky:** „Stejný S&P 500, o 0,4 % ročně levněji. Za 20 let rozdíl
  XX 000 Kč.“ Vizuál: dve čísla vedľa seba. (Čísla doplníme z kalkulačky.)

Obe dodáme ako obrázky 1080×1350 (Meta feed) s textami a hero stránky upravíme podľa
`?ad=a|b` (message match).

## 6. Dáta

- Zdroje: weby emitentov (Vanguard, iShares/BlackRock, SPDR/SSGA, Schwab, Invesco) pre
  TER, AUM, burzu a dátum vzniku; justETF pre UCITS ekvivalenty a ich TER.
- Pri každom údaji uvedieme zdroj a dátum (`data/etfs.json` s poľami `source_url`, `as_of`).
- Zber robia agenti paralelne (jeden na emitenta). Výstup krížovo overí druhý agent
  a ja náhodne skontrolujem vzorku ručne. Postup aj chyby zapíšeme do README.

## 7. Meranie celej cesty

Udalosti: `page_view (utm, ad variant)`, `scroll_25/50/75`, `etf_click`, `calc_used`,
`cta_click (source)`, `form_view`, `form_start`, `form_submit`, `form_error`, `thank_you_view`.
Funnel: príchod → interakcia → videný formulár → začatý → odoslaný.

❓ **Nástroj:** PostHog (free tier, funnely bez nastavovania; potrebuje tvoj účet a
projektový kľúč) **alebo** vlastný endpoint `/api/track` na Verceli + Upstash Redis
(free). Odporúčam PostHog.

## 8. Technológia

- Statický web: Vite + vanilla TS + ručne písané CSS. Zameriavame sa na rýchlosť na mobile
  (LCP < 1,5 s), bez ťažkého frameworku. Žiadne „AI default“ komponenty.
- Formulár ide na Vercel serverless funkciu `/api/lead`, ktorá ho uloží.
  ❓ **Úložisko leadov + e-mail:** Upstash Redis (free) + Resend (free 100 mailov/deň) –
  potrebuješ účty. Bez nich by stačil len zápis + zobrazenie výsledku na stránke.
- Hosting: Vercel (CLI treba nainštalovať a prihlásiť – `npm i -g vercel`).

## 9. Výstupy do repozitára

`README.md` (cieľovka, poradie sekcií, očakávaná konverzia, 3 A/B hypotézy, práca s AI),
`ads/` (2 verzie reklamy), `data/` (dáta so zdrojmi), `src/`, `api/`, `ai-log/` (export /export).

## 10. Postup po krokoch (každý = commit)

1. Plán (tento súbor) ✔
2. Zber a overenie dát → `data/etfs.json`
3. Kostra stránky + texty (najprv copy, potom dizajn)
4. Interaktívne prvky (dvojčatá, kalkulačka)
5. Formulár + API + stránka po odoslaní
6. Tracking + funnel
7. Reklamy A/B
8. Deploy na Vercel, Lighthouse audit na mobile
9. README + ai-log

---

# Plán v2 – stack a lead pipeline (22. 10. 2026)

Spätná väzba po prvej verzii: (1) stránka má mať skutočný stack, nie len statický web,
(2) dizajn má byť bližšie k vizuálnemu jazyku Clientela (clientelo.cz).

## Stack

| Vrstva | Voľba | Prečo |
|---|---|---|
| Front-end | **Next.js 16 (App Router) + React 19 + TypeScript** | Obe varianty reklamy staticky predrenderované (rýchly LCP), interaktívne časti ako klientske komponenty |
| Štýly | **Tailwind CSS 4** + dizajnové tokeny v `@theme` | Konzistentné tokeny (farby, písma, rádiusy) namiesto ručného CSS |
| Varianta reklamy | **`proxy.ts`** (Next 16 middleware) | `?ad=fees` → interný rewrite na `/v/fees`; varianta sa drží v cookie, bez blikania a bez inline skriptu |
| Databáza | **Postgres + Drizzle ORM** – Neon (prod, free) / PGlite (lokálne, Postgres vo WASM) | Lokálne beží bez účtov a nastavovania, v produkcii stačí `DATABASE_URL` |
| E-mail | **Resend** + **Vercel Cron** | Okamžitý e-mail s prehľadom + sekvencia D2/D5/D9 |
| Testy | **Vitest** (výpočty, skóre) + **Puppeteer E2E** (celá cesta + pipeline) | |

## Lead pipeline (podľa lievika Clientela)

`Reklama → Návštěva → Lead → Kvalifikace → Předání → Péče`

1. **Návštěva** – udalosti v tabuľke `events` (relácia, variant, UTM, zariadenie).
2. **Lead** – e-mail (1 pole). Upsert do `leads`, prepojenie s reláciou (`sid`), okamžitý e-mail.
3. **Kvalifikace** – nepovinná otázka „kolik měsíčně investujete“ + **skóre leadu** z odpovede a správania (kalkulačka, kopírovanie ISIN, otvorený prehľad, kliky v e-mailoch).
4. **Předání** – nepovinná ponuka „pomůžeme s prvním nákupem, zavoláme vám“ (telefón + výslovný súhlas). Lead sa odošle webhookom do CRM/call centra (`HANDOFF_WEBHOOK_URL`). Bez súhlasu sa nič neodovzdáva.
5. **Péče** – e-mailová sekvencia (D0 prehľad, D2 ako kúpiť, D5 dane, D9 kontrola + ponuka pomoci), odhlásenie jedným klikom, sledovanie klikov.

## Admin (`/admin`, chránené `ADMIN_TOKEN`)

Pipeline s počtami, KPI (leady, náklad na lead z vloženého spendu, kvalifikované, odovzdané), lievik podľa variantu, náklad a konverzia podľa kampane, tabuľka leadov so skóre a fázou, detail leadu s celou cestou relácie, CSV export.

## Dizajn

Vizuálny jazyk Clientela, značka zostáva „ETF dvojčata“: serifové nadpisy (Lora) + Lexend, tmavá petrolejová a tehlová, eyebrow nadpisy s prestrihom, karty s ikonou v tónovanom štvorci, „okno aplikácie“ pre nástroje, slovníček pojmov s otáznikom (UCITS, TER, ISIN, KID). Žiadne vymyslené referencie – namiesto nich karty dôvery postavené na faktoch.

---

# Plán v3 – oddelený backend: Next.js + NestJS + Postgres (22. 10. 2026)

Rozhodnutie: FE **Next.js**, BE **NestJS**, DB **Postgres**. Nasadenie zatiaľ **iba Docker** (`docker compose up`), Vercel/Neon odkladáme.

## Štruktúra (npm workspaces)

```
apps/web        Next.js 16 – landing, prehľad, UI adminu. /api/* → rewrite na Nest (jedna doména, bez CORS)
apps/api        NestJS 12 – moduly: Database, Tracking, Leads, Pipeline (skóre, odovzdanie), Email (Resend + @nestjs/schedule),
                Links (klik v e-maile, odhlásenie), Admin (guard + dashboard, export, útrata), Health
packages/shared čisté TS: dáta ETF, kalkulačka, formátovanie, udalosti, pravidlá skóre, sekvencia, súhlasy, telefón
```

## Rozhodnutia

- **DB:** reálny Postgres 17 všade (docker), Drizzle ORM + `pg` Pool, migrácie pri štarte API (jeden proces, v transakcii). PGlite a Neon HTTP driver odstránené.
- **Admin:** cookie vydáva Nest (`POST /admin/login`), Next stránky adminu ju pri SSR preposielajú do API. Formuláre adminu sú obyčajné POST formuláre cez rewrite (SameSite=Lax + kontrola Origin).
- **Cron:** `@nestjs/schedule` (denne 7:00) + chránený endpoint na ručné spustenie.
- **Validácia:** Zod schémy cez vlastný `ZodValidationPipe`, konfigurácia cez `@nestjs/config` so Zod validáciou env.
- **Testy:** shared (Vitest), API (Vitest + SWC + supertest proti reálnemu Postgresu), E2E (Puppeteer) cez celý docker stack.
