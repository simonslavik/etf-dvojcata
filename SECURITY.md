# Bezpečnosť

Ukážkový projekt k výberovému konaniu. Zraniteľnosť nahláste e-mailom autorovi repozitára, nie verejným issue.

## Model ochrany

| Oblasť | Ako je chránená | Kde |
|---|---|---|
| Admin (PII leadov, CSV export, ručné odovzdanie) | Jeden `ADMIN_TOKEN`. V cookie je iba expirácia + HMAC (httpOnly, SameSite=Lax, Secure na https), platnosť overuje server. Porovnanie v konštantnom čase, 10 pokusov / 15 min | [admin-auth.ts](apps/api/src/admin/admin-auth.ts), [admin.guard.ts](apps/api/src/admin/admin.guard.ts) |
| Denný beh (cron) | `Authorization: Bearer $CRON_SECRET` (Vercel Cron ho posiela sám) | [cron.guard.ts](apps/api/src/pipeline/cron.guard.ts) |
| Formuláre (`/lead`, `/call`, login) | Kontrola `Origin` = `SITE_URL` (CSRF), Zod validácia celého tela, 16 kB limit, honeypot, limity na IP, denný strop leadov na IP v Postgrese, denné stropy e-mailov | [leads.controller.ts](apps/api/src/pipeline/leads.controller.ts), [origin.guard.ts](apps/api/src/common/origin.guard.ts) |
| Presmerovanie z e-mailov | Iba v rámci vlastného originu, cesta nesmie začínať `//` | [http.ts](apps/api/src/common/http.ts) |
| Odovzdanie do CRM | Iba so súhlasom, `idempotency_key`, HMAC-SHA256 podpis s časovou pečiatkou, na https povinný | [handoff.service.ts](apps/api/src/pipeline/handoff.service.ts) |
| Konfigurácia | Env validované Zodom pri štarte. Bez `NODE_ENV` platí `production` (fail closed). Na https odmietne slabé tokeny | [env.ts](apps/api/src/config/env.ts) |
| Prehliadač | CSP (`frame-ancestors 'none'`, `object-src 'none'`), HSTS, `X-Frame-Options`, `nosniff`, Referrer-Policy | [next.config.ts](apps/web/next.config.ts) |
| Meta Conversions API | Vypnuté bez kľúčov. E-mail len ako SHA-256, IP a prehliadač sa neukladajú, token v tele požiadavku, click ID len v presnom formáte | [meta-capi.service.ts](apps/api/src/marketing/meta-capi.service.ts) |
| Osobné údaje | E-maily v logoch maskované, IP sa neukladá (pre limit iba otisk na 24 h), súhlasy ako kanonický text s verziou, CSV export chránený proti vzorcom | [consent.ts](packages/shared/src/consent.ts) |

## Tajomstvá

- V repozitári nie sú žiadne produkčné hodnoty, iba `.env.example`.
- `review-token` / `review-cron` v `docker-compose.yml` sú zámerne verejné demo hodnoty pre lokálny review (web je viazaný iba na `127.0.0.1`).
- Produkčné hodnoty sú v nastaveniach projektu na Verceli (typ *sensitive*).

## Známe obmedzenia

- Limity `@nestjs/throttler` sú v pamäti inštancie, na Verceli preto orientačné. Trvalý je denný strop leadov a e-mailov v Postgrese.
- IP berie API z `X-Forwarded-For`. Vercel ho prepisuje skutočnou adresou klienta (overené). Pri vlastnom hostingu ho musí nastaviť reverse proxy pred webom.
- Pred ostrou kampaňou: captcha (Turnstile), retencia tabuľky `events` a výmaz leadu z adminu.
- `npm audit` hlási nálezy iba v dev nástrojoch (knip, eslint-config-next, drizzle-kit). `npm audit --omit=dev` = 0.
