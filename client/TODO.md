# client/ — TODO

## Da fare

- [ ] `package.json`: rimuovere `"private": true`, compilare `description`, `keywords`, `author`, `repository`, `homepage`, `files`.
- [ ] GitHub Page (`docs/`): demo interattiva con IP configurabile via input — sostituisce `examples/` (eliminata).
- [ ] Tradurre `README-it.md` → `README.md` (inglese).

## Già risolto

- [x] Typo `setLeds` → `setLEDs` nel README.
- [x] Commento stale `ws.ts` ("2s * 30 retries") corretto.
- [x] `types.ts`: rimosso tipo `Mock`, semplificato `Device`.
- [x] `main.ts`: rimosso mock, `setLEDs` ha return type esplicito `void`.
- [x] `examples/worker.js`: file rimosso.
- [x] Bug `devices.keys().forEach` e `<script src="leds.js">` in `index.html`: già corretti.
- [x] `mapPixels` documentato nel README-it.
- [x] `getStatus` aggiunto e documentato.
- [x] `shared` inlinato nel bundle via esbuild (nessuna dipendenza runtime esterna).
- [x] License: MIT.
