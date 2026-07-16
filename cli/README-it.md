<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/cli)](https://www.npmjs.com/package/@reactive-leds/cli)

# CLI

Language: [English](./README.md) | [Italiano](./README-it.md)

Questo pacchetto è la CLI per interagire con i dispositivi `reactive-leds` in rete.
Con il comando `rleds` si potrà dialogare con i device, effettuare il provisioning BLE ed avviare il proxy WebSocket — tutto dal terminale.

## Avvio Rapido

> L'installazione guidata (CLI + flash del firmware dal browser) è anche sul [sito del progetto](https://genbs.github.io/reactive-leds/) — nessun clone del repository necessario.

Da npm:

```bash
npm install -g @reactive-leds/cli
rleds <comando>
```

Oppure dal repository:

```bash
npm install
npm link       # rende disponibile il comando rleds globalmente
rleds <comando>
```

## Flag globali

- `--version` / `-v` — stampa la versione della CLI ed esce.
- `--help` / `-h` — stampa la lista dei comandi (equivalente a lanciare `rleds` senza argomenti).

## Comandi

- `scan [port] [timeout_ms]` - scopre dispositivi nella LAN tramite UDP broadcast. Ogni risultato include anche l'hostname del device (dalla sua config), così puoi associare l'IP all'etichetta che hai messo sul case. Il risultato è cacheato su disco (`/tmp/reactive-leds-scan.json` su macOS/Linux) per velocizzare i comandi successivi (invalidato dopo 5 minuti).
- `ping [target]` - verifica se un dispositivo è online. Usa `all` o ometti `target` per pingare tutti i device scoperti.
- `reset-wifi [target]` - cancella le credenziali Wi-Fi. Usa `all` o ometti `target` per applicare a tutti i device scoperti.
- `config <target> [key] [value]` - legge o aggiorna la configurazione. `target` è `host`, `host:port`, `all` o `all:port`. In scrittura riavvia il device (~5 s offline prima del recovery). Chiavi supportate: `hostname` (stringa, max 32 caratteri), `pin` (GPIO output `0..21` o `26..48`), `num_leds` (`1..255`), `port` (porta UDP `1024..65535`).
- `leds <target> <leds_package>` - invia aggiornamenti LED. Il pacchetto è una lista di valori separati da virgole in gruppi di 5: `<led_index>,<r>,<g>,<b>,<w>` (w = bianco/luminosità). Si possono controllare più LED concatenando gruppi: `0,255,0,0,0,1,0,128,128,0`. Ogni valore tra 0 e 255.
- `bt-scan` - scansione dispositivi via Bluetooth.
- `bt-credential [indexOrHost] [ssid]` - invia credenziali Wi-Fi via Bluetooth. Se `indexOrHost` è omesso, parte in modalità interattiva: mostra la lista dei dispositivi trovati e chiede quale selezionare (per indice numerico o nome). Se `ssid` è omesso, lo chiede al prompt (la password viene chiesta sempre, nascosta). Se `indexOrHost` è un numero, viene usato come indice della lista `bt-scan` (1-based).
- `proxy [host] [port] [device_port]` - avvia il proxy WebSocket tra client browser e firmware. `port` è la porta locale del WebSocket; `device_port` è la porta UDP del firmware (`1024..65535`). Scansiona la LAN ogni 10 secondi e mostra i device trovati in tempo reale — IP, hostname, MAC riportato dal firmware e RSSI live quando disponibili. Su macOS, avvisa solo quando AWDL (AirDrop/AirPlay) è attiva, perché può causare micro-lag durante lo streaming (vedi Troubleshooting).
- `benchmark <target> [fps] [duration] [format]` - misura RTT e invia frame LED temporizzati a un singolo device, riportando consegna, jitter e drop. `format` è `text` o `json`. Default: `fps=60`, `duration=30`, `format=text`.
- `rainbow [target] [seconds] [speed]` - effetto arcobaleno che scorre sulla strip. Usa `all` o ometti `target` per applicare a tutti i device scoperti.
- `color [target] [r] [g] [b] [w]` - imposta un colore solido su tutti i LED. Se `r g b` sono omessi usa un colore casuale. Usa `all` o ometti `target` per applicare a tutti i device scoperti.
- `off [target]` - spegne tutti i LED. Usa `all` o ometti `target` per applicare a tutti i device scoperti.
- `status [target]` - legge lo stato del device (uptime, heap, RSSI WiFi e contatori frame runtime). Usa `all` o ometti `target` per interrogare tutti i device scoperti.
- `version [target]` - legge la versione firmware (da `PROJECT_VER` / `git describe`). Usa `all` o ometti `target` per interrogare tutti i device scoperti.
- `clear-cache` - elimina la cache dello scan su disco (`/tmp/reactive-leds-scan.json`). Utile quando hai aggiunto/spostato un device, cambiato rete Wi-Fi, o vuoi semplicemente forzare una nuova discovery al prossimo comando. `config` con scrittura pulisce automaticamente la cache (visto che riavvia il device).

## Esempi (minimi)

```bash
rleds scan
rleds ping 192.168.1.10
rleds config 192.168.1.10 hostname tube-1
rleds leds 192.168.1.10 0,255,0,0,0
rleds bt-scan
rleds bt-credential
rleds proxy
rleds benchmark 192.168.1.10 60 120
rleds benchmark 192.168.1.10 60 120 json > run.json
rleds rainbow 192.168.1.10 10 1
rleds color
rleds color all 255 0 0
rleds color 192.168.1.10 255 0 0 0
```

## Proxy

I browser non possono inviare pacchetti UDP direttamente. `rleds proxy` avvia un server WebSocket locale che fa da ponte browser ↔ device:

```
browser (WebSocket) → proxy → device (UDP)
```

Usa il protocollo binario multiplexato consumato da `@reactive-leds/client`. Le risposte WS hanno formato `[requestId, ...payload]` (senza byte `PacketType`): il browser le abbina alla richiesta tramite il `requestId`. Wire format del protocollo device documentato in [`shared/README-it.md`](../shared/README-it.md).

Il proxy scansiona la LAN ogni 10 secondi e aggiorna la lista dei device in tempo reale — utile per vedere quando un device si connette o si disconnette:

```
$ rleds proxy
Proxy: ws://0.0.0.0:8000  devices: 1

  esp32-X (192.168.X.X:4210) AA:BB:CC:DD:EE:FF  rssi -55 dBm
```

## Benchmark

`rleds benchmark <target> [fps] [duration] [format]` esegue prima 1000 ping sequenziali, poi invia frame `SET_LEDS` temporizzati a un singolo device e confronta i tentativi lato host con i contatori del firmware. Usa `format=json` per conservare parametri, status, delta e metriche derivate.

Leggi l'output così:

- `Host attempted`: frame che la CLI ha provato a schedulare.
- `Host scheduler`: indica se il dispositivo che esegue la CLI era in ritardo. `frames >5ms late` conta quanti frame sono partiti con più di 5 ms di ritardo; `max-late` è il ritardo peggiore. Se questo dato è brutto, il collo di bottiglia è il sender.
- `RTT`: ping ricevuti e percentili p50, p95, p99 e massimo.
- `quality` / `score`: valutazione sintetica della run. Lo score parte da `100` e perde punti per pacchetti persi, gap lunghi, drop RMT, riordini, beacon timeout o disconnessioni.
- `send-ok` / `send-errors`: invii UDP accettati o rifiutati dall'OS locale.
- `firmware udp-read`: pacchetti UDP letti durante lo stream, esclusa la richiesta di status finale.
- `device recv`: frame `SET_LEDS` validi ricevuti dal firmware.
- `shown`: frame passati al driver LED.
- `shown-rate`: frame passati al driver LED divisi per la durata reale della run.
- `dropped` / `rmt-drop-rate`: frame saltati perché il trasferimento RMT precedente era ancora occupato. A frame rate normali dovrebbe restare a `0.000%`.
- `set-leds`: `device recv / attempted`. È il numero principale per la consegna dei frame LED.
- `arrival-gaps`: distanza tra pacchetti `SET_LEDS` tracciati dal benchmark. A 60 fps la maggior parte dovrebbe stare in `≤20ms`; molti gap `>100ms` indicano stutter visibile.
- `max`: gap di arrivo più alto visto durante la run corrente; se è alto ma `seq-lost` resta basso, i pacchetti sono arrivati in ritardo o a raffica più che persi.
- `seq-lost`: ID frame del benchmark che non sono mai arrivati al firmware. Se `arrival-gaps` è brutto ma `seq-lost` è `0`, i pacchetti sono stati ritardati/rilasciati a raffica, non persi.
- `loop-max-gap`: gap massimo del loop protocollo firmware dal boot, quindi trattalo come sanity check, non solo come metrica della run corrente.

I normali comandi `SET_LEDS` usano packet id `0`, quindi non aggiornano `arrival-gaps`, `seq-lost` o `seq-reordered`. Quei contatori descrivono solo il traffico benchmark.

## Troubleshooting

### macOS: tutti i device risultano `offline` ma rispondono a `nc`

Sintomo: `rleds ping <ip>` riporta `offline` (con `DEBUG=1`: `send EHOSTUNREACH` su ogni tentativo, istantaneo), eppure il device risponde a una prova manuale come `echo -ne '\x01\x00' | nc -u -w1 <ip> 4210`.

Causa: la privacy **Rete locale** di macOS (Impostazioni di Sistema → Privacy e Sicurezza → Rete locale). Il controllo si applica solo ai binari di terze parti — i tool Apple come `nc` sono esenti, ed è per questo che continuano a funzionare. Node (e quindi `rleds`) viene bloccato, e il permesso è attribuito all'**app terminale** da cui lo lanci (iTerm, Terminal, …), quindi `node` non compare mai nella lista.

Soluzione: attiva il toggle del tuo terminale in Privacy e Sicurezza → Rete locale. Se è già attivo (lo stato può corrompersi dopo un update di macOS), spegnilo e riaccendilo, poi riavvia completamente il terminale (Cmd+Q).

### macOS: micro-lag periodici durante lo streaming via WiFi (AWDL)

Sintomo: le animazioni LED possono scattare brevemente ogni pochi secondi anche con segnale forte. Quando AWDL è la causa, `rleds benchmark <host>` spesso mostra gap di arrivo a raffiche (bucket `arrival-gaps` >50ms popolati) con `seq-lost 0` — i frame arrivano in ritardo, non si perdono.

Causa: **AWDL** (Apple Wireless Direct Link), l'interfaccia nascosta dietro AirDrop/AirPlay/Handoff. macOS può spostare la radio WiFi su un altro canale per cercare dispositivi Apple vicini, trattenendo brevemente il traffico in uscita. L'effetto dipende dal setup; la CLI avvisa così puoi escluderlo prima di fidarti dei benchmark.

Soluzione: `rleds benchmark` e `rleds rainbow` avvisano quando AWDL è attiva; `rleds proxy` fa lo stesso. Alternative: collegare il Mac via Ethernet (la migliore), spegnere AirDrop/Ricezione AirPlay/Handoff nelle Impostazioni di Sistema, oppure eseguire manualmente `sudo ifconfig awdl0 down` per la sessione.

## Flusso Provisioning BLE

`bt-scan` → `bt-credential` → riavvio dispositivo → Wi-Fi pronto.

## Requisiti Bluetooth

I comandi `bt-*` usano [`@stoprocent/noble`](https://github.com/stoprocent/noble), che ha dipendenze native diverse per OS:

- **macOS**: funziona out of the box. Al primo lancio il terminale chiede il permesso "Bluetooth" — concedilo (Impostazioni di Sistema → Privacy e Sicurezza → Bluetooth).
- **Linux**: richiede `libbluetooth-dev` (Debian/Ubuntu) o `bluez-libs-devel` (Fedora) installato prima di `npm install`. Il binario `rleds` ha bisogno della capability `cap_net_raw` oppure deve essere eseguito come root: `sudo setcap cap_net_raw+eip $(eval readlink -f \`which node\`)`.
- **Windows**: se `bt-scan` non trova device, considera WSL2 con `usbipd` per inoltrare un dongle USB Bluetooth.

## Variabili d'ambiente

- `DEBUG=1` — abilita log verbosi su tutti i comandi (dump pacchetti UDP/WebSocket, write characteristic BLE, retry di ping durante lo scan, ecc.). Usalo quando un device non risponde.

```bash
DEBUG=1 rleds scan
DEBUG=1 rleds ping 192.168.1.10
```

## Esempi d'uso (config in lettura)

```bash
$ rleds config 192.168.1.10
Config:
	- pin: 18
	- Num LEDs: 16
	- Port: 4210
	- Hostname: tube-1
```

## Codici d'uscita

- `0` — comando riuscito
- `1` — errore (device non trovato, credenziali non valide, timeout, ecc.)

## Aggiornamento

```bash
git pull                     # ultimo codice
npm install && npm run build # ricompila
npm link                     # aggiorna il collegamento globale
```

## Link

- [Torna al README principale](../README-it.md)
