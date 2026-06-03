# reactive-leds — TODO (repo-level)

## Da fare prima dell'annuncio pubblico

- [ ] **Hero asset** — foto o GIF del tubo acceso nella root del README (richiede hardware).
- [ ] **GitHub Pages** (`docs/`): pagina flash firmware via ESP Web Tools + demo client interattiva.
- [ ] **`firmware-build.yml`** — CI ESP-IDF Docker su push/tag, binari allegati alla GitHub Release.
- [ ] **Badges** nel README root (CI status, licenza).

## Da fare (nice to have)

- [ ] Issue templates (bug report, feature request).
- [ ] PR template.
- [ ] Branch protection su `master`.
- [ ] Sezione Hydra/p5.js nel README root (demo live coding).
- [ ] `CODE_OF_CONDUCT.md`.

## Già fatto

- [x] `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` creati.
- [x] `.github/workflows/test.yml` — CI `npm test` su push/PR.
- [x] `client/examples/` eliminata.
- [x] File junk eliminati (`2026-05-26-*.txt`, `scan_results.json`, `AGENT.md`).
- [x] `cli/package-lock.json` rimosso dal tracking git.
- [x] `.gitignore` aggiornato (sub-package lockfiles).
- [x] `"private": true` rimosso da `cli` e `client`.
- [x] `client/package.json` — metadata completo.
- [x] Tutti i README bilingui (shared, firmware, cli, client).
- [x] Licenze: GPL-3.0 (firmware, cli), MIT (shared, client).
- [x] Test: 53/53 verdi (shared 15, cli 30, client 8).
