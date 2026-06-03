# Libreria Client

Language: [English](./README.md) | [Italiano](./README-it.md)

Client JavaScript per il controllo realtime dei LED via WiFi. È pensato per integrarsi con strumenti browser-based per visual interattive — live coding, installazioni, performance — ma funziona da qualsiasi runtime JS che supporti WebSocket.

## Build

```bash
npm install
npm run build   # produce build/reactive-leds.js e build/daemon.worker.js
```

## Utilizzo

### Connessione

```ts
import leds from "./build/reactive-leds.js"

await leds.begin("ws://localhost:8000")
```

> Ti servono gli IP dei device? Lancia `rleds proxy` dal terminale — stampa lo scan della LAN all'avvio, copia gli IP nel tuo codice.

Passa `true` come secondo argomento per abilitare i log di debug (`[Proxy]`, `[Worker]`, `[WS]`).

### Controllo LED

Invia colori a un device — fire-and-forget, nessuna risposta attesa:

```ts
// [pixel_index, r, g, b, w] per ogni LED — 5 byte per LED
const data = new Uint8Array([0, 255, 0, 0, 0])   // LED 0 → rosso
leds.setLEDs("192.168.X.Y", 4210, data)
```

Per i dettagli sul formato consulta il [protocollo](../shared/README-it.md#formato-set_leds).

### Connessione a un device

`connect` combina ping + getConfig in un'unica chiamata e restituisce un handle con `send`:

```ts
const device = await leds.connect("192.168.X.Y")
if (device) {
    console.log(device.config.num_leds) // numero di LED configurati
    device.send(data)                   // equivalente a setLEDs
}
```

### Stato del device

```ts
const status = await leds.getStatus("192.168.X.Y")
// { uptime: 3600, heap: 180000, rssi: -62 }
```

### Altre chiamate

```ts
await leds.ping("192.168.X.Y")          // true se il device risponde
await leds.getConfig("192.168.X.Y")     // { pin, num_leds, port, hostname }
```

### mapPixels — da canvas a LED

`mapPixels` è la funzione pensata per il live coding: prende i pixel di un canvas (o qualsiasi sorgente RGBA) e li rimappa su una striscia LED fisica, gestendo il layout a serpentina e la proiezione prospettica tramite interpolazione bilineare.

```ts
// pixels: ImageData.data (RGBA, 4 byte per pixel)
// pixelsSize: dimensioni dell'immagine sorgente [width, height]
// grid: come è divisa l'immagine in celle [cols, rows]
// polygon: regione della griglia mappata sui LED — vertici [TL, TR, BR, BL]
//          in coordinate griglia come (x0,y0, x1,y1, x2,y2, x3,y3)
// steps: numero di LED
// wa: canale bianco — numero fisso, true = usa alpha sorgente, oppure funzione(r,g,b)=>w
const ledsData = leds.mapPixels(pixels, pixelsSize, grid, polygon, steps, wa)
leds.setLEDs("192.168.X.Y", 4210, ledsData)
```

I LED sono distribuiti in una griglia 2D con percorso a serpentina (righe dispari invertite), che rispecchia il cablaggio fisico tipico dei pannelli LED.

## Note

- Gli aggiornamenti sono inviati via UDP — pensati per uso realtime.
- Sotto carico sostenuto il firmware droppa i nuovi arrivi UDP al kernel (drop-tail) per limitare la staleness; in uso normale i frame vengono mostrati entro ~10 ms dall'arrivo.

## Link

- [Torna al README principale](../README-it.md)
