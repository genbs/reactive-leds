# Client Library

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/client)](https://www.npmjs.com/package/@reactive-leds/client)

Language: [English](./README.md) | [Italiano](./README-it.md)

JavaScript client for realtime LED control over WiFi. Designed to integrate with browser-based tools for interactive visuals — live coding, installations, performances — but works from any JS runtime that supports WebSocket.

## Build

```bash
npm install
npm run build
```

This produces four artifacts in `build/`:

- `reactive-leds.js` — ESM bundle (`import` / `<script type="module">`)
- `reactive-leds.umd.js` — UMD bundle (`require` / AMD / `<script>` global `reactiveLeds`)
- `reactive-leds.d.ts` — bundled type declarations (IDE autocomplete, no install needed — picked up via `types` in package.json)
- `daemon.worker.js` — module worker, loaded at runtime; keep it next to the bundle you serve

## Usage

### Connect

As an ES module:

```ts
import leds from "./build/reactive-leds.js"

await leds.begin("ws://localhost:8000")
```

Or as a classic script (UMD) — the API is available as the global `reactiveLeds`:

```html
<script src="./build/reactive-leds.umd.js"></script>
<script>
    reactiveLeds.begin("ws://localhost:8000")
</script>
```

> Need the device IPs? Run `rleds proxy` from the terminal — it prints the LAN scan at startup, copy the IPs into your code.

Pass `true` as a second argument to enable debug logs (`[Proxy]`, `[Worker]`, `[WS]`).

### LED control

Send colors to a device — fire-and-forget, no response expected:

```ts
// [pixel_index, r, g, b, w] per LED — 5 bytes per LED
const data = new Uint8Array([0, 255, 0, 0, 0])   // LED 0 → red
leds.setLEDs("192.168.X.Y", 4210, data)
```

For details on the data format see the [protocol docs](../shared/README.md#set_leds-format).

### Connect to a device

`connect` combines ping + getConfig in a single call and returns a handle with `send`:

```ts
const device = await leds.connect("192.168.X.Y")
if (device) {
    console.log(device.config.num_leds) // number of configured LEDs
    device.send(data)                   // equivalent to setLEDs
}
```

### Device status

```ts
const status = await leds.getStatus("192.168.X.Y")
// { uptime: 3600, heap: 180000, rssi: -62 }
```

### Other calls

```ts
await leds.ping("192.168.X.Y")       // true if the device responds
await leds.getConfig("192.168.X.Y")  // { pin, num_leds, port, hostname }
```

### sampleMatrix / sampleStrip — from canvas to LEDs

Both functions are designed for live coding: they take pixels from a canvas (or any RGBA source) and remap them onto a physical LED layout, via bilinear interpolation of a perspective-projected polygon. They share the same signature — pick the one matching your physical wiring.

```ts
// pixels: ImageData.data (RGBA, 4 bytes per pixel)
// pixelsSize: source image dimensions [width, height]
// grid: how the image is divided into cells [cols, rows]
// polygon: region of the grid mapped onto LEDs — vertices [TL, TR, BR, BL]
//          as (x0,y0, x1,y1, x2,y2, x3,y3) in grid coordinates
// steps: number of LEDs
// wa: white channel — fixed number, true = use source alpha, or function(r,g,b)=>w
const ledsData = leds.sampleMatrix(pixels, pixelsSize, grid, polygon, steps, wa)
leds.setLEDs("192.168.X.Y", 4210, ledsData)
```

`sampleMatrix` distributes LEDs in a 2D grid with a serpentine path (odd rows reversed), matching the typical physical wiring of LED matrix panels.

`sampleStrip` instead samples a single straight line along the centerline of the polygon — use it for a plain, non-zigzagging LED strip:

```ts
const ledsData = leds.sampleStrip(pixels, pixelsSize, grid, polygon, steps, wa)
```

## Notes

- Updates are sent over UDP and are designed for realtime use.
- Under sustained overload the firmware drops new UDP arrivals at the kernel (drop-tail) to bound staleness; in normal use frames are displayed within ~10 ms of arrival.

## Device provisioning

Before a device is reachable on the network it needs WiFi credentials. Use the CLI:

```bash
rleds bt-scan          # find unpaired devices via Bluetooth
rleds bt-credential    # send WiFi credentials over BLE
```

See [`cli/README.md`](../cli/README.md) for the full provisioning flow.

## Going beyond the API

The client exposes the most common operations. If you need lower-level access (e.g. `SET_CONFIG`, `RESET_WIFI`, `GET_VERSION`) you can use the proxy directly by sending raw binary packets — the format is documented in [`shared/README.md`](../shared/README.md).

## Links

- [Back to main README](../README.md)
