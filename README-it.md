# reactive-leds

[![Test shared](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![Test cli](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![Test client](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub last commit](https://img.shields.io/github/last-commit/genbs/reactive-leds)](https://github.com/genbs/reactive-leds/commits/master)

Language: [English](./README.md) | [Italiano](./README-it.md)

## Introduzione

Questo progetto racconta la mia esperienza personale nella costruzione di un tubo LED stampato in 3D, controllabile via WiFi in real-time.

Nasce da un'esigenza personale, avevo bisogno di luci per le mie performance di live coding e da sviluppatore software e possessore di una stampante 3D mi sono divertito a creare un sistema che mi permettesse di controllare delle luci attraverso il browser con latenza minima.

Il firmware e i modelli 3D sono progettati sull'hardware che ho usato. Possono essere presi come punto di partenza e adattati alla propria configurazione.

Se stai cercando un controller LED per uso domestico, [WLED](https://kno.wled.ge/) è la scelta giusta: maturo, ricco di funzionalità e con un'ampia community.

## Risultato

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

La prima volta il dispositivo si configura via BLE: un comando CLI manda le credenziali WiFi al dispositivo via Bluetooth. Dopo il riavvio il dispositivo si connette alla rete e da quel momento è pronto a ricevere comandi.

## Struttura del Repository

Questo e' un piccolo monorepo. Ogni area principale ha la propria cartella e il proprio README.

- `firmware/`: Firmware ESP32-S3 e istruzioni di build.
- `cli/`: Strumenti CLI e script per configurare e testare i dispositivi ed avviare il server WebSocket di controllo.
- `client/`: Client JavaScript per controllo real-time dal browser.
- `shared/`: Protocollo e tipi condivisi usati tra i pacchetti.
- `3dprint/`: Modelli STL e sorgenti CAD.

## Come Iniziare

- Build/flash del firmware: vedi [`firmware/README-it.md`](firmware/README-it.md).
- Strumenti CLI per i test: vedi [`cli/README-it.md`](cli/README-it.md).
- Uso del client JavaScript: vedi [`client/README-it.md`](client/README-it.md).
- Protocollo/tipi: vedi [`shared/README-it.md`](shared/README-it.md).

## Materiali

- [Striscia LED FCOB 24V](https://it.aliexpress.com/item/1005007316659176.html)
- [Modulo DC-DC XL4015 (24V → 5V)](https://it.aliexpress.com/item/1005008231627584.html)
- [ESP32-S3](https://it.aliexpress.com/item/1005005045724400.html)
- [Alimentatore 24V](https://www.amazon.it/dp/B0C8CM7GS7)
- [Cavo di alimentazione](https://it.aliexpress.com/item/1005007046323657.html)
- [JST](https://it.aliexpress.com/item/1005005362711029.html) ([alternativa](https://it.aliexpress.com/item/1005004615616698.html))
- Resistenza da 330 Ω in serie sulla linea dati LED

Questi sono i materiali che ho usato, ma il progetto è adattabile a strisce e componenti simili. Assicurati solo di configurare correttamente il firmware per la tua striscia (ordine dei colori, numero di segmenti, ecc).

## Stampa 3D

I modelli e impostazioni sono solo un punto di partenza, non sono un esperto di stampa 3D.
Il case è progettato per alloggiare l'ESP32-S3 e il modulo DC-DC elencati sopra, insieme a un profilo per striscia LED da 12mm.

Per il profilo ho stampato 5 pezzi in PLA, ciascuno lungo 20 cm. Per la barra diffusore ho usato PETG trasparente, con pezzi da 25 cm.

## Limitazioni e problemi noti

- **Controllo a segmenti, non per LED**: la striscia FCOB ha 896 LED per metro ma solo 16 IC per metro. Il controllo avviene per segmento (16 segmenti/m), non per singolo LED. È una scelta consapevole: ho preferito una striscia più luminosa a scapito della risoluzione.
- **Ordine dei colori**: la sequenza di byte RGB/WRGB dipende dall'IC della striscia. Il firmware è configurato per la striscia indicata nei Materiali. Strisce diverse potrebbero richiedere un ordine diverso (vedi `firmware/main/leds.c`).
- **WiFi sleep disabilitato**: la modalità risparmio energetico della radio WiFi è disabilitata esplicitamente per evitare picchi di latenza e perdita di pacchetti durante gli aggiornamenti real-time.
- **Credenziali WiFi in chiaro via BLE**: durante il provisioning le credenziali vengono inviate senza cifratura. Per un progetto personale la semplicità ha priorità, ma tienilo a mente se usi reti sensibili.

## Alimentazione e sicurezza

La striscia LED funziona a 24V. Il dimensionamento dell'alimentatore dipende dalle specifiche della striscia e dal carico reale. Usa un alimentatore con margine adeguato e un cablaggio corretto.
Metti la resistenza da 330 Ω in serie sulla linea dati tra ESP32 e striscia, il più vicino possibile alla striscia.
