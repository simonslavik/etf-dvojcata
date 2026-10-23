# AI log

| Súbor | Čo v ňom je |
|---|---|
| [prompts.md](prompts.md) | **Začnite tu.** Kde som AI opravil, prompty, ktoré niečo rozhodli, a zadania pre agentov |
| [01-kolo-1.txt](01-kolo-1.txt) | Prvá konverzácia: plán, výskum dát, prvá verzia stránky a reklamy |
| [02-kolo-2-3.txt](02-kolo-2-3.txt) | Druhá konverzácia do 23. 10. 11:54: stack, lead pipeline, dizajn, úpravy podľa spätnej väzby |
| [03-dokoncenie.txt](03-dokoncenie.txt) | Druhá konverzácia od 23. 10. 11:54: kontrola kódu, nasadenie, bezpečnosť, finálne úpravy |

Súbory 01 – 03 sú výber z konverzácií s Claude Code: obsahujú výmeny, ktoré tvorili riešenie. Začiernené sú tokeny, e-maily a IP adresa.

## Najlepšie miesta v exportoch

Kto nemá čas čítať všetko, nech klikne sem:

- [Výskum dát tromi agentmi naraz, každé číslo so zdrojom](01-kolo-1.txt#L185)
- [Nezávislá kontrola dát: 130 zo 130 údajov sedí](01-kolo-1.txt#L1611)
- [„malo by to mat aj nejaky stack“ – AI sa najprv spýtala, čo tým myslím](02-kolo-2-3.txt#L201)
- [„FE chcem next a BE nest a DB postgres“ – prechod na samostatný backend](02-kolo-2-3.txt#L2867)
- [„header moze byt fixed … cielom je ziskat leada“](02-kolo-2-3.txt#L4352)
- [Námietka proti návrhu AI: prepínač nástrojov by návštevník prehliadol](02-kolo-2-3.txt#L4725)
- [„Otevrit prehlad je potom prespamovane“ – test to potvrdil](02-kolo-2-3.txt#L4916)
- [Bug z ručného testu a oprava overená automatickým testom](02-kolo-2-3.txt#L5217)
- [Kontrola riešenia voči zadaniu bod po bode](02-kolo-2-3.txt#L5302)
- [Bezpečnostná kontrola celého repozitára pred zverejnením](03-dokoncenie.txt#L625)

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
