# GydraLEDs Lib

connect to server:

```ts
const isConnected = await gydraLEDs.begin("ws://localhost:8080" /*, debug = false */)
```

check if a device is alive:

```ts
const ping = await gydraLEDs.ping("192.168.X.Y" /*, port = 4210 */)
```

get config of a device:

```ts
const config = await gydraLEDs.getConfig("192.168.X.Y" /*, port = 4210 */)
```

set leds request for a device:

```ts
const setLeds = await gydraLEDs.setLeds("192.168.X.Y", 4210, new Uint8Array([0 /* pixel_index */, 255, 0, 0])) // Example for red color for led 0
```
