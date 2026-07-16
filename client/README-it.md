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

# Libreria Client

Language: [English](./README.md) | [Italiano](./README-it.md)

Client JavaScript per il controllo real-time dei LED via WiFi. È pensato per integrarsi con strumenti browser-based per visual interattive — live coding, installazioni, performance — ma funziona da qualsiasi runtime JS che supporti WebSocket.

⚠️ è necessario un proxy WebSocket locale per comunicare con i device, vedi [`cli/README-it.md`](../cli/README-it.md#proxy).

## Installazione

```bash
npm install @reactive-leds/client
```

```ts
import leds from "@reactive-leds/client"

await leds.begin("ws://localhost:8000")
```

Oppure senza installare niente, direttamente da CDN:

```ts
import leds from "https://cdn.jsdelivr.net/npm/@reactive-leds/client/build/reactive-leds.js"
```

Per pagine riproducibili, pinna una versione pubblicata:

```ts
import leds from "https://cdn.jsdelivr.net/npm/@reactive-leds/client@1.0.0/build/reactive-leds.js"
```

## Build (da un checkout del repository)

```bash
npm install
npm run build
```

Produce quattro artefatti in `build/`:

- `reactive-leds.js` — bundle ESM (`import` / `<script type="module">`)
- `reactive-leds.umd.js` — bundle UMD (`require` / AMD / `<script>` con global `rleds`; `reactiveLeds` resta disponibile come alias)
- `reactive-leds.d.ts` — dichiarazioni di tipo bundlate (autocompletamento IDE, agganciate via `types` nel package.json)
- `daemon.worker.js` — module worker, caricato a runtime; tienilo accanto al bundle che servi

## Utilizzo

### Connessione

Come modulo ES:

```ts
import leds from "<path-to-reactive-leds>"

await leds.begin("ws://localhost:8000")
```

> Lanciando dalla [cli](../cli/README-it.md) `rleds proxy` dal terminale verranno stampati i risultati dello scan della LAN all'avvio, puoi copiare gli IP nel tuo codice.

Passa `true` come secondo argomento per abilitare i log di debug (`[Proxy]`, `[Worker]`, `[WS]`).

### Connessione a un device

`connect` combina ping + getConfig in un'unica chiamata e restituisce un handle con `send`:

```ts
const device = await leds.connect("192.168.X.Y")
if (device) {
	console.log(device.config.num_leds) // numero di LED configurati
	device.send(data) // equivalente a setLEDs — per `data` vedi «Controllo LED»
}
```

Ogni `Device` connesso contiene anche un buffer `data` riutilizzabile e il metodo `sample()`. Un semplice `connect()` mappa l'intero frame sorgente; usa `mapping()` per posizionare più strisce.

### Stato del device

```ts
const info = await leds.getInfo("192.168.X.Y")
// { ip: "192.168.X.Y", port: 4210, mac: "A0:85:E3:E0:9F:54", version: "v0.1.0", hostname: "esp32-7" }

const status = await leds.getStatus("192.168.X.Y")
// { uptime: 3600, heap: 180000, rssi: -62 }
// I firmware più recenti possono includere anche metriche memoria/frame:
// { internalHeap, largestHeapBlock, minHeap, framesReceived, framesShown, framesDropped, udpPacketsRead, protocolLoopMaxGapMs }
```

### Controllo LED

Invia colori a un device — fire-and-forget, nessuna risposta attesa:

```ts
// [r, g, b, w] per ogni LED — 4 byte per LED
const data = new Uint8Array([255, 0, 0, 0]) // rosso
leds.setLEDs("192.168.X.Y", 4210, data)

// Aggiorna solo il LED 2, senza modificare gli altri
leds.setLEDs("192.168.X.Y", 4210, data, 2)
```

Per i dettagli sul formato consulta il [protocollo](../shared/README-it.md#formato-set_leds).

### Altre chiamate

```ts
await leds.ping("192.168.X.Y") // true se il device risponde
await leds.getConfig("192.168.X.Y") // { pin, num_leds, port, hostname }
```

### Connessione di un mapping

Il tool di Mapping esporta un oggetto serializzabile che associa ogni indirizzo al suo poligono. `mapping()` connette tutti i device raggiungibili, legge il numero di LED dalla configurazione live e crea un buffer riutilizzabile per ogni device:

```ts
const mapping = {
	grid: [8, 16],
	devices: {
		"192.168.0.10:4210": [0, 16, 1, 16, 1, 0, 0, 0],
		"192.168.0.7:4210": [1, 16, 3, 16, 3, 0, 1, 0],
	},
} as const

const devices = await leds.mapping(mapping)

devices.frame(pixels, width, height)
```

I device non raggiungibili vengono esclusi. `devices.frame()` campiona e invia tutti i device riutilizzando ogni buffer `device.data`, senza allocare buffer LED a ogni frame.

`ImageData` contiene già le proprie dimensioni, quindi può essere campionato direttamente:

```ts
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
devices.frame(imageData)
```

I buffer WebGL raw continuano a richiedere le dimensioni esplicite: `devices.frame(pixels, width, height)`.

### sample — da canvas a LED

Pensata per il live coding: prende i pixel di un canvas (o qualsiasi sorgente RGBA) e li rimappa sulla striscia, tramite interpolazione bilineare di un poligono con proiezione prospettica.

```ts
// da un canvas: estrai i pixel una volta per frame
const ctx = canvas.getContext("2d", { willReadFrequently: true })
const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

// pixels: ImageData.data (RGBA, 4 byte per pixel)
// pixelsSize: dimensioni dell'immagine sorgente [width, height]
// grid: come è divisa l'immagine in celle [cols, rows]
// polygon: regione della griglia mappata sui LED — vertici [TL, TR, BR, BL]
//          in coordinate griglia come (x0,y0, x1,y1, x2,y2, x3,y3)
// steps: numero di LED
// wa: canale bianco — numero fisso, true = usa alpha sorgente, oppure funzione(r,g,b)=>w
const ledsData = leds.sample(pixels, [canvas.width, canvas.height], grid, polygon, steps, wa)
leds.setLEDs("192.168.X.Y", 4210, ledsData)
```

La striscia viene letta come una singola linea lungo la centerline del poligono, dal bordo di partenza (TL→TR) al bordo di arrivo (BL→BR) — per farla correre in orizzontale, ruota il poligono così che il bordo di partenza stia a sinistra. La larghezza del poligono non conta: viene campionata solo la centerline. Poligoni storti, ruotati o in prospettiva funzionano tutti.

> Suggerimento: il [tool di Mapping](https://genbs.github.io/reactive-leds/) sul sito del progetto disegna i poligoni per te ed esporta uno snippet pronto all'uso.

## Note

- Gli aggiornamenti sono inviati via UDP — pensati per uso realtime.
- Sotto carico sostenuto il firmware droppa i nuovi arrivi UDP al kernel (drop-tail) per limitare la staleness. Su una rete WiFi locale pulita, il path firmware/RMT è normalmente abbastanza veloce per 60 fps; usa `rleds benchmark` per misurare il tuo setup invece di trattare un numero fisso di latenza come garanzia.

## Provisioning del device

Prima di essere raggiungibile in rete, il device ha bisogno delle credenziali WiFi. Usa la CLI:

```bash
rleds bt-scan          # trova i device non ancora configurati via Bluetooth
rleds bt-credential    # invia le credenziali WiFi via BLE
```

Vedi [`cli/README-it.md`](../cli/README-it.md) per il flusso completo di provisioning.

## Oltre le API

Il client espone le operazioni più comuni. Per i tipi di pacchetto che l'API non copre (es. `SET_CONFIG`, `RESET_WIFI`) ci sono `sendRaw` e `sendRawSync`, che accettano qualsiasi `PacketType`:

```ts
import leds, { PacketType } from "@reactive-leds/client"

// richiesta/risposta: risolve con [status] (1 = OK) o con i byte del payload
const ok = await leds.sendRawSync("192.168.X.Y", 4210, PacketType.RESET_WIFI)

// fire-and-forget, nessuna risposta attesa
leds.sendRaw("192.168.X.Y", 4210, PacketType.SET_LEDS, new Uint8Array([0, ...data]))
```

Anche l'handle di `connect` li espone, senza ripetere ip e porta: `device.sendRaw(type, data?)` e `device.sendRawSync(type, data?)`. Il formato dei pacchetti è documentato in [`shared/README-it.md`](../shared/README-it.md).

## Link

- [Torna al README principale](../README-it.md)
