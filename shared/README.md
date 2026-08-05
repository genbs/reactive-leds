# Shared

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Language: [English](https://github.com/genbs/reactive-leds/blob/master/shared/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/shared/README-it.md)

This package contains the binary protocol specification for talking to `reactive-leds` devices, plus the TypeScript types and serialization helpers that implement it (shared by [client](https://github.com/genbs/reactive-leds/blob/master/client/README.md) and [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README.md)).

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
| `GET_STATUS`  | 6     | request/response | Reads one fixed snapshot of runtime state and diagnostic counters                            |

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
| `GET_STATUS`  | 2 B (fixed)                        | 91 B (fixed)                              |

### GET_STATUS format

`GET_STATUS` returns a fixed 91-byte packet: the two-byte header followed by an 89-byte payload. It does not run a benchmark. Most counters are maintained by the firmware since boot; the CLI benchmark reads one snapshot before and one after a run, then calculates their difference.

| Packet offsets | Field | Encoding | Meaning |
| --- | --- | --- | --- |
| 0 | `packetId` | u8 | Matches the request |
| 1 | `type` | u8 | Always `GET_STATUS` (`6`) |
| 2–5 | `uptime` | u32 BE | Seconds since boot |
| 6–9 | `heap` | u32 BE | Free heap bytes |
| 10 | `rssi` | i8 | WiFi RSSI in dBm; `0` when unavailable |
| 11–22 | `internalHeap`, `largestHeapBlock`, `minHeap` | 3 × u32 BE | Internal-memory health |
| 23–42 | `framesReceived`, `framesShown`, `framesDropped`, `udpPacketsRead`, `protocolLoopMaxGapMs` | 5 × u32 BE | LED/UDP throughput and worst protocol-loop delay |
| 43–66 | `arrivalGapHist[6]` | 6 × u32 BE | `SET_LEDS` inter-arrival counts for ≤5, ≤10, ≤20, ≤50, ≤100 and >100 ms |
| 67–74 | `arrivalGapMaxMs`, `arrivalGapMaxAgeS` | 2 × u32 BE | Largest observed inter-arrival gap and seconds since it occurred |
| 75–82 | `seqLost`, `seqReordered` | 2 × u32 BE | Missing and out-of-order `SET_LEDS` sequence IDs (`0` is untracked) |
| 83–90 | `beaconTimeouts`, `wifiDisconnects` | 2 × u32 BE | WiFi link-health events since boot |

### Benchmark `SET_LEDS` packet IDs

The benchmark uses `PacketID` to opt into arrival and sequence tracking. This is independent of the `start_index` byte in the `SET_LEDS` payload.

| PacketID | Purpose | Effect on diagnostic state |
| --- | --- | --- |
| `0` | Ordinary fire-and-forget `SET_LEDS` | Does not update or reset arrival-gap/sequence tracking. It still updates the normal frame counters. |
| `1` | Benchmark start marker | Is not measured for gap/sequence tracking; resets `arrivalGapMaxMs`/`arrivalGapMaxAgeS` and re-arms the sequence baseline. It does **not** clear `arrivalGapHist`, `seqLost` or `seqReordered`. |
| `2`–`255` | Benchmark stream frames | Update arrival-gap and sequence tracking; the IDs wrap from `255` to `2`. |

Non-zero IDs are reserved for the CLI benchmark.

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

The hostname is treated as **ASCII**. WiFi credentials are encoded as UTF-8 and validated in bytes: at most 32 bytes for the SSID and 63 for the password.

In practice: stick to `[a-z0-9-]` for hostnames (RFC 1123). Non-ASCII WiFi credentials are supported, but characters may use more than one byte and reach the limits sooner.

## BLE and USB provisioning

A freshly flashed device is not on the network yet, so the UDP protocol above is useless until you tell it which WiFi to join. BLE GATT and USB serial share the same credentials payload.

| Field                     | Value                                  |
| ------------------------- | -------------------------------------- |
| Service UUID              | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID       | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Characteristic properties | `WRITE`, `READ`, `NOTIFY`              |
| Device name (advertised)  | the configured hostname (e.g. `esp-1`) |

### Write payload

The payload is `[ssid_len, password_len, ssid..., password...]`:

- offset `0`: SSID length in bytes
- offset `1`: password length in bytes
- offset `2`: UTF-8 SSID bytes followed by password bytes
- max SSID length: 32 bytes (IEEE 802.11 limit)
- max password length: 63 bytes (WPA2 limit)
- the password may be empty for an open network

After a valid write the device saves the credentials to NVS. BLE provisioning reboots after approximately 2 s; USB serial provisioning reboots after approximately 500 ms. If no credentials arrive within `PROVISIONING_TIMEOUT_MS` (default: 180 s), the device reboots anyway.

On serial, the payload is prefixed by the five ASCII bytes `RLEDS`. The device replies with `RLEDS:OK\n` or `RLEDS:ERROR\n`.

> ⚠️ **BLE security note**: BLE provisioning uses no pairing or encryption, so credentials are transmitted over the air in cleartext. This is a deliberate choice for setup simplicity — provision the device in a trusted place. USB serial provisioning is not affected by this BLE limitation.

Reference implementations:

- Device (server): [`firmware/main/ble.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/ble.c)
- Shared parser: [`firmware/main/credentials.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/credentials.c)
- USB serial: [`firmware/main/serial_provisioning.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/serial_provisioning.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](https://github.com/genbs/reactive-leds/blob/master/cli/cmd/bluetooth.ts) — uses `@stoprocent/noble`

## Reference implementations

If you want to write a client in another language (Python, Rust, Go, Pure Data, Max/MSP…), these are the authoritative implementations:

- **Receiver (device)**: [`firmware/main/protocol.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/protocol.c) — UDP listener, response building.
- **UDP sender (Node)**: [`cli/protocol.ts`](https://github.com/genbs/reactive-leds/blob/master/cli/protocol.ts) — raw UDP client used by the CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](https://github.com/genbs/reactive-leds/blob/master/client/src/main.ts) — uses the CLI's WebSocket proxy to reach the device.

The protocol itself is not covered by any license — the byte layout above is enough to write a fully compatible client from scratch.

## Versioning

The protocol grows by addition: new behavior means a new `PacketType`, and existing responses may only grow by appending optional fields at the end. Before the first public release, an incompatible cleanup is still acceptable when it makes the protocol clearer; `GET_INFO` replaced the more limited `GET_VERSION` for this reason.

The golden rule: never reorder or reinterpret existing bytes without updating every packet that uses them (firmware, CLI, client).

## Links

- [Back to the main README](https://github.com/genbs/reactive-leds/blob/master/README.md)
