# AI log

| Súbor | Čo v ňom je |
|---|---|
| [prompts.md](prompts.md) | **Začnite tu.** Kde som AI opravil, prompty, ktoré niečo rozhodli, a zadania pre agentov |
| `01-kolo-1.md` | Export prvej konverzácie: plán, výskum dát, prvá verzia stránky a reklamy |
| `02-kolo-2-3.md` | Export druhej konverzácie: stack, lead pipeline, dizajn, úpravy podľa spätnej väzby, nasadenie |

Exporty sú z príkazu `/export` a nie sú upravené. Začiernené sú iba tokeny a e-mailové adresy.

## Ako to šlo

1. **22. 10. dopoludnia:** plán, výskum a kontrola dát agentmi, prvá verzia stránky a dve reklamy.
2. **22. 10. popoludní:** skutočný backend (Next.js, NestJS, Postgres), lead pipeline podľa Clientela, Docker.
3. **22. 10. večer:** stránku som skúšal ako návštevník a skracoval ju, kým nebola jasná na prvý pohľad.
4. **23. 10.:** kontrola kódu, nasadenie na Vercel, kontrola bezpečnosti, úpravy adminu a prehľadu.

Podrobne po kolách, so všetkými chybami AI: [docs/ai-workflow.md](../docs/ai-workflow.md).

## Commity

Správy commitov som pred prvým pushom zjednotil do jedného formátu a pár drobných opráv som zlúčil s commitom, ku ktorému patria. Obsah, poradie aj časy zostali pôvodné. Viac commitov v jednej minúte je preto, že commit nasledoval hneď po úspešnej kontrole.

## Čo by som nabudúce urobil inak

- Všetky technické požiadavky by som zadal hneď na začiatku. Stack som menil dvakrát.
- Screenshoty clientelo.cz by som poslal hneď s prvým promptom, nie až v druhom kole.
- Pre každé kolo by som vopred povedal, kedy je hotové, napríklad „prejdú všetky testy“.
