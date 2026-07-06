# reactive-leds - TODO prima della pubblicazione

Questo file traccia le attivita emerse dall'audit tecnico e documentale.
Obiettivo: arrivare a una pubblicazione GitHub/npm/GitHub Pages comprensibile,
robusta e presentabile a GitHub, Hacker News e Reddit.

## P0 - Bug e blocchi tecnici

- [ ] **CLI: validare meglio `rleds config`**
  - `pin`: accettare solo interi nel range firmware supportato (`0..49` oggi da Kconfig).
  - `num_leds`: accettare solo interi `1..255`.
  - `port` device: accettare solo `1024..65535`, coerente con firmware Kconfig.
  - Convertire i valori numerici a `number` prima di chiamare `proto.setConfig`, evitando coercizioni implicite in `configToBuffer`.
  - Aggiungere test unitari per valori validi, fuori range, float, stringhe non numeriche e overflow byte.

- [ ] **CLI: separare validazione porta proxy e porta device**
  - Mantenere una validazione permissiva per bind locali se serve (`0..65535`).
  - Usare una validazione device-specific per comandi UDP/config (`1024..65535`).
  - Aggiornare README CLI se cambia il comportamento.

- [ ] **CLI proxy: validare il payload WebSocket in ingresso**
  - Rifiutare payload piu corti di 8 byte.
  - Rifiutare IP octet, porta o `PacketType` non validi.
  - Restituire `[requestId, 0]` per richieste sync invalide.
  - Non inviare nulla o loggare in modo controllato per payload fire-and-forget invalidi.
  - Aggiungere test in `cli/tests/proxy.test.ts`.

- [ ] **CLI scan/proxy: non trattare il MAC ARP come identita affidabile**
  - Il MAC mostrato oggi arriva da `arp -a`, non dal firmware; su alcune reti puo essere stale, proxyato o duplicato.
  - Se due IP hanno lo stesso MAC ARP e uno spegnimento li fa sparire entrambi, mostrare warning di possibile ARP/IP confusion.
  - Valutare se nascondere il MAC di default o rinominarlo chiaramente in "ARP MAC".
  - Se serve una vera identita device, esporre il WiFi STA MAC dal firmware via `GET_STATUS`, `GET_VERSION` esteso o nuovo packet type.
  - Aggiungere test al parser ARP per duplicati e formati macOS/Linux.

- [ ] **CLI/client proxy: verificare heartbeat e detection disconnessione**
  - Controllare se heartbeat/ping WebSocket parte davvero e viene ricevuto dal client.
  - Verificare cosa succede quando il proxy muore, il tab resta aperto o la rete cade.
  - Aggiornare stato `isConnected`/callback `onConnectionChange` in modo affidabile.
  - Aggiungere test o harness manuale con proxy chiuso a runtime.

- [ ] **Client browser: aggiungere timeout alle richieste sync**
  - Evitare Promise appese in `sendSync` quando worker/proxy/device non rispondono.
  - Pulire la richiesta pendente su timeout.
  - Rendere il timeout configurabile o usare un default esplicito documentato.
  - Aggiungere test o almeno una harness manuale per proxy offline / device offline.

- [ ] **Client browser: coprire API pubblica e fallback CDN con test**
  - Testare default export ESM/UMD e presenza di `sendRaw`, `sendRawSync`, `sample`, `PacketType`.
  - Testare `sendRaw(ip, port, type, data?)` e `device.sendRaw(type, data?)`, inclusi casi senza payload.
  - Testare che `type` sia obbligatorio e che non possa degradare silenziosamente a `PING`.
  - Testare o validare manualmente il fallback worker via Blob quando il bundle e caricato da CDN/cross-origin.

- [ ] **Docs JS: correggere ID duplicato `device-count`**
  - Sostituire gli ID duplicati con classi o ID distinti (`live-device-count`, `map-device-count`).
  - Aggiornare entrambi i contatori quando cambia la lista device.

- [ ] **Docs JS: evitare richieste device quando il proxy e disconnesso**
  - Su disconnect non chiamare `renderDevices()` se questo porta a `getConfig`.
  - Separare rendering dello stato locale da refresh remoto.
  - Mostrare esplicitamente "proxy disconnected" invece di lasciare sezioni inert senza contesto.

- [ ] **Docs JS: evitare `innerHTML` per dati provenienti dal device**
  - Usare `textContent` per hostname, IP e valori device.
  - Lasciare `innerHTML` solo per stringhe i18n controllate localmente, oppure introdurre una sanitizzazione minimale.

- [ ] **NPM publish: risolvere warning `npm pkg fix` sul package CLI**
  - Verificare il warning del dry-run: `"bin[rleds]" script name was cleaned`.
  - Applicare fix manuale o `npm pkg fix`, poi revisionare il diff.
  - Ripetere `npm publish --dry-run --workspace=cli`.

## P1 - Documentazione e sito

- [ ] **Correggere tabella dimensioni pacchetti `SET_LEDS`**
  - In `shared/README.md` e `shared/README-it.md`, distinguere tra default pratico e limite protocollo.
  - Usare una formula non fuorviante: `2 + N*5`, con `N = 1..min(num_leds, 255)`.
  - Se si cita `82 B`, chiarire che vale solo con default `num_leds = 16`.

- [ ] **Aggiungere hero foto/GIF/video nel README root**
  - Mostrare il tubo acceso in azione entro i primi 1-2 scroll.
  - Preferire GIF breve o immagine + link video.
  - Includere alt text utile.

- [ ] **Aggiungere hero visual anche nel sito `docs/`**
  - Inserire una preview del risultato fisico o un breve clip.
  - Mantenere lo stile HUD, ma far capire subito che il progetto controlla hardware reale.

- [ ] **Rendere il flusso onboarding esplicito nella landing**
  - Aggiungere una sequenza visibile:
    `Flash firmware -> Install CLI -> BLE credentials -> rleds proxy -> Live Preview`.
  - Ripetere la sequenza anche nel README root in forma compatta.

- [ ] **Evidenziare meglio il valore del Mapping tool**
  - Spiegare in una frase: "Draw on a canvas, map it to physical LED strips, export ready-to-use code."
  - Mostrare uno screenshot/GIF del mapping editor.
  - Linkare direttamente la sezione client `sample`.

- [ ] **Documentare e rendere chiaro l'ordinamento dei device**
  - Spiegare che l'ordine dei dispositivi influenza l'effetto luminoso, perche e l'ordine con cui mapping/live preview iterano e inviano i frame.
  - Rendere piu evidente il riordino gia disponibile con le frecce, sia nel Live Preview sia nel Mapping tool.
  - Valutare drag-and-drop solo se richiede poco codice; non e bloccante per la pubblicazione.
  - Salvare l'ordine scelto in localStorage e mantenerlo coerente tra le due viste.

- [ ] **Correggere licenze nel sito**
  - JSON-LD non deve dichiarare solo MIT: il progetto e a licenze miste.
  - Footer: indicare `MIT / GPL-3.0 / CC0` o linkare una sezione licenze.
  - Verificare coerenza con README, package manifest e file `LICENSE`.

- [ ] **Versionare gli URL CDN nella documentazione client**
  - L'esempio jsDelivr puo restare utile, ma aggiungere una variante pin-nata (`@1.0.0` o `@1`).
  - Chiarire che l'URL non funzionera prima del primo publish npm.
  - Verificare da browser reale che `daemon.worker.js` venga risolto e caricato correttamente.

- [ ] **Documentare supporto browser del sito**
  - Chiarire che Web Serial richiede Chrome/Edge.
  - Chiarire che alcune parti del sito usano API moderne.
  - Fornire fallback: README + CLI manuale se il browser non supporta il flasher.

- [ ] **Correggere descrizione tecnica del drop-tail**
  - Evitare "freshest frame" se la coda drop-tail scarta nuovi arrivi quando piena.
  - Descrivere correttamente: coda piccola per limitare backlog/staleness, con possibili drop sotto overload.
  - Aggiornare firmware README, client README e commento in `sdkconfig.defaults`.

- [ ] **Qualificare i dati empirici non misurati o setup-specific**
  - Il consumo `~1 A/m` va presentato come riferimento del setup/strip usata, non come valore universale.
  - Se possibile, aggiungere modello strip, tensione, colore/brightness del test e metodo di misura.
  - Se non ci sono misure solide, usare wording prudente ed evitare precisione eccessiva.

- [ ] **Aggiungere una sezione "Why not WLED?"**
  - Messaggio: WLED e migliore per home lighting; reactive-leds serve per controllo frame realtime da browser/canvas/live coding.
  - Tono pragmatico, non competitivo.

- [ ] **Aggiornare `TODO.md` dopo ogni milestone**
  - Non lasciare punti "da fare" gia completati.
  - Spostare in "Fatto" solo dopo verifica locale o CI.

## P1 - Release readiness GitHub/npm/GitHub Pages

- [ ] **Pulire il worktree prima della pubblicazione**
  - Verificare tutte le modifiche gia presenti.
  - Decidere se tracciare `cli/LICENSE` e `3dprint/LICENSE`.
  - Non committare `.tokensave/`.

- [ ] **Verificare firmware build in ambiente ESP-IDF**
  - Eseguire `idf.py build` localmente o confermare CI verde.
  - Verificare che gli artifact generati abbiano i nomi attesi:
    `bootloader.bin`, `partition-table.bin`, `firmware.bin`.

- [ ] **Creare GitHub Release con binari firmware**
  - Taggare `vX.Y.Z`.
  - Pubblicare release.
  - Verificare che `docs/manifest.json` scarichi correttamente gli asset da `releases/latest/download`.
  - Prima della release, evitare nei README wording che promette "latest release" gia disponibile.

- [ ] **Abilitare/verificare GitHub Pages**
  - Source: cartella `docs/`.
  - Verificare flasher, i18n, esempi e mapping tool da URL pubblico.

- [ ] **Ripetere verifiche prima del tag**
  - `npm test --workspaces`
  - `npx tsc --noEmit -p shared/tsconfig.json`
  - `npx tsc --noEmit -p cli/tsconfig.json`
  - `npx tsc --noEmit -p client/tsconfig.json`
  - `npm run build --workspace=client`
  - `npm run build --workspace=cli`
  - `npm publish --dry-run --workspace=client`
  - `npm publish --dry-run --workspace=cli`

- [ ] **Pubblicare npm solo dopo dry-run pulito**
  - `@reactive-leds/client`
  - `@reactive-leds/cli`
  - `shared` resta private/internal.

## P2 - Migliorie per ricezione pubblica

- [ ] **Preparare asset per GitHub**
  - Hero GIF/foto nel README.
  - Foto hardware: tubo intero, interno case, wiring, stampa 3D.
  - Breve video demo: browser/canvas -> LED fisici.

- [ ] **Preparare asset per Hacker News**
  - Titolo sobrio: "I built a browser-controlled ESP32 LED tube for live coding performances".
  - Primo commento pronto con contesto: perche non WLED, UDP vs TCP, BLE plaintext, RMT, mapping canvas.
  - Evitare claim di general-purpose controller.
  - Includere misure reali di latenza solo se misurate.

- [ ] **Preparare asset per Reddit**
  - Post visuale con video breve.
  - Subreddit target: ESP32, DIY electronics, 3D printing, creative coding/livecoding.
  - Mettere in evidenza BOM, STL, wiring e sicurezza 24V.
  - Risposta pronta a "why not WLED?".

- [ ] **Aggiungere benchmark o dati empirici se disponibili**
  - Latenza browser -> proxy -> UDP -> frame visibile.
  - Stabilita sotto carico.
  - Limiti reali WiFi osservati.
  - Se non misurati, evitare numeri troppo precisi.

- [ ] **Aggiungere issue template e PR template**
  - Bug report.
  - Hardware compatibility report.
  - Feature request.
  - PR checklist con test/docs/protocol sync.

- [ ] **Valutare `CODE_OF_CONDUCT.md` e branch protection**
  - Utile se si vuole ricevere contributi esterni.
  - Branch protection su `master` con CI richiesta.

## Fatto / verificato durante audit

- [x] Test TypeScript passati: 53/53.
- [x] Type-check passati per `shared`, `cli`, `client`.
- [x] Build client passata.
- [x] Build CLI passata.
- [x] Dry-run npm client passato.
- [x] Dry-run npm CLI passato, con warning da risolvere.
- [x] Bundle in `docs/` allineati al build client corrente.
- [x] Protocollo `PacketType` allineato tra shared, CLI/client e firmware.
