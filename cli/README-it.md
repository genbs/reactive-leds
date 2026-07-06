# CLI

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://img.shields.io/npm/v/@reactive-leds/cli)](https://www.npmjs.com/package/@reactive-leds/cli)

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
- `ping [host] [port]` - verifica se un dispositivo è online. Se `host` è omesso, pinga tutti i device scoperti in rete.
- `reset-wifi [host] [port]` - cancella le credenziali Wi-Fi. Se `host` è omesso, applica a tutti i device scoperti.
- `config <host> [port] [key] [value]` - legge o aggiorna la configurazione del dispositivo. In lettura stampa chiavi e valori correnti. In scrittura riavvia il device (~5 s offline prima del recovery). Richiede `host` esplicito. Chiavi supportate: `hostname` (stringa, max 32 caratteri), `pin` (numero, GPIO del LED), `num_leds` (numero), `port` (numero, porta UDP).
- `leds <host> [port] <leds_package>` - invia aggiornamenti LED. Il pacchetto è una lista di valori separati da virgole in gruppi di 5: `<led_index>,<r>,<g>,<b>,<w>` (w = bianco/luminosità). Si possono controllare più LED concatenando gruppi: `0,255,0,0,0,1,0,128,128,0`. Ogni valore tra 0 e 255. Richiede `host` esplicito.
- `bt-scan` - scansione dispositivi via Bluetooth.
- `bt-credential [indexOrHost] [ssid]` - invia credenziali Wi-Fi via Bluetooth. Se `indexOrHost` è omesso, parte in modalità interattiva: mostra la lista dei dispositivi trovati e chiede quale selezionare (per indice numerico o nome). Se `ssid` è omesso, lo chiede al prompt (la password viene chiesta sempre, nascosta). Se `indexOrHost` è un numero, viene usato come indice della lista `bt-scan` (1-based).
- `proxy [host] [port] [device_port]` - avvia il proxy WebSocket tra client browser e firmware. Scansiona la LAN ogni 10 secondi e mostra i device trovati in tempo reale — IP, hostname e MAC riportato dal firmware quando disponibile.
- `rainbow [seconds] [speed] [host] [port]` - effetto arcobaleno che scorre sulla strip. Se `host` è omesso, l'effetto va su tutti i device scoperti.
- `color [r] [g] [b] [w] [host] [port]` - imposta un colore solido su tutti i LED. Se `r g b` sono omessi usa un colore casuale. Se `host` è omesso applica a tutti i device scoperti.
- `off [host] [port]` - spegne tutti i LED. Se `host` è omesso applica a tutti i device scoperti. Alias di comodo per `color 0 0 0 0`.
- `status [host] [port]` - legge lo stato del device (uptime, heap libero, RSSI WiFi). Se `host` è omesso, interroga tutti i device scoperti.
- `version [host] [port]` - legge la versione firmware (da `PROJECT_VER` / `git describe`). Se `host` è omesso, interroga tutti i device scoperti.
- `clear-cache` - elimina la cache dello scan su disco (`/tmp/reactive-leds-scan.json`). Utile quando hai aggiunto/spostato un device, cambiato rete Wi-Fi, o vuoi semplicemente forzare una nuova discovery al prossimo comando. `config` con scrittura pulisce automaticamente la cache (visto che riavvia il device).

## Esempi (minimi)

```bash
rleds scan
rleds ping 192.168.1.10
rleds config 192.168.1.10 4210 hostname tube-1
rleds leds 192.168.1.10 4210 0,255,0,0,0
rleds bt-scan
rleds bt-credential
rleds proxy
rleds rainbow 10 1 192.168.1.10
rleds color
rleds color 255 0 0
rleds color 255 0 0 0 192.168.1.10
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

  esp32-X (192.168.X.X:4210) AA:BB:CC:DD:EE:FF
```

## Troubleshooting

### macOS: tutti i device risultano `offline` ma rispondono a `nc`

Sintomo: `rleds ping <ip>` riporta `offline` (con `DEBUG=1`: `send EHOSTUNREACH` su ogni tentativo, istantaneo), eppure il device risponde a una prova manuale come `echo -ne '\x01\x00' | nc -u -w1 <ip> 4210`.

Causa: la privacy **Rete locale** di macOS (Impostazioni di Sistema → Privacy e Sicurezza → Rete locale). Il controllo si applica solo ai binari di terze parti — i tool Apple come `nc` sono esenti, ed è per questo che continuano a funzionare. Node (e quindi `rleds`) viene bloccato, e il permesso è attribuito all'**app terminale** da cui lo lanci (iTerm, Terminal, …), quindi `node` non compare mai nella lista.

Soluzione: attiva il toggle del tuo terminale in Privacy e Sicurezza → Rete locale. Se è già attivo (lo stato può corrompersi dopo un update di macOS), spegnilo e riaccendilo, poi riavvia completamente il terminale (Cmd+Q).

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
