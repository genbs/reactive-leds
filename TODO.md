# TODO

## Prima della pubblicazione

- [ ] Verificare da browser reale: proxy che cade, tab aperto, rete che cambia, CDN/worker fallback.
- [ ] Aggiungere asset visuali reali: hero foto/GIF/video nel README e nel sito `docs/`.
- [ ] Raccogliere benchmark pubblicabili: almeno 3 run pulite per scenario, AWDL/stato rete dichiarati, firmware/CLI version, raw log salvati, pubblicare mediana o peggiore run pulita.
- [ ] Qualificare i dati empirici setup-specific: consumo, modello strip, tensione, brightness/colore e metodo di misura.
- [ ] Verificare build firmware ESP-IDF e nomi artifact: `bootloader.bin`, `partition-table.bin`, `firmware.bin`.
- [ ] Ripetere release checks: `npm test --workspaces`, type-check shared/cli/client, build client/cli, `npm publish --dry-run` client/cli.
- [ ] Pulire worktree prima del tag: niente `.tokensave/`, cache firmware o asset generati non intenzionali.
- [ ] Preparare GitHub Release, GitHub Pages e npm publish.

## Dopo

- [ ] Prototipare Sketch Runner / live-coding API.
- [ ] Preparare post GitHub/Hacker News/Reddit con video, BOM, STL, wiring e risposta "why not WLED?".
- [ ] Valutare `CODE_OF_CONDUCT.md` e branch protection se arrivano contributi esterni.
