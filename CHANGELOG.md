# Changelog

## 1.0.3 — 2026-10-20

### cli
- Add `rleds monitor` for USB serial logs, with automatic reconnection after a disconnect.
- Bundle the web UI from CLI-owned static assets and the published browser client so the CLI can be built from its own source directory.

### client
- Build against the published `@reactive-leds/shared@1.0.0` package.

### firmware
- Scan all Wi-Fi channels and select the strongest access point when multiple APs share an SSID; log the selected AP's signal, channel and BSSID.
- Use limited driver retries for association; let the reconnect task manage subsequent attempts and network switching.

### documentation and models
- Add assembly photos, transport notes and new 3D-printable tube-clamp files.

## 1.0.0 — 2026-06-03

First public release.

### shared
- Binary UDP protocol: PING, GET_CONFIG, SET_CONFIG, SET_LEDS, RESET_WIFI, GET_INFO, GET_STATUS
- TypeScript types and serialization helpers for all packet types
- MIT license

### firmware (ESP32-S3)
- RMT peripheral for WS2812/FCOB LED control
- Non-blocking UDP loop (6 ms poll, drop-tail on overload)
- WiFi provisioning via BLE (GATT, no pairing required)
- Runtime config via SET_CONFIG (pin, num_leds, port, hostname)
- GET_INFO and GET_STATUS commands
- `sdkconfig.defaults` for reproducible builds
- GPL-3.0 license

### cli (`rleds`)
- `scan` — LAN discovery via ARP + UDP ping, sliding TTL cache
- `ping`, `config`, `leds`, `status`, `version`, `off`, `reset-wifi`
- `bt-scan`, `bt-credential` — BLE provisioning
- `proxy` — WebSocket proxy with live scan display
- `rainbow`, `color` — visual effects
- Multi-target support (omit IP to target all discovered devices)
- GPL-3.0 license

### client (`@reactive-leds/client`)
- `begin`, `ping`, `getConfig`, `getStatus`, `connect`, `setLEDs`
- `sendRaw`, `sendRawSync` — raw protocol escape hatch for any `PacketType` (re-exported)
- `sample` — canvas-to-LED mapping for live coding (bilinear polygon sampling)
- Daemon worker architecture (non-blocking browser UI)
- MIT license
