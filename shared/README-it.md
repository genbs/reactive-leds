# Shared

Language: [English](./README.md) | [Italiano](./README-it.md)

Tipi TypeScript e helper condivisi usati da client e CLI.

## Protocollo

La comunicazione con il firmware avviene tramite pacchetti UDP binari a formato fisso.

Ogni pacchetto inizia con due byte:

```
[PacketID, PacketType, ...dati]
```

- **PacketID**: numero di sequenza usato per abbinare le risposte alle richieste.
- **PacketType**: uno dei valori nella tabella seguente.

| Tipo | Valore | Direzione | Descrizione |
|---|---|---|---|
| `PING` | 0 | richiesta/risposta | Verifica se il dispositivo è raggiungibile |
| `GET_CONFIG` | 1 | richiesta/risposta | Legge la configurazione del dispositivo |
| `SET_CONFIG` | 2 | richiesta/risposta | Scrive la configurazione del dispositivo (il device si riavvia in caso di successo — vedi sotto) |
| `SET_LEDS` | 3 | solo richiesta | Aggiorna i colori dei LED (nessuna risposta) |
| `RESET_WIFI` | 4 | solo richiesta | Cancella le credenziali WiFi salvate |
| `GET_VERSION` | 5 | richiesta/risposta | Legge la versione firmware (da `PROJECT_VER` / `git describe`) |
| `GET_STATUS`  | 6 | richiesta/risposta | Legge lo stato del device (uptime, heap libero, RSSI WiFi) |

### Formato SET_LEDS

Gli aggiornamenti LED sono il percorso caldo. Ogni LED è codificato in 5 byte:

```
[pixel_index, r, g, b, w]
```

Più LED possono essere raggruppati in un singolo pacchetto:

```
[PacketID, SET_LEDS, pixel_index, r, g, b, w, pixel_index, r, g, b, w, ...]
```

`SET_LEDS` non ha risposta — è fire-and-forget per minimizzare la latenza.

### Formato configurazione

```
[PacketID, GET_CONFIG/SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

La porta è divisa su due byte (big-endian). L'hostname è length-delimited dal pacchetto — il firmware legge `packet_length - 6` byte a partire dall'offset 6.

**Reboot in caso di successo.** Quando `SET_CONFIG` salva correttamente, il device invia la risposta OK e poi si riavvia entro ~100 ms. Questo è necessario perché `pin` (periferica RMT) e `port` (socket UDP) vengono associati allo startup e non possono essere riassociati a runtime. Il client deve aspettarsi che il device sia irraggiungibile per ~5 s dopo la risposta e ristabilire la connessione (attenzione: la porta UDP del device potrebbe essere cambiata).

### Dimensioni dei pacchetti

L'MTU UDP limita il pacchetto totale a 1500 byte. L'hostname è limitato a 32 byte sul filo (il firmware tronca a 31 + null).

| PacketType | Richiesta | Risposta |
|---|---|---|
| `PING` | 2 B (fissa) | 3 B (fissa) |
| `GET_CONFIG` | 2 B (fissa) | 6–38 B (header + hostname 0–32 B) |
| `SET_CONFIG` | 6–38 B (header + hostname 0–32 B) | 3 B (`id, type, status`) |
| `SET_LEDS` | 7–1497 B (2 + N×5, N = 1..299 LED) | — (nessuna risposta) |
| `RESET_WIFI` | 2 B (fissa) | 3 B (fissa) |
| `GET_VERSION` | 2 B (fissa) | 2–34 B (header + version string 0–32 B) |
| `GET_STATUS`  | 2 B (fissa) | 11 B (fissa) |

### Encoding delle stringhe

Hostname e SSID/password Wi-Fi sono assunti come **ASCII**. Il firmware li salva come byte raw; il client JS li codifica/decodifica come UTF-8. Per ASCII puro è identico, ma caratteri non-ASCII possono produrre replacement char (`�`) o non corrispondere — soprattutto al confine di troncamento dei 32 byte dell'hostname. Usa solo `[a-z0-9-]` per gli hostname (RFC 1123) ed evita non-ASCII nelle credenziali Wi-Fi quando possibile.

## Provisioning BLE

Le credenziali Wi-Fi vengono inviate a un device appena flashato via BLE GATT (il protocollo UDP descritto sopra è utilizzabile solo dopo che il Wi-Fi è attivo).

| Campo | Valore |
|---|---|
| Service UUID | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Proprietà characteristic | `WRITE`, `READ`, `NOTIFY` |
| Nome device (advertised) | l'hostname configurato (es. `esp-1`) |

### Payload di scrittura

Una singola stringa UTF-8 nel formato `<ssid>,<password>`:

- la virgola `,` è il separatore (quindi l'SSID non può contenere `,`)
- lunghezza massima SSID: 32 byte (limite IEEE 802.11)
- lunghezza massima password: 63 byte (limite WPA2)
- niente terminatore, niente length prefix — la lunghezza del write BLE è la lunghezza del payload

Dopo una scrittura valida il device salva le credenziali in NVS e si riavvia entro ~2 s. Se non arriva alcuna scrittura entro `BLE_TIMEOUT_MS` (default 180 s), il device si riavvia comunque.

> **Nota sicurezza**: niente pairing, niente cifratura. Le credenziali vengono trasmesse in chiaro via radio. È una scelta deliberata per semplicità di setup — il provisioning si fa una volta, in un luogo fidato.

Implementazioni di riferimento:
- Device (server): [`firmware/main/ble.c`](../firmware/main/ble.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](../cli/cmd/bluetooth.ts) — usa `@abandonware/noble`

## Implementazioni di riferimento

Se vuoi scrivere un client in un altro linguaggio (Python, Rust, Go, Pure Data, Max/MSP…), queste sono le implementazioni autoritative:

- **Receiver (device)**: [`firmware/main/protocol.c`](../firmware/main/protocol.c) — listener UDP, costruzione delle risposte.
- **UDP sender (Node)**: [`cli/protocol.ts`](../cli/protocol.ts) — client UDP grezzo usato dalla CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](../client/src/main.ts) — usa il proxy WebSocket della CLI per raggiungere il device.

Il protocollo in sé non è coperto da licenza — il byte layout sopra è sufficiente per scrivere un client completamente compatibile da zero.

## Note

Evita breaking changes senza aggiornare tutti i pacchetti che dipendono da questo modulo.

## Link

- [Torna al README principale](../README-it.md)
