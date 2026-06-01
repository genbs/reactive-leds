# Shared

Language: [English](./README.md) | [Italiano](./README-it.md)

Shared TypeScript types and protocol helpers used by the client and CLI.

## Protocol

Communication with the firmware uses fixed-format binary UDP packets.

Every packet starts with two bytes:

```
[PacketID, PacketType, ...data]
```

- **PacketID**: a sequence number used to match responses to requests.
- **PacketType**: one of the values below.

| Type | Value | Direction | Description |
|---|---|---|---|
| `PING` | 0 | request/response | Check if the device is alive |
| `GET_CONFIG` | 1 | request/response | Read device configuration |
| `SET_CONFIG` | 2 | request/response | Write device configuration (device reboots on success — see below) |
| `SET_LEDS` | 3 | request only | Update LED colors (no response) |
| `RESET_WIFI` | 4 | request only | Clear stored WiFi credentials |
| `GET_VERSION` | 5 | request/response | Read firmware version string (from `PROJECT_VER` / `git describe`) |
| `GET_STATUS`  | 6 | request/response | Read device status (uptime, free heap, WiFi RSSI) |

### SET_LEDS format

LED updates are the hot path. Each LED is encoded as 5 bytes:

```
[pixel_index, r, g, b, w]
```

Multiple LEDs can be batched in a single packet:

```
[PacketID, SET_LEDS, pixel_index, r, g, b, w, pixel_index, r, g, b, w, ...]
```

`SET_LEDS` has no response — it is fire-and-forget by design to minimize latency.

### Config format

```
[PacketID, GET_CONFIG/SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

The port is split across two bytes (big-endian). The hostname is length-delimited by the packet — the firmware reads `packet_length - 6` bytes starting at offset 6.

**Reboot on success.** When `SET_CONFIG` saves successfully, the device sends the OK response and then reboots within ~100 ms. This is required because `pin` (RMT peripheral) and `port` (UDP socket) are bound at startup and cannot be re-bound at runtime. A client should expect the device to be unreachable for ~5 s after the response and re-establish the connection (note that the device's UDP port may have changed).

### Packet sizes

UDP MTU caps the total packet at 1500 bytes. Hostname is capped at 32 bytes on the wire (firmware truncates to 31 + null).

| PacketType | Request | Response |
|---|---|---|
| `PING` | 2 B (fixed) | 3 B (fixed) |
| `GET_CONFIG` | 2 B (fixed) | 6–38 B (header + hostname 0–32 B) |
| `SET_CONFIG` | 6–38 B (header + hostname 0–32 B) | 3 B (`id, type, status`) |
| `SET_LEDS` | 7–1497 B (2 + N×5, N = 1..299 LEDs) | — (no response) |
| `RESET_WIFI` | 2 B (fixed) | 3 B (fixed) |
| `GET_VERSION` | 2 B (fixed) | 2–34 B (header + version string 0–32 B) |
| `GET_STATUS`  | 2 B (fixed) | 11 B (fixed) |

### String encoding

Hostname and Wi-Fi SSID/password are assumed to be **ASCII**. The firmware stores them as raw bytes; the JS client encodes/decodes them as UTF-8. For pure ASCII this is identical, but non-ASCII characters can produce replacement characters (`�`) or fail to match — especially around the 32-byte hostname truncation boundary. Stick to `[a-z0-9-]` for hostnames (RFC 1123) and avoid non-ASCII in Wi-Fi credentials when possible.

## BLE provisioning

Wi-Fi credentials are delivered to a newly-flashed device over BLE GATT (the UDP protocol above is only usable once Wi-Fi is up).

| Field | Value |
|---|---|
| Service UUID | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Characteristic properties | `WRITE`, `READ`, `NOTIFY` |
| Device name (advertised) | the configured hostname (e.g. `esp-1`) |

### Write payload

A single UTF-8 string in the form `<ssid>,<password>`:

- comma `,` is the separator (so SSID cannot contain `,`)
- max SSID length: 32 bytes (IEEE 802.11 limit)
- max password length: 63 bytes (WPA2 limit)
- no termination, no length prefix — the BLE write length is the payload length

After a valid write the device stores the credentials in NVS and reboots within ~2 s. If no write arrives within `BLE_TIMEOUT_MS` (default 180 s), the device also reboots.

> **Security note**: no pairing, no encryption. Credentials are sent in plaintext over the air. This is a deliberate trade-off for setup simplicity — provisioning is meant to happen once, in a trusted location.

Reference implementations:
- Device (server): [`firmware/main/ble.c`](../firmware/main/ble.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](../cli/cmd/bluetooth.ts) — uses `@abandonware/noble`

## Reference implementations

If you want to write a client in another language (Python, Rust, Go, Pure Data, Max/MSP…), these are the authoritative implementations:

- **Receiver (device)**: [`firmware/main/protocol.c`](../firmware/main/protocol.c) — UDP listener, response builder.
- **UDP sender (Node)**: [`cli/protocol.ts`](../cli/protocol.ts) — raw UDP client used by the CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](../client/src/main.ts) — uses the CLI's WebSocket proxy to reach the device.

The protocol itself is not licensed — the byte layout above is sufficient to write a fully compatible client from scratch.

## Notes

Avoid breaking changes without updating all packages that depend on this module.

## Links

- [Back to main README](../README.md)
