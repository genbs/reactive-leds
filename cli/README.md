# CLI

Language: [English](./README.md) | [Italiano](./README-it.md)

`rleds` is the universal remote for your reactive LEDs: scan, ping, colors, effects, configuration, BLE provisioning, and WebSocket proxy — all from the terminal.

## Quickstart

```bash
npm install
npm link       # makes the rleds command available globally
rleds <command>
```

## Global flags

- `--version` / `-v` — print the CLI version and exit.
- `--help` / `-h` — print the command list (same as running `rleds` with no arguments). For per-command help: `rleds help <command>`.

## Commands

- `scan [port]` — discover devices on the LAN via ARP + UDP ping. Each result includes the device's hostname (from its config), so you can match the IP to the tape you wrote on the case. Results are cached on disk (`/tmp/reactive-leds-scan.json` on macOS/Linux) for 5 minutes.
- `clear-cache` — delete the on-disk scan cache (`/tmp/reactive-leds-scan.json`). Useful when you added/moved a device, changed Wi-Fi networks, or want to force a fresh discovery on the next command. `config` writes also clear the cache automatically (since they reboot the device).
- `ping [ipOrHostname] [port]` — check if a device is online. If `ipOrHostname` is omitted, pings every discovered device.
- `reset-wifi [ipOrHostname] [port]` — clear Wi-Fi credentials. If `ipOrHostname` is omitted, applies to every discovered device.
- `config <ipOrHostname> [port] [key] [value]` — read or update device configuration. On read, prints the current keys and values. On write, reboots the device (~5 s offline before recovery). Requires an explicit `ipOrHostname`. Supported keys: `hostname` (string, max 32 chars), `pin` (number, LED GPIO), `num_leds` (number), `port` (number, UDP port).
- `leds <ipOrHostname> [port] <leds_package>` — send LED updates. The package is a comma-separated list of values in groups of 5: `<led_index>,<r>,<g>,<b>,<w>` (w = white/brightness). Multiple LEDs can be controlled by chaining groups: `0,255,0,0,0,1,0,128,128,0`. Each value is 0–255. Requires explicit `ipOrHostname`.
- `bt-scan` — scan devices over Bluetooth.
- `bt-credential [indexOrHost] [ssid]` — send Wi-Fi credentials over Bluetooth. If `indexOrHost` is omitted, starts interactively: shows the device list and prompts for selection (by numeric index or name). If `ssid` is omitted, prompts for it (password is always prompted, hidden). If `indexOrHost` is a number, it's used as a 1-based index from `bt-scan`.
- `proxy [host] [port] [device_port]` — start the WebSocket proxy between browser clients and firmware. Scans the LAN every 10 seconds and shows discovered devices in real time — IP, hostname, and MAC.
- `rainbow [seconds] [speed] [ipOrHostname] [port]` — scroll a rainbow across the strip(s). If `ipOrHostname` is omitted, the effect is sent to every discovered device.
- `color [r] [g] [b] [w] [ipOrHostname] [port]` — set all LEDs to a solid color. If `r g b` are omitted, a random color is used. If `ipOrHostname` is omitted, targets every discovered device.
- `off [ipOrHostname] [port]` — turn off all LEDs. If `ipOrHostname` is omitted, applies to every discovered device. Convenience alias for `color 0 0 0 0`.
- `status [ipOrHostname] [port]` — get device status (uptime, free heap, Wi-Fi RSSI). If `ipOrHostname` is omitted, queries every discovered device.
- `version [ipOrHostname] [port]` — read the firmware version (from `PROJECT_VER` / `git describe`). If `ipOrHostname` is omitted, queries every discovered device.

## Examples

```bash
rleds scan
rleds ping 192.168.1.10
rleds config 192.168.1.10 4210 hostname tube-1
rleds leds 192.168.1.10 4210 0,255,0,0,0
rleds bt-scan
rleds bt-credential
rleds proxy
rleds rainbow 10 1 192.168.1.10
rleds color
rleds color 255 0 0
rleds color 255 0 0 0 192.168.1.10
```

Config read output:

```
$ rleds config 192.168.1.10
Config:
	- pin: 18
	- Num LEDs: 16
	- Port: 4210
	- Hostname: tube-1
```

## Proxy

Browsers cannot send UDP packets directly. `rleds proxy` starts a local WebSocket server that bridges browser ↔ device:

```
browser (WebSocket) → proxy → device (UDP)
```

It uses the binary multiplexed protocol consumed by `@reactive-leds/client`. WS responses have the form `[requestId, ...payload]` (no `PacketType` byte): the browser matches each response to its request by `requestId`. The device-side wire format is documented in [`shared/README.md`](../shared/README.md).

The proxy scans the LAN every 10 seconds and updates the device list in real time — useful to see when a device connects or disconnects:

```
$ rleds proxy
Proxy: ws://0.0.0.0:8000  ● active  last scan: 8s  devices: 1

  esp32-X (192.168.X.X) [aa:bb:cc:dd:ee:ff]
```

## Notes

- `scan` uses `arp -a`, which works on macOS and Linux. The output format differs on Windows, so the command does not work correctly there.

## BLE Provisioning Flow

`bt-scan` → `bt-credential` → device reboots → Wi-Fi ready.

## Bluetooth Requirements

The `bt-*` commands use [`@stoprocent/noble`](https://github.com/stoprocent/noble), which has native dependencies that vary by OS:

- **macOS**: works out of the box. On first run, the terminal requests a "Bluetooth permission" — grant it (System Settings → Privacy & Security → Bluetooth).
- **Linux**: requires `libbluetooth-dev` (Debian/Ubuntu) or `bluez-libs-devel` (Fedora) installed before `npm install`. The `rleds` binary needs `cap_net_raw` capability or must be run as root: `sudo setcap cap_net_raw+eip $(eval readlink -f \`which node\`)`.
- **Windows**: if `bt-scan` returns no devices, consider WSL2 with `usbipd` to forward a USB Bluetooth dongle.

## Environment Variables

- `DEBUG=1` — enable verbose logging across all commands (per-packet UDP/WebSocket dumps, BLE characteristic writes, ping retries during scan, etc.). Use it when diagnosing why a device doesn't respond.

```bash
DEBUG=1 rleds scan
DEBUG=1 rleds ping 192.168.1.10
```

## Exit Codes

- `0` — success
- `1` — error (device not found, invalid credentials, timeout, etc.)

## Update

```bash
git pull
npm install && npm run build
npm link
```

## Links

- [Back to main README](../README.md)
