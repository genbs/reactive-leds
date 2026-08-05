# Changelog

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
