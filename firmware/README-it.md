# Firmware

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Firmware Build](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml)

Language: [English](./README.md) | [Italiano](./README-it.md)

Questo è il cuore del progetto: il firmware che gira sull'ESP32-S3, riceve i comandi via UDP e aggiorna i LED in tempo reale con una latenza minima.

Al primo avvio, il firmware entra in modalità provisioning BLE, dove aspetta le credenziali Wi-Fi da un client (es. la [CLI](../cli/README-it.md)). Dopo aver ricevuto le credenziali, si connette alla rete e resta in ascolto di [pacchetti UDP](#protocollo).

Il firmware è tarato per FCOB 24V a 16 IC con ordine byte WRGB, ma si adatta ad altre — vedi [Adattamento a una striscia LED diversa](#adattamento-a-una-striscia-led-diversa).

> **Non vuoi compilare?** Puoi flashare l'ultima release direttamente dal browser sul [sito del progetto](https://genbs.github.io/reactive-leds/) (Chrome/Edge, via Web Serial) — senza installare ESP-IDF. Il resto di questo README serve solo se vuoi modificare o ricompilare il firmware.

## Requisiti

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) v5.5.X — [Guida installazione](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

**Driver USB (macOS/Windows)**: a seconda della dev board, l'ESP32-S3 appare via USB nativo (nessun driver, come `/dev/cu.usbmodem*`) oppure tramite un chip bridge USB-UART. Se la porta non viene riconosciuta, installa il driver del bridge della tua board: **CH340/CH9102** (WCH, appare come `/dev/cu.wchusbserial*`) o **CP210x** (Silicon Labs, appare come `/dev/cu.SLAB_USBtoUART`). Usa `ls /dev/cu.*` per vedere come si presenta la tua board. Su Linux questi driver sono di solito già nel kernel.

## Configurazione e Build

> **Nota**: La configurazione seguente è testata sul mio ESP32-S3. I suggerimenti e PR sono benvenuti.

La configurazione è presente in [`sdkconfig.defaults`](./sdkconfig.defaults).
ESP-IDF la combina con i propri default per generare `sdkconfig` al build time:

- `CONFIG_BT_BLE_42_FEATURES_SUPPORTED=y` — richiesto dal server GATT del BLE provisioning.
- `CONFIG_LWIP_UDP_RECVMBOX_SIZE=6` — receive mailbox UDP piccola per design. Sotto sovraccarico il kernel droppa i nuovi arrivi (drop-tail) invece di accumulare frame vecchi; il ritardo è limitato a ~12 ms con poll a 2 ms. Vedi "Scelte progettuali" per il razionale.
- `CONFIG_LWIP_TCPIP_TASK_PRIO=1` — priorità TCP/IP bassa così il protocol task (priorità 5) può interromperla sotto carico.
- `CONFIG_FREERTOS_HZ=1000` — granularità 1 ms per `vTaskDelay`. Necessario per il poll del protocollo a 2 ms: col default a 100 Hz, `pdMS_TO_TICKS(2)` si arrotonderebbe a 0 tick e andrebbe in busy-spin.
- `CONFIG_RMT_ISR_IRAM_SAFE=y` — tiene l'interrupt RMT in IRAM, così il timing del segnale LED non viene disturbato dagli accessi alla flash (cache miss). Conta per avere forme d'onda WS2812 pulite.
- `CONFIG_GDMA_ISR_IRAM_SAFE=y` — la striscia LED pilota RMT via DMA, quindi anche l'interrupt GDMA deve restare in IRAM. Va in coppia con `CONFIG_RMT_ISR_IRAM_SAFE` per tenere al sicuro un transfer anche se una finestra flash-cache-disable (es. una scrittura NVS) lo sovrappone.
- `CONFIG_LWIP_TCPIP_TASK_AFFINITY_CPU0=y`, `CONFIG_FREERTOS_TIMER_TASK_AFFINITY_CPU0=y` — pinnano lo stack WiFi/lwIP sul core 0, lasciando il core 1 al task protocollo/render (`xTaskCreatePinnedToCore(..., 1)` in `main.c`). Isola il percorso realtime dallo stack di rete.
- `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y`, `CONFIG_COMPILER_OPTIMIZATION_PERF=y`, `CONFIG_ESP32S3_INSTRUCTION_CACHE_32KB=y`, `CONFIG_ESP32S3_DATA_CACHE_64KB=y` — tuning di performance (clock massimo, `-O2`, I-cache e D-cache più grandi) per il percorso realtime.
- `CONFIG_LOG_DEFAULT_LEVEL_INFO=y` — log level di default a runtime è INFO. Vengono stampati solo gli eventi INFO one-shot (boot, connessione WiFi, provisioning, scritture di config).
- `CONFIG_LOG_MAXIMUM_LEVEL_INFO=y` — tetto del log a compile-time. Ogni log per-pacchetto/per-frame (`SET_LEDS`, `PING`, …) è `ESP_LOGV` (verbose); con il livello massimo fissato a INFO il compilatore rimuove quelle chiamate completamente dal binario — il loop caldo non paga nulla, nemmeno un branch. Alza entrambe le opzioni a VERBOSE (menuconfig → Log output) per le tracce di debug per-pacchetto.
- Partition table custom (vedi [`partitions.csv`](./partitions.csv)).
- Default device (`CONFIG_LED_PIN=18`, `CONFIG_NUM_LEDS=16`, `CONFIG_PORT=4210`, `CONFIG_LWIP_LOCAL_HOSTNAME="esp32-X"`).

Per cambiare valori device-specifici, modifica direttamente `sdkconfig.defaults`.

### Configurazione del device

Lancia `idf.py menuconfig` e cerca sotto "Device configuration".
Lì potrai modificare:

- `LED_PIN` — GPIO per la data line della striscia LED (default 18)
- `NUM_LEDS` — numero di LED sulla striscia (default 16)
- `PORT` — porta UDP su cui il firmware ascolta (default 4210)

L'`hostname` è configurabile sotto la voce "Component config → LWIP". Di default è `esp32-X` dove `X` è l'ID del dispositivo. Puoi scegliere quello che preferisci, ma è utile avere un pattern riconoscibile per identificare i device sulla rete (es. `rleds-1`, `rleds-2`, ecc.).

### Versione firmware

Di default ESP-IDF la deriva da `git describe --tags --long --dirty`, quindi basta taggare il repo (es. `git tag vX.Y.Z`). Per override manuale, aggiungi `set(PROJECT_VER "X.Y.Z")` nel `CMakeLists.txt` prima di `idf_component_register`.

### Una build, molti dispositivi

Serve compilare una sola volta. I default in `sdkconfig.defaults` (`pin=18`, `num_leds=16`, `port=4210`) sono un punto di partenza — dopo il flash puoi cambiarli tutti a runtime con `rleds config <host> <port> <chiave> <valore>` senza ricompilare. Il device si riavvia e carica la nuova config da NVS.

Questo significa che puoi flashare lo stesso binario su tutti i tuoi device e configurarne ognuno singolarmente dalla CLI.

La cosa più importante da impostare su ogni device è l'**hostname** — identifica il device in modo univoco sulla rete ed è quello che `rleds scan` mostra. Impostalo subito dopo il primo flash:

```bash
rleds config <host> <port> hostname esp32-1
```

Dopo puoi usare l'hostname al posto dell'IP in qualsiasi comando:

```bash
rleds ping esp32-1
rleds config esp32-1 4210 num_leds 32
```

### Build e flash

Dopo aver configurato, builda e flasha il firmware con:

1. Build del progetto

```bash
idf.py build
```

2. Flash del dispositivo

**Nota**: Sostituisci `/dev/tty.wchusbserialXXXX` con la porta del tuo dispositivo

```bash
idf.py -p /dev/tty.wchusbserialXXXX flash
```

3. Monitor del dispositivo

```bash
idf.py -p /dev/tty.wchusbserialXXXX monitor
```

## Scelte progettuali

**Periferica RMT per il segnale LED**
Il protocollo WS2812 richiede una temporizzazione precisa al nanosecondo. Invece di generare il segnale via software — lento, impreciso e bloccante per la CPU — il firmware usa la periferica RMT dell'ESP32-S3. RMT genera il segnale in hardware: la CPU non è coinvolta durante la trasmissione e rimane libera per il resto del lavoro.

**UDP invece di TCP**
Gli aggiornamenti LED viaggiano su UDP. L'obiettivo è la latenza minima: le garanzie di consegna di TCP introdurrebbero buffer e ritrasmissioni che nel contesto real-time sono controproducenti. Un frame perso è sempre meglio di un frame in ritardo.

Sotto carico sostenuto, la mailbox UDP piccola (`CONFIG_LWIP_UDP_RECVMBOX_SIZE = 6`) limita il ritardo: quando la coda è piena il kernel droppa i nuovi arrivi (drop-tail), così il firmware processa i pacchetti in ordine di arrivo con un ritardo massimo di ~12 ms rispetto al presente (6 slot × 2 ms di poll). Testato empiricamente, questo si percepisce come più fluido rispetto al drenare la coda e mostrare solo l'ultimo frame (i frame intermedi verrebbero persi e le animazioni risultano scattose).

**WiFi tarato per un dispositivo fisso**
Il dispositivo non si sposta mai, quindi il roaming 802.11k/v è disabilitato (`rm_enabled = 0`, `btm_enabled = 0` in `wifi.c`) e l'associazione usa `WIFI_FAST_SCAN`. Gli scan periodici di canale in background che il roaming innesca interrompono brevemente la ricezione UDP — visibile come uno stutter nell'animazione. Disabilitarli ha eliminato i singhiozzi periodici; lo stutter casuale residuo è un limite intrinseco del WiFi, non qualcosa che ulteriori tweak di config risolvono.

**Provisioning via BLE invece del captive portal**
Con la [CLI](../cli/README-it.md) puoi inviare le credenziali Wi-Fi tramite Bluetooth.

> ⚠️ **Nota di sicurezza**: il provisioning BLE non usa cifratura né pairing — le credenziali Wi-Fi viaggiano in chiaro e qualsiasi dispositivo nelle vicinanze può connettersi durante la fase di configurazione. Per questo progetto è una scelta consapevole: il provisioning avviene una sola volta, in un ambiente controllato (casa), prima di portare il dispositivo in performance. Se configuri il dispositivo in luoghi pubblici, tienilo presente.

## Adattamento a una striscia LED diversa

Il firmware è tarato per una striscia FCOB 24V con ordine byte WRGB. IC LED diversi si aspettano un ordine diverso sul filo — se la tua striscia mostra colori sbagliati (es. rosso visualizzato come verde), questo è quello che devi modificare.

L'ordine dei byte è impostato in [`firmware/main/leds.c`](../firmware/main/leds.c) dentro `leds_update`:

```c
size_t index = pixel_index * 4;
s_led_buffer[index] = w;      // adatta queste 4 righe alla tua striscia
s_led_buffer[index + 1] = r;
s_led_buffer[index + 2] = g;
s_led_buffer[index + 3] = b;
```

Ordini comuni:

| IC / striscia          | Byte per LED | Ordine     |
| ---------------------- | ------------ | ---------- |
| FCOB (questo progetto) | 4            | W, R, G, B |
| SK6812 RGBW            | 4            | R, G, B, W |
| WS2812 / WS2812B       | 3            | G, R, B    |
| WS2811                 | 3            | R, G, B    |

Se passi a un tipo a 3 byte (senza white channel), modifica anche:

- `s_led_buffer = malloc(config.num_leds * 4)` → `* 3` in `leds_begin`
- `config.num_leds * 4` → `* 3` in `leds_show`

Le costanti di timing WS2812 in `rmt_new_led_strip_encoder` (T0H/T0L/T1H/T1L) funzionano per la maggior parte delle famiglie WS281x e SK68xx. IC esotici (APA102, SPI-based) richiedono un encoder completamente diverso.

Rendere l'ordine dei byte e la dimensione del pixel configurabili (via Kconfig o config a runtime) è un passo naturale successivo — PR benvenute.

## Cablaggio

```
Alimentatore 24V
  ├── (+) ──→ ingresso DC-DC XL4015 (+)
  │            uscita DC-DC (5V) ──→ ESP32 pin 5V
  │            GND DC-DC ─────────→ ESP32 GND
  │
  └── (+) ──→ striscia LED (+) 24V
      (-)  ──→ striscia LED (-) GND (condiviso con ESP32 GND)

ESP32 GPIO18 ──→ resistenza 330 Ω ──→ data line striscia LED
```

Il modulo XL4015 abbassa la tensione da 24V a 5V per alimentare l'ESP32. La striscia LED funziona direttamente a 24V. I GND devono essere tutti collegati insieme.
La resistenza da 330 Ω va messa in serie sulla linea dati, il più vicino possibile alla striscia, per ridurre il ringing e mantenere pulito il segnale LED.

## Layout della flash e OTA

Il `partitions.csv` custom definisce cinque partizioni dimensionate per l'ESP32-S3 N16R8 (16 MB flash):

| Partizione | Dimensione | Scopo                                    |
| ---------- | ---------- | ---------------------------------------- |
| `nvs`      | 24 KB      | Credenziali Wi-Fi, configurazione device |
| `phy_init` | 4 KB       | Dati di calibrazione RF                  |
| `factory`  | 1.5 MB     | Immagine principale (flash via USB)      |
| `ota_0`    | 1.5 MB     | Slot OTA A (riservato, non ancora usato) |
| `ota_1`    | 1.5 MB     | Slot OTA B (riservato, non ancora usato) |

**OTA non è implementato.** Oggi gli aggiornamenti richiedono flash via USB. Gli slot OTA sono riservati nella partition table così una futura implementazione OTA può atterrare senza ri-partizionare la flash — una ri-partizione cancellerebbe NVS, costringendo ogni device a ripassare per il BLE provisioning. PR per implementare OTA sono benvenute.

## Protocollo

Il protocollo UDP è definito in [`shared/`](../shared/README-it.md): pacchetti binari `[PacketID, PacketType, ...dati]` sulla porta 4210 (o quella configurata).

Per l'uso normale c'è la [CLI](../cli/README-it.md), ma essendo solo byte su UDP puoi pilotare il device anche con una riga di shell — comodo per un debug veloce o per capire come funziona. La risposta si stampa con `xxd` o `hexdump -C`:

```bash
# PING (type 0): il device è vivo?
echo -n -e '\x01\x00' | nc -u -w1 192.168.x.x 4210 | xxd
# risposta attesa: 01 00 01  → PacketID=1, PING, status=1 (OK)

# GET_CONFIG (type 1): leggi pin, num_leds, porta, hostname
echo -n -e '\x01\x01' | nc -u -w1 192.168.x.x 4210 | xxd

# GET_STATUS (type 6): uptime, heap libero, RSSI Wi-Fi, MAC WiFi STA
echo -n -e '\x01\x06' | nc -u -w1 192.168.x.x 4210 | xxd
# risposta: 17 byte → id, type, uptime (4 B BE), heap (4 B BE), rssi (1 B, int8), mac (6 B)

# SET_LEDS (type 3): accendi il LED 1 di rosso — fire-and-forget, nessuna risposta
echo -n -e '\x01\x03\x01\xFF\x00\x00\x00' | nc -u -w1 192.168.x.x 4210
```

## Recovery

**Le credenziali Wi-Fi non funzionano più (es. hai cambiato password sul router).** Power-cycle del device. Al boot tenta la rete salvata per ~20 s, fallisce, e ricade in BLE provisioning — a quel punto puoi inviare le nuove credenziali con la CLI (`rleds bt-credential`). Se il device è già acceso quando cambi la password, vale lo stesso rimedio: il reconnect task in [`main.c`](../firmware/main/main.c) continua a riprovare con le credenziali memorizzate (ora sbagliate) finché non riavvii. È intenzionale: un frame congelato durante una performance live è preferibile a un reboot improvviso.

**Cancellare tutte le credenziali Wi-Fi da un device acceso.** Manda `RESET_WIFI` via UDP (`rleds reset-wifi <host> <port?>`). Il device pulisce NVS, si riavvia e riparte in modalità BLE provisioning.

**`SET_CONFIG` è best-effort, non atomico.** Ogni campo (pin, num_leds, port, hostname) viene scritto su NVS separatamente. Se si verifica un errore di storage a metà sequenza, il device potrebbe riavviarsi con una config parzialmente aggiornata. Soluzione: invia di nuovo `SET_CONFIG`, oppure `RESET_WIFI` e ri-fai il provisioning.

## Link

- [Torna al README principale](../README-it.md)
