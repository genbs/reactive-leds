# Shared

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Language: [English](./README.md) | [Italiano](./README-it.md)

This package contains the binary protocol specification for talking to `reactive-leds` devices, plus the TypeScript types and serialization helpers that implement it (shared by [client](../client/README.md) and [CLI](../cli/README.md)).

If you want to control the LEDs from another language, start here.

> Internal monorepo package: it is inlined into `@reactive-leds/client` and `@reactive-leds/cli` at build time, not published to npm.

## Protocol

You talk to the firmware over UDP, with fixed-format binary packets: no JSON, no overhead, just bytes. The goal is minimal latency for real-time LED updates.

Every packet starts with two bytes:

```
[PacketID, PacketType, ...PacketData]
```

- **PacketID**: sequence number used to match responses to synchronous requests.
- **PacketType**: one of the values in the table below.

| Type          | Value | Direction        | Description                                                                                |
| ------------- | ----- | ---------------- | ------------------------------------------------------------------------------------------ |
| `PING`        | 0     | request/response | Checks whether the device is reachable                                                     |
| `GET_CONFIG`  | 1     | request/response | Reads the device configuration                                                             |
| `SET_CONFIG`  | 2     | request/response | Writes the device configuration (the device reboots on success — see below)                |
| `SET_LEDS`    | 3     | request only     | Updates the LED colors (no response)                                                       |
| `RESET_WIFI`  | 4     | request/response | Clears the saved WiFi credentials (the device replies OK, then reboots)                    |
| `GET_INFO`    | 5     | request/response | Reads the device identity (IP, port, MAC, hostname, firmware version)                      |
| `GET_STATUS`  | 6     | request/response | Reads runtime state (uptime, heap, WiFi RSSI, memory and frame metrics)                    |

### Example (PING)

A concrete example: PING to device 192.168.1.10 on port 4210.

```
→  01 00               # request:  PacketID=1, PING
←  01 00 01            # response: PacketID=1, PING, status=OK (1)
```

The same pattern applies to every request/response type: send `[id, type, ...data]`, receive `[id, type, ...response]`. The only fire-and-forget type is `SET_LEDS`, which has no response.

### Packet sizes

| PacketType    | Request                            | Response                                |
| ------------- | ---------------------------------- | --------------------------------------- |
| `PING`        | 2 B (fixed)                        | 3 B (fixed)                             |
| `GET_CONFIG`  | 2 B (fixed)                        | 6–38 B (header + hostname 0–32 B)       |
| `SET_CONFIG`  | 6–38 B (header + hostname 0–32 B)  | 3 B (`id, type, status`)                |
| `SET_LEDS`    | 7–1023 B (3 + N×4, N = 1..255)   | — (no response)           |
| `RESET_WIFI`  | 2 B (fixed)                        | 3 B (fixed)                             |
| `GET_INFO`    | 2 B (fixed)                        | 16–80 B (identity + version/hostname 0–32 B each) |
| `GET_STATUS`  | 2 B (fixed)                        | 11 B base / 43 B with metrics / 91 B with benchmark counters |

### SET_LEDS format

To update contiguous LEDs, send the start index followed by 4-byte RGBW groups:

```
[start_index, r, g, b, w, r, g, b, w, ...]
```

```
[PacketID, SET_LEDS, start_index, r, g, b, w, r, g, b, w, ...]
```

The first group updates `start_index`; following groups update consecutive indices. LEDs outside that range are unchanged.

`SET_LEDS` has no response — it is fire-and-forget to minimize latency.

**The protocol ceiling is 255 LEDs per device**: both `start_index` and the config's `num_leds` field are single bytes. This is deliberate, tailored to segment strips (16 segments/m ≈ 15 m of FCOB per device), not high-density panels.

### Updating the configuration

```
[PacketID, SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

The port is split across two bytes (big-endian). The hostname is length-delimited by the packet — the firmware reads `packet_length - 6` bytes starting at offset 6.

**Reboot on success.** When `SET_CONFIG` saves correctly, the device sends the OK response and then reboots within ~100 ms. This is necessary because `pin` (RMT peripheral) and `port` (UDP socket) are bound at startup and cannot be rebound at runtime. Clients must expect the device to be unreachable for ~5s after the response and re-establish the connection (⚠️ careful: the device's UDP port may have changed).

### String encoding

The hostname and the WiFi credentials (SSID/password) are treated as **ASCII**. The firmware stores them as raw bytes, while the JS client encodes and decodes them as UTF-8. For standard ASCII the behavior is identical, but non-ASCII characters may produce replacement characters (`�`) or fail to match correctly, especially near the hostname's 32-byte truncation limit.

In practice: stick to `[a-z0-9-]` for hostnames (RFC 1123) and avoid non-ASCII characters in WiFi credentials.

## BLE provisioning

A freshly flashed device is not on the network yet, so the UDP protocol above is useless until you tell it which WiFi to join. That first handshake happens over BLE GATT: you hand it SSID and password once, and it reboots connected.

| Field                     | Value                                  |
| ------------------------- | -------------------------------------- |
| Service UUID              | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID       | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Characteristic properties | `WRITE`, `READ`, `NOTIFY`              |
| Device name (advertised)  | the configured hostname (e.g. `esp-1`) |

### Write payload

A single UTF-8 string in the format `<ssid>,<password>`:

- the comma `,` is the separator (so the SSID cannot contain `,`)
- max SSID length: 32 bytes (IEEE 802.11 limit)
- max password length: 63 bytes (WPA2 limit)
- no terminator, no length prefix — the BLE write length is the payload length

After a valid write the device saves the credentials to NVS and reboots within ~2 s. If no write arrives within `BLE_TIMEOUT_MS` (default 180 s), the device reboots anyway.

> ⚠️ **Security note**: no pairing, no encryption. Credentials are transmitted in cleartext over the air. This is a deliberate choice for setup simplicity — provisioning happens once, in a trusted place.

Reference implementations:

- Device (server): [`firmware/main/ble.c`](../firmware/main/ble.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](../cli/cmd/bluetooth.ts) — uses `@stoprocent/noble`

## Reference implementations

If you want to write a client in another language (Python, Rust, Go, Pure Data, Max/MSP…), these are the authoritative implementations:

- **Receiver (device)**: [`firmware/main/protocol.c`](../firmware/main/protocol.c) — UDP listener, response building.
- **UDP sender (Node)**: [`cli/protocol.ts`](../cli/protocol.ts) — raw UDP client used by the CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](../client/src/main.ts) — uses the CLI's WebSocket proxy to reach the device.

The protocol itself is not covered by any license — the byte layout above is enough to write a fully compatible client from scratch.

## Versioning

The protocol grows by addition: new behavior means a new `PacketType`, and existing responses may only grow by appending optional fields at the end. Before the first public release, an incompatible cleanup is still acceptable when it makes the protocol clearer; `GET_INFO` replaced the more limited `GET_VERSION` for this reason.

The golden rule: never reorder or reinterpret existing bytes without updating every packet that uses them (firmware, CLI, client).

## Links

- [Back to the main README](../README.md)
