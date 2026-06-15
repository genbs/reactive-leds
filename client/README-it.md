# Libreria Client

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/client)](https://www.npmjs.com/package/@reactive-leds/client)

Language: [English](./README.md) | [Italiano](./README-it.md)

Client JavaScript per il controllo real-time dei LED via WiFi. È pensato per integrarsi con strumenti browser-based per visual interattive — live coding, installazioni, performance — ma funziona da qualsiasi runtime JS che supporti WebSocket.

## Build

```bash
npm install
npm run build
```

Produce quattro artefatti in `build/`:

- `reactive-leds.js` — bundle ESM (`import` / `<script type="module">`)
- `reactive-leds.umd.js` — bundle UMD (`require` / AMD / `<script>` con global `reactiveLeds`)
- `reactive-leds.d.ts` — dichiarazioni di tipo bundlate (autocompletamento IDE, agganciate via `types` nel package.json)
- `daemon.worker.js` — module worker, caricato a runtime; tienilo accanto al bundle che servi

## Utilizzo

### Connessione

Come modulo ES:

```ts
import leds from "./build/reactive-leds.js"

await leds.begin("ws://localhost:8000")
```

Oppure come script classico (UMD) — l'API è disponibile nel global `reactiveLeds`:

```html
<script src="./build/reactive-leds.umd.js"></script>
<script>
    reactiveLeds.begin("ws://localhost:8000")
</script>
```

> Lanciando dalla [cli](../cli/README-it.md) `rleds proxy` dal terminale verranno stampati i risultati dello scan della LAN all'avvio, puoi copiare gli IP nel tuo codice.

Passa `true` come secondo argomento per abilitare i log di debug (`[Proxy]`, `[Worker]`, `[WS]`).

### Controllo LED

Invia colori a un device — fire-and-forget, nessuna risposta attesa:

```ts
// [pixel_index, r, g, b, w] per ogni LED — 5 byte per LED
const data = new Uint8Array([0, 255, 0, 0, 0]) // LED 0 → rosso
leds.setLEDs("192.168.X.Y", 4210, data)
```

Per i dettagli sul formato consulta il [protocollo](../shared/README-it.md#formato-set_leds).

### Connessione a un device

`connect` combina ping + getConfig in un'unica chiamata e restituisce un handle con `send`:

```ts
const device = await leds.connect("192.168.X.Y")
if (device) {
	console.log(device.config.num_leds) // numero di LED configurati
	device.send(data) // equivalente a setLEDs
}
```

### Stato del device

```ts
const status = await leds.getStatus("192.168.X.Y")
// { uptime: 3600, heap: 180000, rssi: -62 }
```

### Altre chiamate

```ts
await leds.ping("192.168.X.Y") // true se il device risponde
await leds.getConfig("192.168.X.Y") // { pin, num_leds, port, hostname }
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

## Provisioning del device

Prima di essere raggiungibile in rete, il device ha bisogno delle credenziali WiFi. Usa la CLI:

```bash
rleds bt-scan          # trova i device non ancora configurati via Bluetooth
rleds bt-credential    # invia le credenziali WiFi via BLE
```

Vedi [`cli/README-it.md`](../cli/README-it.md) per il flusso completo di provisioning.

## Oltre le API

Il client espone le operazioni più comuni. Se hai bisogno di accesso più basso (es. `SET_CONFIG`, `RESET_WIFI`, `GET_VERSION`) puoi usare il proxy direttamente inviando pacchetti binari raw — il formato è documentato in [`shared/README-it.md`](../shared/README-it.md).

## Link

- [Torna al README principale](../README-it.md)
