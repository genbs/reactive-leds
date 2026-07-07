# CLI

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/cli)](https://www.npmjs.com/package/@reactive-leds/cli)

Language: [English](./README.md) | [Italiano](./README-it.md)

This package is the CLI for interacting with `reactive-leds` devices on the network.
With the `rleds` command you can talk to the devices, run the BLE provisioning and start the WebSocket proxy — all from the terminal.

## Quickstart

> The guided install (CLI + firmware flashing from the browser) is also on the [project site](https://genbs.github.io/reactive-leds/) — no repository clone needed.

From npm:

```bash
npm install -g @reactive-leds/cli
rleds <command>
```

Or from the repository:

```bash
npm install
npm link       # makes the rleds command available globally
rleds <command>
```

## Global flags

- `--version` / `-v` — print the CLI version and exit.
- `--help` / `-h` — print the command list (same as running `rleds` with no arguments).

## Commands

- `scan [port] [timeout_ms]` - discover devices on the LAN via UDP broadcast. Each result also includes the device hostname (from its config), so you can match the IP to the label you wrote on the case. Results are cached to disk (`/tmp/reactive-leds-scan.json` on macOS/Linux) to speed up subsequent commands (invalidated after 5 minutes).
- `ping [host] [port]` - check if a device is online. If `host` is omitted, pings every discovered device.
- `reset-wifi [host] [port]` - clear WiFi credentials. If `host` is omitted, applies to every discovered device.
- `config <host> [port] [key] [value]` - read or update device configuration. Reading prints current keys and values. Writing reboots the device (~5 s offline before recovery). Requires an explicit `host`. Supported keys: `hostname` (string, max 32 chars), `pin` (GPIO `0..49`), `num_leds` (`1..255`), `port` (UDP port `1024..65535`).
- `leds <host> [port] <leds_package>` - send LED updates. The package is a comma-separated list of values in groups of 5: `<led_index>,<r>,<g>,<b>,<w>` (w = white/brightness). Multiple LEDs can be chained: `0,255,0,0,0,1,0,128,128,0`. Each value between 0 and 255. Requires an explicit `host`.
- `bt-scan` - scan devices over Bluetooth.
- `bt-credential [indexOrHost] [ssid]` - send WiFi credentials over Bluetooth. If `indexOrHost` is omitted, runs in interactive mode: shows the list of found devices and asks which to select (by numeric index or name). If `ssid` is omitted, it is prompted (password is always prompted, hidden). If `indexOrHost` is a number, it is used as an index into the `bt-scan` list (1-based).
- `proxy [host] [port] [device_port] [awdl]` - start the WebSocket proxy between browser clients and the firmware. `port` is the local WebSocket bind port; `device_port` is the firmware UDP port (`1024..65535`). Scans the LAN every 10 seconds and shows discovered devices in realtime — IP, hostname, firmware-reported MAC and live RSSI when available. On macOS, `awdl` controls the AirDrop/AirPlay interface that causes micro-lag while streaming (see Troubleshooting): `ask` (default: offer to disable it for the session), `off` (disable without asking), `keep` (leave it alone).
- `benchmark [host] [fps] [duration] [port]` - send timed LED frames and report delivery, jitter and drop counters. If `host` is omitted, tests every discovered device. Defaults: `fps=60`, `duration=30`, `port=4210`.
- `rainbow [seconds] [speed] [host] [port]` - scroll a rainbow across the strip. If `host` is omitted, the effect is sent to every discovered device.
- `color [r] [g] [b] [w] [host] [port]` - set all LEDs to a solid color. If `r g b` are omitted, a random color is used. If `host` is omitted, targets every discovered device.
- `off [host] [port]` - turn off all LEDs. If `host` is omitted, applies to every discovered device. Convenience alias for `color 0 0 0 0`.
- `status [host] [port]` - get device status (uptime, heap, WiFi RSSI and optional memory/frame metrics). If `host` is omitted, queries every discovered device.
- `version [host] [port]` - read the firmware version (from `PROJECT_VER` / `git describe`). If `host` is omitted, queries every discovered device.
- `clear-cache` - delete the on-disk scan cache (`/tmp/reactive-leds-scan.json`). Useful when you have added/moved a device, changed WiFi networks, or just want to force a fresh discovery on the next command. `config` writes also clear the cache automatically (since they reboot the device).

## Examples (minimal)

```bash
rleds scan
rleds ping 192.168.1.10
rleds config 192.168.1.10 4210 hostname tube-1
rleds leds 192.168.1.10 4210 0,255,0,0,0
rleds bt-scan
rleds bt-credential
rleds proxy
rleds benchmark 192.168.1.10 60 120
rleds rainbow 10 1 192.168.1.10
rleds color
rleds color 255 0 0
rleds color 255 0 0 0 192.168.1.10
```

## Proxy

Browsers cannot send UDP packets directly. `rleds proxy` starts a local WebSocket server that bridges browser ↔ device:

```
browser (WebSocket) → proxy → device (UDP)
```

It uses the binary multiplexed protocol consumed by `@reactive-leds/client`. WS responses have the form `[requestId, ...payload]` (no `PacketType` byte): the browser matches each response to its request by `requestId`. The device-side wire format is documented in [`shared/README.md`](../shared/README.md).

The proxy scans the LAN every 10 seconds and updates the device list in realtime — useful to see when a device connects or disconnects:

```
$ rleds proxy
Proxy: ws://0.0.0.0:8000  devices: 1

  esp32-X (192.168.X.X:4210) AA:BB:CC:DD:EE:FF  rssi -55 dBm
```

## Troubleshooting

### macOS: every device shows `offline` but it responds to `nc`

Symptom: `rleds ping <ip>` reports `offline` (with `DEBUG=1`: `send EHOSTUNREACH` on every attempt, instantly), yet the device answers a manual probe like `echo -ne '\x01\x00' | nc -u -w1 <ip> 4210`.

Cause: macOS **Local Network privacy** (System Settings → Privacy & Security → Local Network). The check only applies to third-party binaries — Apple tools like `nc` are exempt, which is why they keep working. Node (and therefore `rleds`) is blocked, and the permission is attributed to the **terminal app** you launch it from (iTerm, Terminal, …), so `node` never appears in the list itself.

Fix: enable the toggle for your terminal app in Privacy & Security → Local Network. If it is already on (the state can get corrupted after a macOS update), toggle it off and on, then fully restart the terminal (Cmd+Q).

### macOS: periodic micro-lag while streaming over WiFi (AWDL)

Symptom: LED animations stutter briefly every few seconds even with a strong signal and ~100% packet delivery. `rleds benchmark <host>` shows arrival gaps in bursts (`arrival-gaps` buckets >50ms populated) with `seq-lost 0` — frames are delayed, not lost.

Cause: **AWDL** (Apple Wireless Direct Link), the hidden interface behind AirDrop/AirPlay/Handoff. Every few seconds macOS hops the WiFi radio off-channel to scan for nearby Apple devices, holding outbound traffic for 50-200ms. Measured on this project: disabling it cut >100ms gaps by ~90%.

Fix: `rleds benchmark` and `rleds rainbow` warn when AWDL is active; `rleds proxy` detects it and offers to disable it for the session (it prompts for your password via `sudo`, re-disables it if macOS turns it back on, and restores it on exit). Alternatives: connect the Mac via Ethernet (best), or turn off AirDrop/AirPlay Receiver/Handoff in System Settings. Manual toggle: `sudo ifconfig awdl0 down` (does not survive sleep/reboot).

## BLE Provisioning Flow

`bt-scan` → `bt-credential` → device reboots → WiFi ready.

## Bluetooth Requirements

The `bt-*` commands use [`@stoprocent/noble`](https://github.com/stoprocent/noble), which has native dependencies that vary by OS:

- **macOS**: works out of the box. The terminal you launch `rleds` from will request a Bluetooth permission prompt on first run — grant it (System Settings → Privacy & Security → Bluetooth).
- **Linux**: requires `libbluetooth-dev` (Debian/Ubuntu) or `bluez-libs-devel` (Fedora) installed before `npm install`. The `rleds` binary needs `cap_net_raw` capability or must be run as root: `sudo setcap cap_net_raw+eip $(eval readlink -f \`which node\`)`.
- **Windows**: if `bt-scan` returns no devices, consider using WSL2 with `usbipd` to forward a USB Bluetooth dongle.

## Environment Variables

- `DEBUG=1` — enable verbose logging across all commands (per-packet UDP/WebSocket dumps, BLE characteristic writes, ping retries during scan, etc.). Use it when diagnosing why a device does not respond.

```bash
DEBUG=1 rleds scan
DEBUG=1 rleds ping 192.168.1.10
```

## Usage examples (config read)

```bash
$ rleds config 192.168.1.10
Config:
    - pin: 18
    - Num LEDs: 16
    - Port: 4210
    - Hostname: tube-1
```

## Exit codes

- `0` — command succeeded
- `1` — error (device not found, invalid credentials, timeout, etc.)

## Updating

```bash
git pull                     # latest code
npm install && npm run build # rebuild
npm link                     # update the global symlink
```

## Links

- [Back to main README](../README.md)
