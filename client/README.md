# Client Library

Language: [English](./README.md) | [Italiano](./README-it.md)

JavaScript client for realtime LED control over WiFi. Designed to integrate with browser-based tools for interactive visuals — live coding, installations, performances — but works from any JS runtime that supports WebSocket.

## Build

```bash
npm install
npm run build   # produces build/reactive-leds.js and build/daemon.worker.js
```

## Usage

### Connect

```ts
import leds from "./build/reactive-leds.js"

await leds.begin("ws://localhost:8000")
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

### mapPixels — from canvas to LEDs

`mapPixels` is designed for live coding: it takes pixels from a canvas (or any RGBA source) and remaps them onto a physical LED strip, handling the serpentine layout and perspective projection via bilinear interpolation.

```ts
// pixels: ImageData.data (RGBA, 4 bytes per pixel)
// pixelsSize: source image dimensions [width, height]
// grid: how the image is divided into cells [cols, rows]
// polygon: region of the grid mapped onto LEDs — vertices [TL, TR, BR, BL]
//          as (x0,y0, x1,y1, x2,y2, x3,y3) in grid coordinates
// steps: number of LEDs
// wa: white channel — fixed number, true = use source alpha, or function(r,g,b)=>w
const ledsData = leds.mapPixels(pixels, pixelsSize, grid, polygon, steps, wa)
leds.setLEDs("192.168.X.Y", 4210, ledsData)
```

LEDs are distributed in a 2D grid with a serpentine path (odd rows reversed), matching the typical physical wiring of LED panels.

## Notes

- Updates are sent over UDP and are designed for realtime use.
- Under sustained overload the firmware drops new UDP arrivals at the kernel (drop-tail) to bound staleness; in normal use frames are displayed within ~10 ms of arrival.

## Links

- [Back to main README](../README.md)
