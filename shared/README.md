# Shared

Language: [English](./README.md) | [Italiano](./README-it.md)

This package contains the binary protocol specification for communicating with `reactive-leds` devices, plus the TypeScript types and serialization helpers that implement it (shared by [client](../client/README.md) and [CLI](../cli/README.md)). If you want to control LEDs from another language, start here.

> Internal monorepo package — inlined into `@reactive-leds/client` and `@reactive-leds/cli` at build time, not published to npm.

## Protocol

Communication with the firmware uses fixed-format binary UDP packets. No JSON, no overhead, just bytes. The goal is minimal latency for real-time LED updates.

Every packet starts with two bytes:

```
[PacketID, PacketType, ...PacketData]
```

- **PacketID**: a sequence number used to match responses to requests.
- **PacketType**: one of the values in the table below.

| Type | Value | Direction | Description |
| --- | --- | --- | --- |
| `PING` | 0 | request/response | Check if the device is reachable |
| `GET_CONFIG` | 1 | request/response | Read device configuration |
| `SET_CONFIG` | 2 | request/response | Write device configuration (device reboots on success — see below) |
| `SET_LEDS` | 3 | request only | Update LED colors (no response) |
| `RESET_WIFI` | 4 | request only | Clear stored Wi-Fi credentials |
| `GET_VERSION` | 5 | request/response | Read firmware version (from `PROJECT_VER` / `git describe`) |
| `GET_STATUS` | 6 | request/response | Read device status (uptime, free heap, Wi-Fi RSSI) |

### Example (PING)

A concrete walkthrough: PING device 192.168.1.10 on port 4210.

```
→  01 00               # request:  PacketID=1, PING
←  01 00 01            # response: PacketID=1, PING, status=OK (1)
```

The same pattern applies to every request/response type: send `[id, type, ...data]`, receive `[id, type, ...response]`. Fire-and-forget types (`SET_LEDS`, `RESET_WIFI`) have no response.

### Packet sizes

| PacketType | Request | Response |
| --- | --- | --- |
| `PING` | 2 B (fixed) | 3 B (fixed) |
| `GET_CONFIG` | 2 B (fixed) | 6–38 B (header + hostname 0–32 B) |
| `SET_CONFIG` | 6–38 B (header + hostname 0–32 B) | 3 B (`id, type, status`) |
| `SET_LEDS` | 7–1497 B (2 + N×5, N = 1..299 LEDs) | — (no response) |
| `RESET_WIFI` | 2 B (fixed) | 3 B (fixed) |
| `GET_VERSION` | 2 B (fixed) | 2–34 B (header + version string 0–32 B) |
| `GET_STATUS` | 2 B (fixed) | 11 B (fixed) |

### SET_LEDS format

LED updates use PacketData composed of 5-byte sequences, one per LED:

```
[pixel_index, r, g, b, w]
```

Multiple LEDs can be batched in a single packet:

```
[PacketID, SET_LEDS, pixel_index, r, g, b, w, pixel_index, r, g, b, w, ...]
```

`SET_LEDS` has no response — it is fire-and-forget by design to minimize latency.

### Updating the configuration

```
[PacketID, GET_CONFIG/SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

The port is split across two bytes (big-endian). The hostname is length-delimited by the packet — the firmware reads `packet_length - 6` bytes starting at offset 6.

**Reboot on success.** When `SET_CONFIG` saves successfully, the device sends the OK response and then reboots within ~100 ms. This is required because `pin` (RMT peripheral) and `port` (UDP socket) are bound at startup and cannot be re-bound at runtime. A client should expect the device to be unreachable for ~5 s after the response and re-establish the connection (⚠️ note: the device's UDP port may have changed).

### String encoding

Hostname and Wi-Fi credentials (SSID/password) are treated as **ASCII**. The firmware stores them as raw bytes, while the JS client encodes and decodes them as UTF-8. For standard ASCII the behavior is identical, but non-ASCII characters can produce replacement characters (`�`) or fail to match correctly, especially near the 32-byte hostname truncation boundary.

In practice: stick to `[a-z0-9-]` for hostnames (RFC 1123) and avoid non-ASCII characters in Wi-Fi credentials.

## BLE provisioning

A freshly-flashed device isn't on the network yet, so the UDP protocol above is useless until you tell it which Wi-Fi to connect to. That first handshake happens over BLE GATT: you pass SSID and password once, it reboots connected.

| Field | Value |
| --- | --- |
| Service UUID | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Characteristic properties | `WRITE`, `READ`, `NOTIFY` |
| Device name (advertised) | the configured hostname (e.g. `esp-1`) |

### Write payload

A single UTF-8 string in the form `<ssid>,<password>`:

- comma `,` is the separator (so the SSID cannot contain `,`)
- max SSID length: 32 bytes (IEEE 802.11 limit)
- max password length: 63 bytes (WPA2 limit)
- no terminator, no length prefix — the BLE write length is the payload length

After a valid write the device stores the credentials in NVS and reboots within ~2 s. If no write arrives within `BLE_TIMEOUT_MS` (default 180 s), the device also reboots.

> ⚠️ **Security note**: no pairing, no encryption. Credentials are sent in plaintext over the air. This is a deliberate trade-off for setup simplicity — provisioning is meant to happen once, in a trusted location.

Reference implementations:

- Device (server): [`firmware/main/ble.c`](../firmware/main/ble.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](../cli/cmd/bluetooth.ts) — uses `@stoprocent/noble`

## Reference implementations

If you want to write a client in another language (Python, Rust, Go, Pure Data, Max/MSP…), these are the authoritative implementations:

- **Receiver (device)**: [`firmware/main/protocol.c`](../firmware/main/protocol.c) — UDP listener, response builder.
- **UDP sender (Node)**: [`cli/protocol.ts`](../cli/protocol.ts) — raw UDP client used by the CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](../client/src/main.ts) — uses the CLI's WebSocket proxy to reach the device.

The protocol itself is not licensed — the byte layout above is sufficient to write a fully compatible client from scratch.

## Versioning

The protocol grows by addition, never by modification: new behavior means a new `PacketType`. An old firmware simply ignores unknown types, so a newer client doesn't crash it — it degrades gracefully. `GET_VERSION` and `GET_STATUS` were added this way without touching a single line of what came before.

The golden rule: do not change the byte layout of an existing `PacketType` without updating every package that uses it (firmware, CLI, client).

## Links

- [Back to main README](../README.md)
