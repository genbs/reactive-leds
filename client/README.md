# Client Library

Language: [English](./README.md) | [Italiano](./README-it.md)

JavaScript client for realtime control of the device over WiFi. It is intended to integrate with browser-based tools for interactive visuals, but it can be used from any JS runtime.

## Dev

```bash
npm install
npm run start
```

## Build

```bash
npm run build
```

## Usage

Connect to the proxy:

```ts
const isConnected = await leds.begin("ws://localhost:8000")
```

> Need the device IPs? Run `rleds proxy` from a terminal — it prints the LAN scan at startup, copy them into your code.

Check if a device is alive:

```ts
const ping = await leds.ping("192.168.X.Y" /*, port = 4210 */)
```

Get device config:

```ts
const config = await leds.getConfig("192.168.X.Y" /*, port = 4210 */)
```

Send LED updates:

```ts
await leds.setLEDs("192.168.X.Y", 4210, new Uint8Array([0 /* pixel_index */, 255, 0, 0, 0]))
```

For details on the data format see the [protocol docs](../shared/README.md#set_leds-format).

## Notes

- Updates are sent over UDP and are designed for realtime use.
- Under sustained overload the firmware drops new UDP arrivals at the kernel (drop-tail) to bound staleness; in normal use frames are displayed within ~10 ms of arrival.

## Links

- [Back to main README](../README.md)
