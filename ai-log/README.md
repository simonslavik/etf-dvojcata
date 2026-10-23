# AI log – ako vznikalo riešenie

Tento priečinok obsahuje **neupravené exporty konverzácií s Claude Code** (príkaz `/export`) a tohto sprievodcu, ktorý sa dá prečítať za pár minút. Exporty sú surové, začiernené sú iba tokeny a e-mailové adresy.

| Súbor | Obsah |
|---|---|
| `01-kolo-1.md` | Kolo 1: plán, výskum dát agentmi, statická stránka (Vite), reklamy, review |
| `02-kolo-2-3.md` | Kolá 2 a 3: Next.js a lead pipeline, dizajn podľa Clientela, review, Docker, NestJS + Postgres, UX iterácie, code review |
| [prompts.md](prompts.md) | **Začnite tu.** Ako pracujem s AI v piatich bodoch, kde som AI opravil, 20 kľúčových promptov doslovne s odkazom na commit a všetkých 7 zadaní pre agentov |

Prvé kolo bežalo v samostatnej konverzácii. Druhá konverzácia začína tým, že Claude najprv zistil stav projektu z repozitára (git log, README, PLAN.md) a až potom pokračoval.

## Časová os (22. – 23. 10. 2026)

| Čas | Kolo | Môj vstup | Rozhodnutie | Commity |
|---|---|---|---|---|
| 12:09 | 1 | Zadanie z e-mailu | Plán pred kódom, zadanie B (landing page) | `docs(plan): outline…` |
| 13:04 – 13:19 | 1 | Schválenie plánu | Dáta zbierajú paralelní výskumní agenti a nezávislý agent ich overí, potom stránka, reklamy a review | `feat(data)` … `fix(landing)` |
| 13:22 | 2 | Screenshoty clientelo.cz: *„ešte ten dizajn viacej vymakaj a malo by to mať aj nejaký stack“* | Claude sa spýtal, čo myslím „stackom“. Odpovedal som **oboje** (tech stack aj lead pipeline) a **dizajn bližšie ku Clientelu** | `docs(plan): v2…` |
| 13:46 – 14:01 | 2 | – | Next.js 16 + Postgres, pipeline Lead → Kvalifikácia → Odovzdanie → Starostlivosť, admin dashboard, nezávislé review | `refactor!` … `fix(security)` |
| 14:05 | 2 | *„nepáčia sa mi tie české názvy súborov“* | Cesty a priečinky v angličtine, texty pre návštevníka zostávajú v češtine | `refactor(web): rename…` |
| 14:10 | 2 | *„dockerizovať, aby to vedel každý spustiť“* | `docker compose up` bez účtov a bez Node | `build(docker): run the full stack…` |
| 14:13 | 3 | *„FE chcem Next, BE Nest a DB Postgres“* | Claude sa spýtal, kde má Nest bežať v produkcii. Odpovedal som **zatiaľ len Docker** | `docs(plan): v3…` |
| 14:14 – 14:27 | 3 | – | Monorepo `apps/web` + `apps/api` + `packages/shared`, logika prenesená do NestJS, integračné testy proti Postgresu | `refactor` … `docs` |
| 14:56 – 17:10 | UX | Screenshoty so spätnou väzbou: *„príliš overwhelming“*, *„header môže byť fixed“*, *„Otevřít přehled je prespamované“* | Mobil z 8 na asi 4,8 obrazovky, lepkavý header s CTA, jeden nástroj v hero, záverečné CTA, prehľad ako lead magnet | `feat(landing)` … `feat(report)` |
| 23. 10. 09:54 – 11:14 | UX | Bug report z ručného testu navigácie, *„spĺňa to zadanie?“* | Oprava navigácie overená testom klikov, Lighthouse 99/100/100/100, nové screenshoty | `fix(report)` … `docs` |
| 23. 10. 11:35 – 11:55 | Review | *„chcem, aby ma ten kód vedel naozaj predať“* | Review agent + knip, refaktor API a webu, ESLint, Prettier, `npm run check` | `chore` … `docs` |
| 23. 10. 13:40 – 14:30 | Nasadenie | *„teraz to deployni na vercel“*, *„daj ešte pozor na security … aby ich AI nemali čo vytknúť“* | Vercel + Neon, chyba runtime zachytená v produkcii a opravená. Nezávislý bezpečnostný review, 10 opráv s testami, [SECURITY.md](../SECURITY.md) | `build(vercel)` … `docs` |
| 23. 10. 14:58 – 15:30 | UX | Screenshoty adminu a kariet v prehľade | Dashboard podľa krokov pipeline, karty dvojčiat s faktami a alternatívami | `feat(admin)`, `feat(report)` |

## Ako som s AI pracoval

- **Najprv plán, potom kód.** Každé kolo začína zápisom do [PLAN.md](../PLAN.md) (v1, v2, v3), až potom nasleduje implementácia.
- **Otázky namiesto domnienok.** Pri nejasnom pokyne („nejaký stack“) alebo rozhodnutí s dôsledkami (hosting backendu) sa Claude spýtal a ponúkol možnosti s kompromismi. Rozhodnutie zostalo na mne.
- **Agenti so zúženým zadaním.** Výskumní agenti mali za úlohu „zdroj a dátum pri každej hodnote, radšej null než odhad“. Kontrolór dostal pokyn „buď skeptický, hľadaj chyby“. Review agent dostal kód bez kontextu konverzácie a pokyn „iba reportuj, nič neupravuj“.
- **Malé kroky s commitom.** Každý commit je jeden logický krok a pred ďalším krokom prebehla kontrola.

## Ako som kontroloval výstupy

| Kontrola | Čo zachytila |
|---|---|
| Unit a integračné testy (Vitest, 25 + 31) | Výpočty, skóre, sekvencia, bezpečnostné pomôcky |
| Integračné testy API proti reálnemu Postgresu | Dvojité odoslanie e-mailu pri súbežnom crone, duplicitné odovzdanie do CRM, útoky na presmerovanie |
| E2E v prehliadači (Puppeteer) cez celý Docker stack | Fokus v sheete na zlom prvku, ochrana CSV, ktorá kazila telefónne čísla |
| Screenshoty mobil/desktop, ktoré Claude prezeral | Široké medzery v nadpisoch (Lora `tnum`), pretečenie na mobile |
| `curl` na každý endpoint | Open redirect, chýbajúci Origin, telefón bez súhlasu |
| Nezávislý review agent (2×) | 14 a 13 nálezov, opravy sú v tabuľkách v [README](../README.md#10-ako-som-pracoval-s-ai) |

Úplný zoznam miest, kde sa AI pomýlila, je v [README, časť 10](../README.md#10-ako-som-pracoval-s-ai).

## Poznámka k histórii commitov

- **Správy commitov** som pred prvým pushom zjednotil na formát [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`…). Obsah, poradie, autor a časy commitov sa nezmenili. Drobné následné opravy som zlúčil do commitu, ku ktorému patria: cestu v README reklám do `style(ads)`, konfiguráciu knipu do `refactor(web)`, skrátenie výberu promptov do `docs(ai-log)` a päť krokov prvého nasadenia na Vercel do `build(vercel)` (dôvod bundlovania API je v tele commitu). Pôvodná podoba je v lokálnej vetve `backup/pre-squash`.
- **Viac commitov v rovnakej minúte** je bežné: kód písal agent a commit nasledoval hneď po úspešnej kontrole (testy, E2E, screenshot).
- **Každý commit** má trailer `Co-Authored-By: Claude`.

## Čo by som nabudúce zadal lepšie

1. **Technické mantinely hneď na začiatku.** Stack som menil dvakrát (Vite → Next.js full-stack → Next.js + NestJS). Keby som „FE Next, BE Nest, DB Postgres, spustiteľné cez Docker“ povedal v prvom pokyne, ušetril by som dve kolá prepisovania. Na druhej strane je logika pipeline vďaka tomu oddelená v `packages/shared` a obe migrácie prebehli bez prepisovania pravidiel.
2. **Vizuálnu referenciu od začiatku.** Screenshoty clientelo.cz som poslal až v druhom kole. Prvý dizajn bol dobrý, ale všeobecný.
3. **Konvencie vopred:** angličtina v kóde a cestách, Conventional Commits, kam patrí build výstup. Všetko sa dalo opraviť, ale stálo to commity navyše.
4. **Kritériá prijatia pre každé kolo** (napr. „E2E prejde proti Docker stacku“). Claude si ich v praxi stanovoval sám, ale mali byť v pláne explicitne.
