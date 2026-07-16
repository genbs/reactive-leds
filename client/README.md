<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/client)](https://www.npmjs.com/package/@reactive-leds/client)

# Client Library

Language: [English](./README.md) | [Italiano](./README-it.md)

JavaScript client for real-time LED control over WiFi. It is designed to integrate with browser-based tools for interactive visuals — live coding, installations, performances — but it works from any JS runtime that supports WebSocket.

⚠️ a local WebSocket proxy is required to talk to the devices, see [`cli/README.md`](../cli/README.md#proxy).

## Installation

```bash
npm install @reactive-leds/client
```

```ts
import leds from "@reactive-leds/client"

await leds.begin("ws://localhost:8000")
```

Or without installing anything, straight from a CDN:

```ts
import leds from "https://cdn.jsdelivr.net/npm/@reactive-leds/client/build/reactive-leds.js"
```

For reproducible pages, pin a published version:

```ts
import leds from "https://cdn.jsdelivr.net/npm/@reactive-leds/client@1.0.0/build/reactive-leds.js"
```

## Build (from a repository checkout)

```bash
npm install
npm run build
```

Produces four artifacts in `build/`:

- `reactive-leds.js` — ESM bundle (`import` / `<script type="module">`)
- `reactive-leds.umd.js` — UMD bundle (`require` / AMD / `<script>` with the `reactiveLeds` global)
- `reactive-leds.d.ts` — bundled type declarations (IDE autocompletion, wired via `types` in package.json)
- `daemon.worker.js` — module worker, loaded at runtime; keep it next to the bundle you serve

## Usage

### Connecting

As an ES module:

```ts
import leds from "<path-to-reactive-leds>"

await leds.begin("ws://localhost:8000")
```

> Running `rleds proxy` from the [cli](../cli/README.md) prints the LAN scan results at startup — you can copy the IPs into your code.

Pass `true` as the second argument to enable debug logs (`[Proxy]`, `[Worker]`, `[WS]`).

### Connecting to a device

`connect` combines ping + getConfig into a single call and returns a handle with `send`:

```ts
const device = await leds.connect("192.168.X.Y")
if (device) {
	console.log(device.config.num_leds) // number of configured LEDs
	device.send(data) // same as setLEDs — for `data` see "LED control"
}
```

### Device state

```ts
const info = await leds.getInfo("192.168.X.Y")
// { ip: "192.168.X.Y", port: 4210, mac: "A0:85:E3:E0:9F:54", version: "v0.1.0", hostname: "esp32-7" }

const status = await leds.getStatus("192.168.X.Y")
// { uptime: 3600, heap: 180000, rssi: -62 }
// Newer firmwares may also include memory/frame metrics:
// { internalHeap, largestHeapBlock, minHeap, framesReceived, framesShown, framesDropped, udpPacketsRead, protocolLoopMaxGapMs }
```

### LED control

Send colors to a device — fire-and-forget, no response expected:

```ts
// [r, g, b, w] per LED — 4 bytes per LED
const data = new Uint8Array([255, 0, 0, 0]) // red
leds.setLEDs("192.168.X.Y", 4210, data)

// Update LED 2 only, leaving the others unchanged
leds.setLEDs("192.168.X.Y", 4210, data, 2)
```

For the format details see the [protocol](../shared/README.md#set_leds-format).

### Other calls

```ts
await leds.ping("192.168.X.Y") // true if the device responds
await leds.getConfig("192.168.X.Y") // { pin, num_leds, port, hostname }
```

### sample — canvas to LEDs

Built for live coding: it takes the pixels of a canvas (or any RGBA source) and remaps them onto the strip, through bilinear interpolation of a polygon with perspective projection.

```ts
// from a canvas: extract the pixels once per frame
const ctx = canvas.getContext("2d", { willReadFrequently: true })
const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

// pixels: ImageData.data (RGBA, 4 bytes per pixel)
// pixelsSize: source image size [width, height]
// grid: how the image is divided into cells [cols, rows]
// polygon: region of the grid mapped onto the LEDs — vertices [TL, TR, BR, BL]
//          in grid coordinates as (x0,y0, x1,y1, x2,y2, x3,y3)
// steps: number of LEDs
// wa: white channel — fixed number, true = use source alpha, or a function(r,g,b)=>w
const ledsData = leds.sample(pixels, [canvas.width, canvas.height], grid, polygon, steps, wa)
leds.setLEDs("192.168.X.Y", 4210, ledsData)
```

The strip is read as a single line along the polygon's centerline, from the start edge (TL→TR) to the end edge (BL→BR) — to run it horizontally, rotate the polygon so the start edge sits on the left. The polygon's width does not matter: only the centerline is sampled. Skewed, rotated or perspective-distorted polygons all work.

> Tip: the [Mapping tool](https://genbs.github.io/reactive-leds/) on the project site draws the polygons for you and exports a ready-to-use snippet.

## Notes

- Updates are sent over UDP — designed for realtime use.
- Under sustained load the firmware drops new UDP arrivals at the kernel (drop-tail) to bound staleness. On a clean local WiFi network the firmware/RMT path is normally fast enough for 60 fps; use `rleds benchmark` to measure your own setup instead of treating a fixed latency figure as a guarantee.

## Device provisioning

Before it is reachable on the network, the device needs WiFi credentials. Use the CLI:

```bash
rleds bt-scan          # find not-yet-configured devices over Bluetooth
rleds bt-credential    # send the WiFi credentials over BLE
```

See [`cli/README.md`](../cli/README.md) for the full provisioning flow.

## Beyond the API

The client exposes the most common operations. For the packet types the API does not cover (e.g. `SET_CONFIG`, `RESET_WIFI`) there are `sendRaw` and `sendRawSync`, which accept any `PacketType`:

```ts
import leds, { PacketType } from "@reactive-leds/client"

// request/response: resolves with [status] (1 = OK) or with the payload bytes
const ok = await leds.sendRawSync("192.168.X.Y", 4210, PacketType.RESET_WIFI)

// fire-and-forget, no response expected
leds.sendRaw("192.168.X.Y", 4210, PacketType.SET_LEDS, new Uint8Array([0, ...data]))
```

The `connect` handle exposes them too, without repeating ip and port: `device.sendRaw(type, data?)` and `device.sendRawSync(type, data?)`. The packet format is documented in [`shared/README.md`](../shared/README.md).

## Links

- [Back to the main README](../README.md)
