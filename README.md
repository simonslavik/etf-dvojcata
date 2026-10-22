# ETF dvojčatá – konverzná landing page (zadanie B)

Landing page pre českého drobného investora, ktorý prichádza z reklamy na mobile. Ponúka **porovnanie 12 ETF z NYSE Arca s ich európskymi (UCITS) „dvojčatami“**, ktoré si v ČR naozaj kúpi, a výmenou za e-mail odomkne celý prehľad.

- **Stránka:** _doplniť URL po nasadení na Vercel_ (varianty: `/?ad=twin`, `/?ad=fees`)
- **Reklamy:** [ads/README.md](ads/README.md) (2 verzie, texty, UTM)
- **Dáta so zdrojom pri každom údaji:** [data/etfs.json](data/etfs.json)
- **Meranie funnelu:** `/stats.html` (chránené cez `STATS_TOKEN`)
- **Pôvodný plán:** [PLAN.md](PLAN.md) · **Export konverzácií s Claude Code:** [ai-log/](ai-log/)

---

## 1. Kľúčová myšlienka

Český investor vidí na YouTube a Reddite „kúp VOO“, otvorí XTB alebo Trading 212 a fond tam nenájde. Dôvodom je regulácia PRIIPs: fond predávaný retailu v EÚ musí mať dokument KID a americké ETF ho nemajú. Riešením je európska verzia (UCITS) so **rovnakým indexom**, ktorú si kúpi.

Väčšina českých stránok o ETF porovnáva americké fondy, ktoré si čitateľ nekúpi. Táto stránka ukáže použiteľnú odpoveď hneď po prvom kliknutí: ticker, ISIN na skopírovanie, poplatok a burzu.

**Prečo len 12 ETF:** zadanie hovorí o ETF obchodovaných na NYSE. Agent zistil, že QQQ, VXUS a BND sú na Nasdaqu, preto som ich vyradil. Výnimku pre populárne QQQ som zvážil, ale držal som sa zadania.

## 2. Cieľová skupina, hodnota, moment žiadosti

| | |
|---|---|
| **Kto** | Čech 25 – 40 rokov na mobile. Už investuje alebo začína cez XTB, Trading 212 či Revolut, prípadne má peniaze v podielovom fonde z banky. Z YouTube pozná tickery, ale nevie, prečo ich nenájde v aplikácii. |
| **Hodnota zadarmo** | Vyhľadávač dvojčiat (12 ETF → UCITS verzia + ISIN + TER + zdroj) a kalkulačka poplatkov (fond z banky vs. ETF). Celú hodnotu vidí ešte pred formulárom. |
| **Za e-mail** | Prehľad všetkých 12 dvojčiat na jednej stránke (ISIN, typ, rozdiely v indexe, alternatívy), návod na nákup a daňové pravidlá v ČR (časový test, limit 100 tis. Kč, dividendy). |
| **Kedy žiadame** | Až po prvej interakcii: tlačidlo je priamo pod výsledkom vyhľadávača aj kalkulačky. Návštevník už dostal ochutnávku, takže žiadosť o e-mail je výmena, nie bariéra. Druhý pokus je náhľad tabuľky s rozmazanými riadkami a tretí záverečné CTA. Na mobile je stále dostupné lepkavé CTA, ktoré sa schová, keď je na obrazovke iný formulár. |
| **Formulár** | **1 pole (e-mail)**, otvára sa ako bottom sheet s automatickým fokusom a `inputmode=email`. Súhlas je jedna veta pod tlačidlom. Proti botom chráni honeypot namiesto captchy. |
| **Po odoslaní** | Hneď sa odomkne tabuľka na stránke a tlačidlo „Otevřít celý přehled“ (dá sa vytlačiť alebo uložiť do PDF). Príde aj e-mail cez Resend. Potom nasleduje jedna **nepovinná kvalifikačná otázka** („kolik měsíčně investujete?“, 4 tlačidlá). Je to krok „Kvalifikace“ z lievika Clientela a ku kontaktu pridáva dáta pre segmentáciu bez toho, aby brzdila konverziu. |

## 3. Poradie sekcií a prečo

1. **Hero = sľub reklamy + funkčný nástroj.** Návštevník strávi na stránke pár sekúnd, preto už prvá obrazovka nadpisom opakuje reklamu (message match) a **hneď pod ním ukazuje výsledok** (VOO → VUAA). Varianta podľa `?ad=` sa prepne inline skriptom ešte pred prvým vykreslením, takže stránka nebliká a CLS je 0,001.
   - `ad=twin`: „VOO si v Česku nekoupíte. Jeho dvojče ano.“ + vyhľadávač
   - `ad=fees`: „Fond z banky si bere až 2,6 % ročně. ETF jen 0,07 %.“ + kalkulačka
2. **Druhý nástroj** (kalkulačka alebo vyhľadávač, podľa varianty). Návštevník, ktorého neoslovil prvý uhol, dostane druhý.
3. **Náhľad lead magnetu + formulár.** Ukazuje konkrétne, čo dostane: tri riadky čitateľné, ďalšie rozmazané.
4. **Prečo to nejde kúpiť (PRIIPs).** Buduje dôveru pre skeptikov. Je až za formulárom, lebo kto mu verí, nemusí ho čítať.
5. **FAQ.** Námietky (dane, rozdiel medzi dvojčatami, kde kúpiť, čo s e-mailom) vrátane zdrojov.
6. **Záverečné CTA.** Pre tých, čo doskrolovali až sem.
7. **Pätička.** Upozornenie „nejde o investičné odporúčanie“ a zoznam všetkých zdrojov s dátumom.

Navigácia ani odkazy, ktoré by odvádzali preč, na stránke nie sú. Jediný cieľ je kontakt.

## 4. Dáta a zdroje

- **12 párov US ETF → UCITS dvojča**, údaje k 22. 10. 2026. Pri každom páre je `source_url` a dátum. Americké fondy sú overené na stránkach emitentov (Vanguard, iShares, SSGA), UCITS fondy na justETF a SSGA. Pri SCHD blokoval web Schwab automatický prístup, preto je zdrojom stockanalysis.com (v dátach je to poznamenané).
- **5 dvojčiat má rovnaký index** (VOO, SPY, IVV, IWM, GLD). Ostatné sú najbližšie alternatívy a stránka vždy uvádza, v čom sa líšia.
- **Fond z banky v kalkulačke:** ČSOB Akciový podľa KID k 1. 6. 2026: vstupný poplatok 3 %, priebežné náklady 2,59 % ročne. Transakčné náklady 0,39 % zámerne nepočítam, aby porovnanie nebolo nadsadené.
- **České pravidlá:** PRIIPs (nariadenie 1286/2014), MiFID II (profesionálny klient), zákon o daniach z príjmov § 4 ods. 1 písm. t) a u), zrušenie stropu 40 mil. Kč od 2026, zmluva USA–ČR (15 % z dividend).
- **Overenie:** tretí agent nezávisle znovu načítal zdroje a skontroloval všetkých 12 párov (ISIN, TER, typ, index, ticker, veľkosť, označenie „rovnaký/podobný index“ a 5 alternatív): **130 zo 130 polí bolo správnych**. Obmedzenie: kontroloval tie isté URL, nie druhý nezávislý zdroj.

## 5. Meranie celej cesty

Vlastné meranie bez cookies: anonymné ID relácie v `sessionStorage`, udalosti cez `sendBeacon` na `/api/track` a do Upstash Redis (HyperLogLog = unikátne relácie na krok a variantu).

| Krok funnelu | Udalosť |
|---|---|
| Príchod (+ UTM, variant, zariadenie) | `page_view` |
| Interakcia | `finder_select`, `calc_change`, `isin_copy`, `faq_open`, `scroll` (25/50/75/100) |
| Záujem | `cta_click` (zdroj: finder / calc / sticky), `sticky_view` |
| Formulár | `form_view` → `form_start` → `form_error` / `form_submit` |
| Kontakt | `lead_ok` (počíta server, nedá sa podvrhnúť z prehliadača) |
| Po konverzii | `qualify`, `report_open` |

Na `/stats.html` je lievik po variantách. Pri každom leade sa ukladá aj zdroj, UTM, variant, na ktorý ticker klikol a koľko zadal do kalkulačky. Voliteľne sa dá zapnúť PostHog (`VITE_POSTHOG_KEY`, cookieless) na heatmapy a záznamy relácií.

`npm run e2e` prejde v prehliadači celú cestu v oboch variantoch (klik, kalkulačka, CTA, chybný e-mail, správny e-mail, kvalifikácia) a overí, že každý krok funnelu sa započítal.

## 6. Očakávaná konverzia

Odhad pre studenú návštevnosť z Meta na mobile (návšteva → lead):

| Krok | Odhad | Prečo |
|---|---|---|
| Interakcia s nástrojom | 45 – 60 % | Nástroj je v prvej obrazovke a stačí jeden ťuk |
| Klik na CTA | 20 – 30 % | CTA je hneď pod výsledkom a lepkavé tlačidlo je stále viditeľné |
| Odoslanie formulára (z tých, čo klikli) | 45 – 60 % | 1 pole, automatický fokus, hodnota je už známa |
| **Návšteva → lead** | **≈ 10 – 15 %** (realisticky okolo 12 %) | |

Odhad vychádza z mojej úvahy o jednotlivých krokoch, nie z overeného benchmarku. Varianta B (poplatky) bude mať podľa mňa nižšiu konverziu, ale kvalitnejšie leady: ľudia s peniazmi v bankovom fonde sú pre klientov Clientela hodnotnejší. Skutočné číslo ukáže `/stats.html` po prvých asi 1 000 návštevách na variant.

## 7. Tri hypotézy na A/B test (podľa očakávaného dopadu)

1. **E-mailové pole priamo v karte dvojčaťa namiesto tlačidla, ktoré otvára bottom sheet.** Ubudne jeden krok (klik → sheet), čo je na mobile najväčší únik. *Očakávanie:* +20 – 30 % relatívne na návšteva → lead. *Riziko:* stránka pôsobí ako brána ešte pred ochutnávkou. *Metrika:* `lead_ok / page_view`.
2. **Formulácia lead magnetu: „přehled 12 dvojčat“ vs. „Návod: první ETF za 15 minut (PDF)“.** Prehľad osloví toho, kto už vie, čo chce. Návod osloví začiatočníkov, ktorých je na Mete viac. *Očakávanie:* ±15 %, mení sa aj profil leadov. *Metriky:* `form_submit / cta_click` a podiel odpovedí `qualify`.
3. **Lepkavé CTA na mobile od začiatku vs. až po prvej interakcii.** Ak sa zobrazí neskôr, hero nemá konkurenciu a CTA príde vo chvíli záujmu. Ak je tam stále, zachytí aj tých, čo len skrolujú. *Očakávanie:* ±5 – 10 %. *Metrika:* `cta_click{source=sticky}` a celková konverzia.

Samotné varianty `twin` vs. `fees` sú test na úrovni reklamy, preto ich medzi hypotézy stránky nepočítam. Infraštruktúra (parameter `ad=`, delenie lievika podľa variantu) je však na ne pripravená.

## 8. Ako som pracoval s AI

Pracoval som v Claude Code. Postup: **najprv plán** ([PLAN.md](PLAN.md), schválený pred implementáciou), potom paralelní agenti na dáta, potom implementácia po krokoch s commitmi a nakoniec kontroly (testy, E2E, Lighthouse, review agent).

### Agenti a ich zadania

| Agent | Zadanie (skrátene) | Ako som kontroloval výstup |
|---|---|---|
| **Výskum US ETF** | 15 ETF: TER, burza, index, AUM, výnos, *zdroj a dátum pri každej hodnote*, primárne weby emitentov, „null namiesto odhadu“, na konci zoznam neoverených vecí a rozporov | Krížová kontrola tretím agentom, porovnanie s druhým agentom (S&P 500 fondy), ručná kontrola niekoľkých hodnôt |
| **Výskum UCITS dvojčiat** | Ku každému US ETF UCITS ekvivalent: ISIN, tickery podľa burzy, TER, Acc/Dist, veľkosť, označenie „exact/close“ s vysvetlením | To isté + kontrola logiky „exact“ (musí byť doslova rovnaký index) |
| **Výskum ČR** | PRIIPs, dane (paragrafy), dividendy, poplatky bankových fondov z KID, dostupnosť u brokerov, *pri každom tvrdení zdroj a istota* | Rozpory s ostatnými agentmi, na stránku išli len tvrdenia s vysokou istotou |
| **Nezávislý kontrolór** | „Buď skeptický, hľadaj chyby, nepotvrdzuj“: znovu načítať zdroje pre všetky polia, vrátiť tabuľku OK / WRONG / UNVERIFIABLE a presnosť | Výsledok 130/130; obmedzenie popísané vyššie |
| **Code review** | Bugy v API, formulároch, trackingu, deploy na Vercel, prístupnosť; iba report, nič neupravovať | Pozri časť „Výsledok review“ nižšie |

### Kde sa AI pomýlila (a ako som to zachytil)

- **Agent pre UCITS** označil VXUS ako „exact“, hoci v poznámke sám napísal, že index je iný. Zachytil som to pri čítaní výstupu. VXUS napokon vypadol, lebo je na Nasdaqu.
- **Agent pre ČR** uviedol TER fondu VWCE 0,22 % z neaktuálneho zdroja. Agent pre UCITS aj kontrolór overili 0,14 % (zníženie od 28. 7. 2026). Rozpor som riešil podľa primárneho zdroja.
- **Hlavný agent (ja v konverzácii)** pri vysvetľovaní pojmov tvrdil, že strop 40 mil. Kč pri časovom teste platí. Výskumný agent zistil, že pre cenné papiere bol od 1. 1. 2026 zrušený. Stránka uvádza aktuálny stav so zdrojom.
- **Predpoklad „len QQQ nie je na NYSE“** bol nesprávny: agent našiel aj VXUS a BND na Nasdaqu.
- **Text „XTB ani Trading 212 vám VOO nepredá“** som stiahol. Agent to overil iba na stránke brokera Lynx, nie priamo u XTB či Trading 212. Teraz tam je „evropský broker“.
- **Technické chyby, ktoré som zachytil testami a screenshotmi:**
  - `7,000000000001 %` (floating point vo formátovaní)
  - E2E test zdieľal localStorage medzi návštevníkmi
  - lepkavé CTA nemalo vo variante B správny text (inline skript bežal pred existenciou prvku)
  - Lighthouse 72 → **98** (písma z Google blokovali vykreslenie, obsah sa vykresľoval cez JS a spôsoboval CLS 0,26) → riešenie: vlastné písma a predrenderovanie
  - príkaz `cat > súbor` bez vstupu zablokoval renderovanie reklám

### Výsledok review

_Doplní sa po dokončení review agenta._

## 9. Čo v riešení chýba / pred spustením reklamy

- [ ] **Nasadenie na Vercel** a URL do README (`vercel` CLI, alebo import repozitára na vercel.com).
- [ ] **Upstash Redis + Resend** (env premenné v `.env.example`). Bez nich sa leady a udalosti držia iba v pamäti funkcie a e-mail neodchádza. Stránka funguje aj tak (prehľad sa odomkne na stránke), ale dáta sa strácajú.
- [ ] **Právne:** doplniť prevádzkovateľa do `soukromi.html`, posúdiť text súhlasu (marketing vs. doručenie prehľadu), double opt-in, srovnávaciu reklamu s konkrétnym fondom (reklama B) a Meta „special ad category“.
- [ ] **Prehľad je „mäkko“ zamknutý:** `/prehled.html` je dostupný aj bez e-mailu (noindex). Pre lead magnet je to podľa mňa v poriadku, lebo kto ho hľadá cez URL, by e-mail aj tak nezadal.
- [ ] **PDF** je zatiaľ „uložiť ako PDF“ cez tlač, nie generovaný súbor.
- [ ] **Dostupnosť u brokerov** je overená iba pre XTB (CSPX, SXR8, VUAA, VWCE). Ostatných brokerov uvádzam všeobecne.
- [ ] **Aktualizácia dát:** TER a veľkosti fondov sú snímka k 22. 10. 2026. Pre produkciu by bol potrebný mesačný job, ktorý znovu spustí výskumného a kontrolného agenta.

## 10. Spustenie

```bash
npm install
npm run dev        # http://localhost:5173 (?ad=twin | ?ad=fees), /api/* beží lokálne bez Vercelu
npm test           # unit testy kalkulačky
npm run e2e        # celá cesta v prehliadači, oba varianty, kontrola funnelu (potrebuje bežiaci dev server)
npm run ads        # vyrenderuje reklamy a OG obrázok (lokálny Chrome)
npm run build      # produkčný build s predrenderovanou prvou obrazovkou
```

**Štruktúra:** `index.html` (stránka) · `src/` (render.js zdieľaný prehliadačom aj buildom, main.js, track.js, calc.js, content.js) · `api/` (Vercel funkcie) · `data/etfs.json` · `ads/` · `scripts/` (E2E, screenshoty, render reklám) · `tests/`
