<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg" width="180">
  </picture>
</p>

[![Test shared](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![Test cli](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![Test client](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub last commit](https://img.shields.io/github/last-commit/genbs/reactive-leds)](https://github.com/genbs/reactive-leds/commits/master)

# Benvenuto su Reactive-LEDS

Language: [English](https://github.com/genbs/reactive-leds/blob/master/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/README-it.md)

## Introduzione

Questo progetto racconta la mia esperienza personale nella costruzione di un tubo LED stampato in 3D, controllabile via WiFi.

Nasce da un'esigenza personale, avevo bisogno di luci per le mie performance di live coding e da sviluppatore software e possessore di una stampante 3D mi sono divertito a creare un sistema che mi permettesse di controllare delle luci attraverso il browser con latenza minima e ad un costo contenuto.

Il firmware e i modelli 3D sono progettati sull'hardware che ho usato. Possono essere presi come punto di partenza e adattati alla propria configurazione.

## Risultato

[TBD:IMAGE]

L'attuale build è un tubo da 1 metro con una striscia FCOB a 24V, collegato ad un microcontrollore ESP32-S3, tutto alimentato da un alimentatore da 24V e controllabile via WebSocket o UDP.
Si possono creare tutte le strisce che si vogliono, basta collegarle alla stessa rete.

## Come funziona

Il flusso completo è questo:

```
browser
  → WebSocket → proxy CLI (ws)
    → UDP → ESP32-S3
      → periferica RMT
        → striscia LED
```

Il browser non può inviare UDP direttamente, quindi la CLI espone un proxy WebSocket locale che fa da ponte verso il dispositivo. L'ESP32 riceve i pacchetti UDP e aggiorna la striscia tramite la periferica RMT, che gestisce il segnale in hardware senza coinvolgere la CPU.

La prima volta il dispositivo si configura via USB dal [sito](https://genbs.github.io/reactive-leds/) o dalla [CLI](https://github.com/genbs/reactive-leds/tree/master/cli), oppure via BLE dalla [CLI](https://github.com/genbs/reactive-leds/tree/master/cli). Dopo il riavvio si connette alla rete e da quel momento è pronto a ricevere comandi.

## WLED e compatibilità

Ho iniziato a sviluppare il firmware per curiosità e per avere pieno controllo sul percorso realtime. Solo più tardi ho approfondito [WLED](https://kno.wled.ge/), che supporta il controllo UDP tramite DDP.

Nei test con ESP32-S3 e 16 segmenti, WLED e reactive-leds sono risultati ugualmente fluidi a 60 fps. Con flussi a 90 e 120 fps, WLED stock ha accorpato gli aggiornamenti mostrando circa 62 frame al secondo, mentre il firmware incluso ha mostrato tutti i frame senza drop. Per il normale utilizzo dal browser a 60 fps, questa differenza non è determinante.

WLED non è attualmente supportato. Se vorresti utilizzarlo con reactive-leds, apri una issue su GitHub o invia una pull request.

## Struttura del repository

Questo è un piccolo monorepo. Ogni area principale ha la propria cartella e il proprio README.

- [`firmware/`](https://github.com/genbs/reactive-leds/tree/master/firmware): Firmware ESP32-S3 e istruzioni di build.
- [`cli/`](https://github.com/genbs/reactive-leds/tree/master/cli): Strumenti CLI e script per configurare e testare i dispositivi ed avviare il server WebSocket di controllo.
- [`client/`](https://github.com/genbs/reactive-leds/tree/master/client): Client JavaScript per controllo real-time dal browser.
- [`shared/`](https://github.com/genbs/reactive-leds/tree/master/shared): Protocollo e tipi condivisi usati tra i pacchetti.
- [`3dprint/`](https://github.com/genbs/reactive-leds/tree/master/3dprint): Modelli STL e sorgenti CAD per il case e il binario LED.
- [`docs/`](https://github.com/genbs/reactive-leds/tree/master/docs): il [sito del progetto](https://genbs.github.io/reactive-leds/) (GitHub Pages): installazione guidata (CLI + flash del firmware dal browser via Web Serial), esempi live e tool di mapping delle strisce.

## Come iniziare

- Build/flash del firmware: vedi [`firmware/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/firmware/README-it.md).
- Installa la CLI per dialogare con i dispositivi: vedi [`cli/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/cli/README-it.md).
- Uso del client JavaScript: vedi [`client/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/client/README-it.md).
- Protocollo/tipi: vedi [`shared/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/shared/README-it.md).

## Materiali

- [Striscia LED FCOB 24V](https://it.aliexpress.com/item/1005007316659176.html)
- [Modulo DC-DC XL4015 (24V → 5V)](https://it.aliexpress.com/item/1005008231627584.html)
- [ESP32-S3](https://it.aliexpress.com/item/1005005045724400.html)
- [Alimentatore 24V](https://www.amazon.it/dp/B0C8CM7GS7)
- [Cavo di alimentazione](https://it.aliexpress.com/item/1005007046323657.html)
- [JST](https://it.aliexpress.com/item/1005005362711029.html) ([alternativa](https://it.aliexpress.com/item/1005004615616698.html)) seleziona la variante a 3 pin (VCC, GND, DATA)
- Resistenza da 330 Ω in serie sulla linea dati LED

Questi sono i materiali che ho usato, ma il progetto è adattabile a strisce e componenti simili. Assicurati solo di configurare correttamente il firmware per la tua striscia (ordine dei colori, numero di segmenti, ecc). I moduli ESP32-S3 con PSRAM vanno bene, ma la PSRAM non è necessaria per questo use case: il path realtime dei LED usa piccoli buffer in RAM interna.

## Stampa 3D

I modelli e impostazioni sono solo un punto di partenza, non sono un esperto di stampa 3D.
Il case è progettato per alloggiare l'ESP32-S3 e il modulo DC-DC elencati sopra, insieme a un profilo per striscia LED da 12mm.

Per il binario ho stampato cinque pezzi in PLA da 20 cm: cinque `profile`, oppure quattro `profile` più il `profile_head` opzionale. Per il diffusore ho usato quattro pezzi in PETG trasparente da 25 cm.

## Assemblaggio

[TBD:ASSEMBLY IMAGES]

1. Stampa i pezzi del case (`case/*.stl`) e del binario LED (`tube/*.stl`), vedi [`3dprint/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/3dprint/README-it.md) per materiali e impostazioni.
2. Salda la resistenza da 330 Ω sulla linea dati, il più vicino possibile all'inizio della striscia LED.
3. Collega alimentatore, modulo DC-DC, ESP32-S3 e striscia seguendo lo schema in [Cablaggio](https://github.com/genbs/reactive-leds/blob/master/firmware/README-it.md#cablaggio).
4. Inserisci ESP32-S3 e modulo DC-DC nel case, chiudi con `top`/`bottom`/`tap` — incolla i `tap` per evitare che il modulo DC-DC cada.
5. Incolla cinque pezzi per formare il binario da 1 m (`profile` × 5, oppure `profile` × 4 più `profile_head`), monta la striscia FCOB, poi incolla sopra i quattro pezzi `opal` come diffusore.
6. Flasha il firmware dal [sito del progetto](https://genbs.github.io/reactive-leds/) oppure vedi [`firmware/README-it.md`](https://github.com/genbs/reactive-leds/blob/master/firmware/README-it.md) e configura il Wi-Fi via USB o BLE con la [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README-it.md).

# Come trasportarle

Inizialmente le trasportavo in un telo di stoffa con degli elastici (immaginatevi un porta pastelli), ma non mi sentivo sicuro.
Ho deciso poi di creare un case in legno utilizzando come base questo [tutorial](https://www.youtube.com/watch?v=2dAB4Z64CAM). Ho stampato poi dei pezzi in PLA per fissare i tubi LED all'interno del case. Il case è abbastanza grande da contenere 12 tubi.

[TBD:CASE IMAGE]

## Limitazioni e problemi noti

- **Controllo a segmenti, non per LED**: la striscia FCOB ha 896 LED per metro ma solo 16 IC per metro. Il controllo avviene per segmento (16 segmenti/m), non per singolo LED. È una scelta consapevole: ho preferito una striscia più luminosa a scapito della risoluzione.
- **255 LED per device**: `num_leds` e `start_index` sono singoli byte nel protocollo UDP. Più che sufficienti per strisce a segmenti (~15 m di FCOB per device); non è pensato per pannelli a matrice ad alta densità.
- **Ordine dei colori**: la sequenza di byte RGB/WRGB dipende dall'IC della striscia. Il firmware è configurato per la striscia indicata nei Materiali. Strisce diverse potrebbero richiedere un ordine diverso (vedi `firmware/main/leds.c`).
- **WiFi sleep disabilitato**: la modalità risparmio energetico della radio WiFi è disabilitata esplicitamente per evitare picchi di latenza e perdita di pacchetti durante gli aggiornamenti real-time.
- **Credenziali WiFi in chiaro via BLE**: durante il provisioning le credenziali vengono inviate senza cifratura. Per un progetto personale la semplicità ha priorità, ma tienilo a mente se usi reti sensibili.

## Alimentazione e sicurezza

La striscia LED funziona a 24V. Il dimensionamento dell'alimentatore dipende dalle specifiche della striscia e dal carico reale — come riferimento, con tutti i LED accesi la striscia assorbe circa **1 A per metro**. Usa un alimentatore con margine adeguato e un cablaggio corretto.
