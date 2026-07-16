<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/cli)](https://www.npmjs.com/package/@reactive-leds/cli)

# CLI

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
- `ping [target]` - check if a device is online. Use `all` or omit `target` to ping every discovered device.
- `reset-wifi [target]` - clear WiFi credentials. Use `all` or omit `target` to apply to every discovered device.
- `config <target> [key] [value]` - read or update the configuration. `target` is `host`, `host:port`, `all`, or `all:port`. Writing reboots the device (~5 s offline before recovery). Supported keys: `hostname` (string, max 32 chars), `pin` (output GPIO `0..21` or `26..48`), `num_leds` (`1..255`), `port` (UDP port `1024..65535`).
- `leds <target> <leds_package>` - update contiguous LEDs. The package is `<start_index>` followed by one or more `<r>,<g>,<b>,<w>` groups: `2,255,0,0,0` turns the third LED red without changing the others. Each value is between 0 and 255.
- `bt-scan` - scan devices over Bluetooth.
- `bt-credential [indexOrHost] [ssid]` - send WiFi credentials over Bluetooth. If `indexOrHost` is omitted, runs in interactive mode: shows the list of found devices and asks which to select (by numeric index or name). If `ssid` is omitted, it is prompted (password is always prompted, hidden). If `indexOrHost` is a number, it is used as an index into the `bt-scan` list (1-based).
- `proxy [host] [port] [device_port]` - start the WebSocket proxy between browser clients and the firmware. `port` is the local WebSocket bind port; `device_port` is the firmware UDP port (`1024..65535`). Scans the LAN every 10 seconds and shows discovered devices in realtime — IP, hostname, firmware-reported MAC and live RSSI when available. On macOS it only warns when AWDL (AirDrop/AirPlay) is active, since it can cause micro-lag while streaming (see Troubleshooting).
- `benchmark <target> [fps] [duration] [format]` - measure RTT and send timed LED frames to one device, reporting delivery, jitter and drops. `format` is `text` or `json`. Defaults: `fps=60`, `duration=30`, `format=text`.
- `rainbow [target] [seconds] [speed]` - scroll a rainbow across the strip. Use `all` or omit `target` to target every discovered device.
- `color [target] [r] [g] [b] [w]` - set all LEDs to a solid color. If `r g b` are omitted, a random color is used. Use `all` or omit `target` to target every discovered device.
- `off [target]` - turn off all LEDs. Use `all` or omit `target` to target every discovered device.
- `status [target]` - get the device status (uptime, heap, WiFi RSSI and runtime frame counters). Use `all` or omit `target` to query every discovered device.
- `version [target]` - read the firmware version (from `PROJECT_VER` / `git describe`). Use `all` or omit `target` to query every discovered device.
- `clear-cache` - delete the on-disk scan cache (`/tmp/reactive-leds-scan.json`). Useful when you have added/moved a device, changed WiFi networks, or just want to force a fresh discovery on the next command. `config` writes also clear the cache automatically (since they reboot the device).

## Examples (minimal)

```bash
rleds scan
rleds ping 192.168.1.10
rleds config 192.168.1.10 hostname tube-1
rleds leds 192.168.1.10 0,255,0,0,0
rleds bt-scan
rleds bt-credential
rleds proxy
rleds benchmark 192.168.1.10 60 120
rleds benchmark 192.168.1.10 60 120 json > run.json
rleds rainbow 192.168.1.10 10 1
rleds color
rleds color all 255 0 0
rleds color 192.168.1.10 255 0 0 0
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

## Benchmark

`rleds benchmark <target> [fps] [duration] [format]` first runs 1000 sequential pings, then sends timed `SET_LEDS` frames to one device and compares host-side attempts with the firmware counters. Use `format=json` to retain parameters, status snapshots, deltas and derived metrics.

Read the output like this:

- `Host attempted`: frames the CLI tried to schedule.
- `Host scheduler`: whether the machine running the CLI was late. `frames >5ms late` counts how many frames left more than 5 ms behind schedule; `max-late` is the worst delay. If this is bad, the sender is the bottleneck.
- `RTT`: received pings and p50, p95, p99 and maximum round-trip time.
- `quality` / `score`: a summary verdict for the run. The score starts at `100` and loses points for lost packets, long gaps, RMT drops, reordering, beacon timeouts or disconnects.
- `send-ok` / `send-errors`: UDP sends accepted or rejected by the local OS.
- `firmware udp-read`: UDP packets read during the stream, excluding the final status request.
- `device recv`: valid `SET_LEDS` frames received by the firmware.
- `shown`: frames handed to the LED driver.
- `shown-rate`: frames handed to the LED driver divided by the run's actual elapsed time.
- `dropped` / `rmt-drop-rate`: frames skipped because the previous RMT transfer was still busy. At normal frame rates this should stay at `0.000%`.
- `set-leds`: `device recv / attempted`. This is the main delivery number for LED frames.
- `arrival-gaps`: spacing between benchmark-tracked `SET_LEDS` packets. At 60 fps most frames should land in `≤20ms`; many `>100ms` gaps mean visible stutter.
- `max`: the largest arrival gap seen during the current run; if it is high but `seq-lost` stays low, packets arrived late or in bursts rather than getting lost.
- `seq-lost`: benchmark frame IDs that never reached the firmware. If `arrival-gaps` looks bad but `seq-lost` is `0`, packets were delayed/bursted rather than lost.
- `loop-max-gap`: the firmware protocol-loop's largest gap since boot, so treat it as a sanity check, not only as a metric for the current run.

Ordinary `SET_LEDS` commands use packet id `0`, so they do not update `arrival-gaps`, `seq-lost` or `seq-reordered`. Those counters describe benchmark traffic only.

## Troubleshooting

### macOS: every device shows `offline` but it responds to `nc`

Symptom: `rleds ping <ip>` reports `offline` (with `DEBUG=1`: `send EHOSTUNREACH` on every attempt, instantly), yet the device answers a manual probe like `echo -ne '\x01\x00' | nc -u -w1 <ip> 4210`.

Cause: macOS **Local Network privacy** (System Settings → Privacy & Security → Local Network). The check only applies to third-party binaries — Apple tools like `nc` are exempt, which is why they keep working. Node (and therefore `rleds`) gets blocked, and the permission is attributed to the **terminal app** you launch it from (iTerm, Terminal, …), so `node` never appears in the list itself.

Fix: enable the toggle for your terminal app in Privacy & Security → Local Network. If it is already on (the state can get corrupted after a macOS update), toggle it off and on, then fully restart the terminal (Cmd+Q).

### macOS: periodic micro-lag while streaming over WiFi (AWDL)

Symptom: LED animations may stutter briefly every few seconds even with a strong signal. When AWDL is the cause, `rleds benchmark <host>` often shows arrival gaps in bursts (`arrival-gaps` buckets >50ms populated) with `seq-lost 0` — frames arrive late, they don't get lost.

Cause: **AWDL** (Apple Wireless Direct Link), the hidden interface behind AirDrop/AirPlay/Handoff. macOS may hop the WiFi radio to another channel to scan for nearby Apple devices, briefly holding outbound traffic. The impact depends on the setup; the CLI warns so you can rule it out before trusting benchmarks.

Fix: `rleds benchmark` and `rleds rainbow` warn when AWDL is active; `rleds proxy` does the same. Alternatives: connect the Mac via Ethernet (best), turn off AirDrop/AirPlay Receiver/Handoff in System Settings, or manually run `sudo ifconfig awdl0 down` for the session.

## BLE provisioning flow

`bt-scan` → `bt-credential` → device reboots → WiFi ready.

## Bluetooth requirements

The `bt-*` commands use [`@stoprocent/noble`](https://github.com/stoprocent/noble), which has different native dependencies per OS:

- **macOS**: works out of the box. On first launch the terminal asks for the "Bluetooth" permission — grant it (System Settings → Privacy & Security → Bluetooth).
- **Linux**: requires `libbluetooth-dev` (Debian/Ubuntu) or `bluez-libs-devel` (Fedora) installed before `npm install`. The `rleds` binary needs the `cap_net_raw` capability or must run as root: `sudo setcap cap_net_raw+eip $(eval readlink -f \`which node\`)`.
- **Windows**: if `bt-scan` finds no devices, consider WSL2 with `usbipd` to forward a USB Bluetooth dongle.

## Environment variables

- `DEBUG=1` — enables verbose logging on every command (UDP/WebSocket packet dumps, BLE characteristic writes, ping retries during scan, etc.). Use it when a device is not responding.

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
npm link                     # refresh the global link
```

## Links

- [Back to the main README](../README.md)
