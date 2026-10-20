# Contributing

## Repository structure

This is an npm workspaces monorepo. Each package has its own `README.md` with build and usage instructions.

```
shared/    — protocol definitions and binary serialization (MIT)
firmware/  — ESP32-S3 firmware (GPL-3.0)
cli/       — rleds command-line tool (GPL-3.0)
client/    — browser JavaScript client (MIT)
3dprint/   — STL models and CAD source (CC0-1.0)
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

## Releasing (maintainers)

Releases are manual. After the release changes and changelog are committed, work from a clean `master` checkout:

```bash
# 1. Verify the packages and generated site
npm ci
npm test
npm run build:site
npm pack --dry-run --workspace=client
npm pack --dry-run --workspace=cli

# 2. Push the reviewed commits and wait for GitHub checks
git push origin master

# 3. Publish packages with new versions, in dependency order
#    If shared has a new version, publish and verify it before client.
npm publish --workspace=client
npm view @reactive-leds/client version

# Verify the CLI without the monorepo before publishing it
release_tmp=$(mktemp -d)
git archive HEAD cli | tar -x -C "$release_tmp"
(cd "$release_tmp/cli" && npm install && npm run build && npm pack --dry-run)

npm publish --workspace=cli
npm view @reactive-leds/cli version

# 4. Tag the released commit (the firmware uses git describe for its version)
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z

# 5. Publish the GitHub release; CI attaches the firmware binaries
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

Skip any package whose current version is already published; npm cannot publish the same package version twice.

## License

By contributing you agree your changes will be released under the same license as the package you're modifying (GPL-3.0 for `firmware/` and `cli/`, MIT for `shared/` and `client/`, CC0-1.0 for `3dprint/`).
