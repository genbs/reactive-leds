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

Releases are manual. From a clean `master` checkout:

```bash
# 1. Align versions and changelog
npm version X.Y.Z --workspace=cli --workspace=client --workspace=shared --no-git-tag-version
#    ...update CHANGELOG.md, then commit as "release: vX.Y.Z"

# 2. Verify
npm install && npm test
npm publish --dry-run --workspace=cli
npm publish --dry-run --workspace=client

# 3. Tag (the firmware derives its version from this tag via `git describe`)
git tag vX.Y.Z && git push origin master --tags

# 4. Publish npm packages (shared is private and is never published)
npm publish --workspace=cli
npm publish --workspace=client

# 5. Create the GitHub release from the tag — CI builds the firmware
#    and attaches the binaries automatically
gh release create vX.Y.Z --title "vX.Y.Z"
```

## License

By contributing you agree your changes will be released under the same license as the package you're modifying (GPL-3.0 for `firmware/` and `cli/`, MIT for `shared/` and `client/`, CC0-1.0 for `3dprint/`).
