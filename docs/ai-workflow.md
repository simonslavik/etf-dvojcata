# Práca s AI – podrobne

Úplný záznam pokynov pre agentov, kontrol a chýb AI po kolách. Stručne je to v [README](../README.md#ako-som-pracoval-s-ai), kľúčové prompty v [ai-log/prompts.md](../ai-log/prompts.md).


Pracoval som v Claude Code v troch kolách a potom v sérii UX iterácií podľa mojej spätnej väzby. Vždy platilo: **najprv plán** ([PLAN.md](../PLAN.md)), potom implementácia po krokoch s commitmi a nakoniec kontroly (unit testy, E2E v prehliadači, screenshoty, nezávislý review agent).

## Kolo 1 – statická stránka (Vite)

| Agent | Zadanie od Clauda (skrátene) | Ako som kontroloval výstup |
|---|---|---|
| **Výskum US ETF** | 15 ETF: TER, burza, index, AUM, *zdroj a dátum pri každej hodnote*, primárne weby emitentov, „null namiesto odhadu“, na konci zoznam neoverených vecí | Krížová kontrola tretím agentom, ručná kontrola niekoľkých hodnôt |
| **Výskum UCITS dvojčiat** | Ku každému US ETF UCITS ekvivalent: ISIN, tickery, TER, Acc/Dist, veľkosť, „exact/close“ s vysvetlením | To isté + kontrola logiky „exact“ (musí byť doslova rovnaký index) |
| **Výskum ČR** | PRIIPs, dane (paragrafy), poplatky bankových fondov z KID, dostupnosť u brokerov, *pri každom tvrdení zdroj a istota* | Na stránku išli len tvrdenia s vysokou istotou |
| **Nezávislý kontrolór** | „Buď skeptický, hľadaj chyby“: znovu načítať zdroje, vrátiť OK / WRONG / UNVERIFIABLE | Výsledok 130/130 |
| **Code review** | Bugy v API, formulároch, trackingu, prístupnosti; iba report | 14 nálezov, 13 opravených |

## Kolo 2 – stack, pipeline, dizajn

Po prvej verzii som dal spätnú väzbu: stránka má mať skutočný stack a dizajn má byť bližšie ku Clientelu (poslal som screenshoty clientelo.cz). Claude najprv položil otázku, čo myslím „stackom“ (tech stack vs. lead pipeline). Odpovedal som „oboje“. Potom doplnil plán v2 a postupoval v commitoch: backend pipeline → stránka v Reacte → admin → reklamy → review.

- **Overovanie:** po každom kroku `tsc`, unit testy, `curl` na API (vrátane pokusov o open redirect, chybného JSON-u a telefónu bez súhlasu) a screenshoty mobilu aj desktopu, ktoré si Claude sám prezeral. E2E test prejde v prehliadači celú cestu oboch variantov a nakoniec cez admin API overí lievik aj uložený lead.
- **Dokumentácia namiesto pamäti:** Next.js 16 má zmeny (middleware → `proxy.ts`, Turbopack), preto Claude pred písaním kódu čítal dokumentáciu priamo v `node_modules/next/dist/docs`.
- **Grafy v dashboarde:** farby variantov A/B overil validátor palety (CVD ΔE 15,6, kontrast ≥ 3:1). Pôvodná dvojica petrolejová/tehlová neprešla, lebo ju ľudia s protanopiou ťažko rozlíšia.

## Kde sa AI pomýlila (a ako som to zachytil)

**Kolo 1**
- Agent pre UCITS označil VXUS ako „exact“, hoci v poznámke sám napísal, že index je iný.
- Agent pre ČR uviedol neaktuálny TER fondu VWCE (0,22 % namiesto 0,14 %). Rozpor som riešil podľa primárneho zdroja.
- Hlavný agent tvrdil, že strop 40 mil. Kč pri časovom teste platí. Výskumný agent zistil, že pre cenné papiere bol od roku 2026 zrušený.
- Text „XTB ani Trading 212 vám VOO neprodá“ som stiahol, lebo bol overený len u brokera Lynx.

**Kolo 2** (všetko zachytené screenshotmi, testami alebo čítaním výstupu, nie až používateľom)
- **Široké medzery v nadpisoch:** `tabular-nums` na `body` zapol v písme Lora funkciu `tnum`, ktorá nahrádza aj medzeru širokou „číselnou“ medzerou (37 px namiesto 16 px). Claude to najprv hľadal v `text-wrap: balance`, potom zmeral šírku medzery v prehliadači a príčinu našiel. Opravené: `tnum` je len na číslach.
- **Pretečenie na mobile:** riadok tickerov s `overflow-x: auto` roztiahol stĺpec gridu (chýbalo `minmax(0, 1fr)`).
- **PGlite padal** pri prvom dotaze, lebo nevytvorí rodičovský priečinok.
- **Fokus v sheete:** `showModal()` presunul fokus na zatváracie tlačidlo namiesto e-mailového poľa, takže na iOS by sa neotvorila klávesnica. Zachytil to E2E.
- **Ochrana proti CSV injection** pokazila telefónne čísla (`'+420…`). Zachytil to E2E.
- **Zavádzajúci postreh v dashboarde:** „najväčší únik: kvalifikácia → odovzdanie 100 %“. Odovzdanie je nepovinný krok, preto sa únik teraz hľadá len po lead.
- **Texty v rozpore so správaním:** karta dôvery sľubovala „žádné předávání dál“, hoci existuje odovzdanie na hovor (so súhlasom). CTA „Poslat výpočet do e-mailu“ sľubovalo niečo, čo e-mail neobsahuje. Obe opravené.

## Výsledok review (kolo 2)

Review agent dostal kód bez kontextu konverzácie a jediný pokyn: „iba reportuj, nič neupravuj, každý nález over v kóde“. Našiel 13 problémov. Všetky som posúdil ako reálne a opravil som 11. Opravy overujú nové testy (`tests/security.test.ts`), E2E a `curl` proti produkčnému buildu (`next start`).

| Závažnosť | Problém | Oprava |
|---|---|---|
| **Vysoká** | **Open redirect** v `/api/r`: `?to=/%09/evil.com` prešiel kontrolou `startsWith('/')`, lebo URL parser tabulátor zahodí | Cieľ sa parsuje rovnako ako v prehliadači a musí mať náš origin. Test so 7 variantmi útoku |
| **Vysoká** | `/api/lead` bez hlavičky `Origin` (curl) = **relay na posielanie e-mailov** na cudzie adresy. Navyše minie denný limit, takže skutoční ľudia nedostanú prehľad | Mimo `next dev` sa požiadavka bez Originu odmietne. Okamžitý e-mail (D0) a sekvencia majú oddelené denné limity |
| Stredná | Neúspešný e-mail (429/5xx) sa už nikdy nepošle, cron posiela bez odstupov, chýba timeout | Pokusy s počítadlom (max. 3), odstup 550 ms, timeout 8 s |
| Stredná | Migrácie pri prvom requeste cez neon-http (bez transakcie, súbeh pri studenom štarte) | Neon sa migruje pri `npm run build` v transakcii (`scripts/migrate.mjs`), PGlite za behu |
| Stredná | Produkcia bez `DATABASE_URL` by potichu bežala na PGlite v `/tmp` (každá inštancia má vlastnú DB) | V produkcii hlasitá chyba. `SITE_URL` má fallback na produkčnú doménu Vercelu |
| Stredná | Admin a cron bez tokenu boli otvorené na preview deployoch aj pri self-hostingu (`VERCEL_ENV` ≠ production) | Fail closed všade okrem `next dev` |
| Stredná | Opakované odoslanie telefónu = **duplicitný lead v CRM**, neúspešné odovzdanie sa neopakuje | Už odovzdaný lead sa neposiela znovu, webhook má `idempotency_key`, cron opakuje neúspešné odovzdania |
| Nízka | Login do adminu bez limitu pokusov, porovnanie tokenu `!==` | 10 pokusov / 15 min na IP, porovnanie v konštantnom čase |
| Nízka | Text súhlasu posielal klient, takže sa dal podvrhnúť | Klient posiela iba ID verzie (`email_v1`, `call_v1`), server ukladá kanonické znenie ([packages/shared/src/consent.ts](../packages/shared/src/consent.ts)) |
| Nízka | `/api/track` bez limitu, klient mohol posielať aj `qualify` a `call_request` | 600 udalostí / 10 min na IP. Kvalifikáciu a hovor zapisuje iba server |
| Nízka | Cron a odoslanie formulára mohli poslať ten istý e-mail dvakrát | Job sa pred odoslaním atomicky „zaberie“ (`scheduled → sending`) a odhlásenie sa kontroluje až po zabratí |
| Nízka | Čítačka obrazovky neoznámila nové dvojča (live region sa pri každej zmene vymenil) | Live region zostáva v DOM, tlačidlá tickerov majú `aria-pressed` |

**Vedome neopravené** (v časti „Čo chýba“ v README): captcha / Turnstile proti botom (potrebuje účet, zatiaľ stačí honeypot + Origin + limity) a skenery odkazov v e-mailoch (Outlook Safe Links), ktoré môžu nafúknuť skóre o +10 za „klik“.

_Pozn.: review z kola 2 sa týka ešte full-stack Next.js verzie. Opravy (Origin guard, retry, atomické zabratie jobu, idempotentné odovzdanie, súhlasy podľa verzie…) som v kole 3 preniesol do NestJS a pokrývajú ich integračné testy API._

## Kolo 3 – oddelený backend (NestJS) a Postgres

Zadanie od používateľa: „FE Next, BE Nest, DB Postgres“, nasadenie zatiaľ iba cez Docker. Claude najprv vysvetlil, aký stack je teraz, navrhol štruktúru monorepa a položil jednu otázku (kde má Nest bežať v produkcii, lebo od toho závisí plánovač). Potom doplnil [plán v3](../PLAN.md) a postupoval v commitoch: monorepo + `shared` → NestJS API → prepojenie webu → Docker + testy. Logika pipeline sa nepísala odznova: služby v Neste prebrali kód z kola 2 vrátane opráv z review.

**Overovanie:** `curl` na každý endpoint hneď po prvom spustení API, 30 integračných testov API proti reálnemu Postgresu, E2E cez celý Docker stack, reštart kontajnerov (dáta zostanú) a screenshot dashboardu.

**Kde sa AI pomýlila v kole 3:**
- **NestJS 12 je čisto ESM.** Claude to zistil až z `package.json` po inštalácii, nie z pamäti. Preto prešiel na ESM aj `shared` balík, aby sa nemiešali CJS a ESM.
- **Chybný DI token:** prvá verzia `RateLimitService` injektovala `Symbol.for('etfd.db')`, ktorý sa nezhodoval s tokenom `DB`. Claude to zachytil pri čítaní vlastného kódu ešte pred spustením. Token je teraz v samostatnom súbore.
- **Commit zahŕňal viac, než hovoril jeho popis:** do commitu „Add NestJS API“ sa dostali aj predtým pripravené mazania vo webe. Commit som rozdelil, kým bol iba lokálny.
- **Build výstup `dist/`** sa omylom dostal do commitu. Odstránený a pridaný do `.gitignore`.
- **Kolízia Docker volume:** nový Postgres by sa pripojil na volume `pgdata`, v ktorom zostali súbory PGlite z predošlej Docker verzie, a neinicializoval by sa. Volume je premenovaný.
- **Demo služba** po premenovaní `app` → `web` padala na kontrole hostiteľa v simulačnom skripte.
- **Test open redirectu** hodnotu zakódoval dvakrát, takže netestoval skutočný útok. Opravené na `'/\t/evil.com'`.

## UX iterácie (po kole 3)

Stránku som potom prechádzal ako návštevník a posielal Claudovi screenshoty s krátkou spätnou väzbou, napríklad „príliš overwhelming“, „užívateľ nepochopí, čo znamená ‚měsíčně‘“, „Otevřít přehled je prespamované“ alebo „pri kliknutí na Dvojčata sa zvýrazní Jak koupit“. Claude najprv zmeral, čo je zle (výška sekcií v obrazovkách, poloha výzvy, počet tlačidiel), a až potom upravoval. Pri každej zmene urobil screenshot mobilu aj desktopu a pustil E2E. Mobil sa skrátil z 8 na asi 4,8 obrazovky, hero aj prehľad s formulárom sa zmestia na jednu obrazovku a texty kalkulačky sú napísané pre začiatočníka.

**Kde sa AI v tejto fáze pomýlila:**
- **Lepkavé CTA na mobile zakrylo ISIN,** teda práve tú hodnotu, ktorá má presvedčiť. Zachytil to screenshot. Neskôr ho nahradil lepkavý header.
- **Prepínač nástrojov v hero** navrhol Claude ako riešenie dĺžky stránky. Až pri mojej námietke uznal, že návštevník na pár sekúnd ho prehliadne, a nástroje rozdelil do dvoch sekcií.
- **Animácia viazaná na scroll** nechávala obsah pri spodnej hrane obrazovky polopriehľadný, kým užívateľ nezačal scrollovať. Lighthouse to nahlásil ako kontrast 1,85 : 1. Opravené na reveal, ktorý skrýva len prvky pod prvou obrazovkou.
- **Po odomknutí sa „Otevřít přehled“ opakoval šesťkrát** a na stránke boli dva formuláre na hovor s rovnakým `id`. Zachytil to E2E pri overovaní mojej námietky.
- **Navigácia v prehľade** zvýrazňovala zlú sekciu. Pravidlo „najvyššia viditeľná sekcia“ bolo zlé a odstup pri skoku na kotvu sa počítal dvakrát. Claude to najprv „opravil“ bez overenia. Až automatický test kliknutí zo spodku stránky ukázal, že chyba pretrváva. Test je teraz súčasťou E2E.
- **Drobnosti zo screenshotov:** medzera pred „zdarma“ v tlačidle (flex gap), `\u2011` v JSX texte, ktorý by sa zobrazil doslova, a výška sekcie s prehľadom, ktorá po odomknutí narástla na 12 riadkov.

## Code review pred odovzdaním

Na záver som Clauda požiadal o revíziu redundancie a idiomatickosti. Výsledok: zdieľané konštanty (cookies, regex e-mailu, obdobia dashboardu) presunuté do `packages/shared`, dashboardové dotazy ako injektovateľná `StatsService`, cron za vlastným `CronGuard`, validácia celých tiel cez Zod namiesto ručného orezávania, porovnanie tajomstiev v konštantnom čase. Na FE stav z `localStorage` a `matchMedia` cez `useSyncExternalStore` (žiadny `setState` v efekte), duplicitné tlačidlá kopírovania ISIN zlúčené do jedného komponentu, animácie ako tokeny v `@theme`. Pribudli ESLint, Prettier a knip a `npm run check`, ktorý ich spustí spolu s testmi. Každý krok som overil testami a E2E.

## Nasadenie na Vercel

Pokyn: „teraz to deployni na vercel“. Claude rozdelil riešenie na dva projekty (web a API) s databázou Neon, migrácie presunul do buildu a denný beh na Vercel Cron. Každý krok overil najprv lokálne s `VERCEL=1` proti Postgresu z Dockeru a potom E2E proti produkcii.

**Kde sa AI pomýlila:**
- **Lokálne fungovalo, v produkcii nie.** Runtime Vercelu nevie načítať ESM balík z CommonJS (`@nestjs/throttler` → `@nestjs/common`), Node na Macu áno. Claude chybu našiel v logoch funkcie a API zabalil cez esbuild do jedného súboru, ktorý overil samostatne bez `node_modules`.
- **Prázdny statický priečinok** Vercel odmietol. Pribudol `robots.txt`, ktorý zároveň vyraďuje API z vyhľadávačov.

## Bezpečnostný review pred zverejnením

Pred pushom do verejného repozitára som nechal nezávislého review agenta prejsť celý repozitár s pokynom pozerať sa naň ako AI recenzent pred rozhodnutím o prijatí. Paralelne som prešiel celú históriu commitov kvôli tajomstvám (žiadne nenašiel) a zmeral na Verceli, akú IP adresu API skutočne vidí. Opravené:

| Závažnosť | Nález | Oprava |
|---|---|---|
| Stredná | `/r?to=/.//evil.com` prešiel kontrolou originu, ale do `Location` išla cesta `//evil.com`, teda cudzia doména | Cesta nesmie začínať `//`, test pre obe varianty |
| Stredná | Chýbajúci `NODE_ENV` = development, takže admin, cron aj kontrola Originu by boli otvorené | Predvolene `production`. Na verejnom webe (https) API odmietne štart s tokenmi kratšími ako 24 znakov a s webhookom bez https a podpisu |
| Stredná | `/lead` sa dal skriptom zneužiť na posielanie reportu na cudzie adresy a minutie denného limitu | Denný strop 50 leadov na IP v Postgrese (platí naprieč inštanciami na Verceli). Ukladá sa iba otisk IP |
| Nízka | Pri chybe DB šiel do logu celý e-mail | Maskovaný e-mail ako všade inde |
| Nízka | Admin cookie platila natrvalo, `maxAge` stráži iba prehliadač | Cookie nesie podpísanú expiráciu, ktorú overuje server |
| Nízka | Webhook do CRM posielal tajomstvo v hlavičke | HMAC podpis tela s časovou pečiatkou (ochrana proti replay) |
| Nízka | E-mailový súhlas nebol na serveri povinný, `consent_id: "toString"` prešiel | Povinný `email_v1`, `Object.hasOwn` |
| Nízka | Chýbali CSP, `frame-ancestors`, HSTS | Doplnené v [next.config.ts](../apps/web/next.config.ts) |
| Nízka | Docker vystavoval web na `0.0.0.0` s verejným demo tokenom | Iba `127.0.0.1` |
| Info | Odhlásenie hlásilo úspech aj pri neplatnom odkaze | Rozhoduje telo odpovede |

Zámerne neriešené (popísané v [SECURITY.md](../SECURITY.md) a v README): captcha, retencia `events`, limity throttlera v pamäti inštancie a dev závislosti s `npm audit` nálezmi (do runtime sa nedostanú, `npm audit --omit=dev` = 0).
