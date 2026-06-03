# Contributing

## Repository structure

This is an npm workspaces monorepo. Each package has its own `README.md` with build and usage instructions.

```
shared/    — protocol definitions and binary serialization (MIT)
firmware/  — ESP32-S3 firmware (GPL-3.0)
cli/       — rleds command-line tool (GPL-3.0)
client/    — browser JavaScript client (MIT)
```

## Building and testing

From the repo root:

```bash
npm install          # install all workspace dependencies
npm test             # run tests across all packages
```

Per-package:

```bash
cd shared && npx jest
cd cli && npx jest && npm run build
cd client && npx jest && npm run build
```

Firmware build requires ESP-IDF. See `firmware/README.md`.

## Pull requests

- One logical change per PR.
- Run `npm test` before opening a PR — CI will check it too.
- If you're changing the binary protocol, update `shared/protocol.ts`, `firmware/main/protocol.c`, and both READMEs in sync.

## License

By contributing you agree your changes will be released under the same license as the package you're modifying (GPL-3.0 for `firmware/` and `cli/`, MIT for `shared/` and `client/`).
