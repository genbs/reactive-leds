# Shared

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Language: [English](./README.md) | [Italiano](./README-it.md)

Questo pacchetto contiene la specifica del protocollo binario per comunicare con i device `reactive-leds`, più i tipi TypeScript e gli helper di serializzazione che la implementano (condivisi da [client](../client/README-it.md) e [CLI](../cli/README-it.md)).

Se vuoi controllare i LED da un altro linguaggio, parti da qui.

> Pacchetto interno al monorepo: viene inlinato in `@reactive-leds/client` e `@reactive-leds/cli` al build time, non è pubblicato su npm.

## Protocollo

Si parla col firmware via UDP, con pacchetti binari a formato fisso: niente JSON, niente overhead, solo byte. L'obiettivo è la latenza minima per aggiornare i LED in tempo reale.

Ogni pacchetto inizia con due byte:

```
[PacketID, PacketType, ...PacketData]
```

- **PacketID**: numero di sequenza usato per abbinare le risposte alle richieste sincrone.
- **PacketType**: uno dei valori nella tabella seguente.

| Tipo          | Valore | Direzione          | Descrizione                                                                                      |
| ------------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| `PING`        | 0      | richiesta/risposta | Verifica se il dispositivo è raggiungibile                                                       |
| `GET_CONFIG`  | 1      | richiesta/risposta | Legge la configurazione del dispositivo                                                          |
| `SET_CONFIG`  | 2      | richiesta/risposta | Scrive la configurazione del dispositivo (il device si riavvia in caso di successo — vedi sotto) |
| `SET_LEDS`    | 3      | solo richiesta     | Aggiorna i colori dei LED (nessuna risposta)                                                     |
| `RESET_WIFI`  | 4      | richiesta/risposta | Cancella le credenziali WiFi salvate (il device risponde OK, poi si riavvia)                     |
| `GET_VERSION` | 5      | richiesta/risposta | Legge la versione firmware (da `PROJECT_VER` / `git describe`)                                   |
| `GET_STATUS`  | 6      | richiesta/risposta | Legge lo stato del device (uptime, heap libero, RSSI WiFi)                                       |

### Esempio (PING)

Un esempio concreto: PING al device 192.168.1.10 sulla porta 4210.

```
→  01 00               # richiesta:  PacketID=1, PING
←  01 00 01            # risposta:   PacketID=1, PING, status=OK (1)
```

Lo stesso pattern vale per ogni tipo richiesta/risposta: invia `[id, type, ...data]`, ricevi `[id, type, ...risposta]`. L'unico tipo fire-and-forget è `SET_LEDS`, che non ha risposta.

### Dimensioni dei pacchetti

| PacketType    | Richiesta                          | Risposta                                |
| ------------- | ---------------------------------- | --------------------------------------- |
| `PING`        | 2 B (fissa)                        | 3 B (fissa)                             |
| `GET_CONFIG`  | 2 B (fissa)                        | 6–38 B (header + hostname 0–32 B)       |
| `SET_CONFIG`  | 6–38 B (header + hostname 0–32 B)  | 3 B (`id, type, status`)                |
| `SET_LEDS`    | 7–82 B (2 + N×5, N = 1..num_leds, 16 di default) | — (nessuna risposta)      |
| `RESET_WIFI`  | 2 B (fissa)                        | 3 B (fissa)                             |
| `GET_VERSION` | 2 B (fissa)                        | 2–34 B (header + version string 0–32 B) |
| `GET_STATUS`  | 2 B (fissa)                        | 11 B (fissa)                            |

### Formato SET_LEDS

Per aggiornare i LED si invia un PacketData composto da sequenze di 5 byte, una per LED:

```
[pixel_index, r, g, b, w]
```

Più LED possono essere raggruppati in un singolo pacchetto:

```
[PacketID, SET_LEDS, pixel_index, r, g, b, w, pixel_index, r, g, b, w, ...]
```

`SET_LEDS` non ha risposta — è fire-and-forget per minimizzare la latenza.

**Il tetto del protocollo è 255 LED per device**: sia `pixel_index` che il campo `num_leds` della config sono singoli byte. È una scelta deliberata, su misura per strisce a segmenti (16 segmenti/m ≈ 15 m di FCOB per device), non per pannelli ad alta densità.

### Aggiornare la configurazione

```
[PacketID, SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

La porta è divisa su due byte (big-endian). L'hostname è length-delimited dal pacchetto — il firmware legge `packet_length - 6` byte a partire dall'offset 6.

**Reboot in caso di successo.** Quando `SET_CONFIG` salva correttamente, il device invia la risposta OK e poi si riavvia entro ~100 ms. Questo è necessario perché `pin` (periferica RMT) e `port` (socket UDP) vengono associati allo startup e non possono essere riassociati a runtime. Il client deve aspettarsi che il device sia irraggiungibile per ~5s dopo la risposta e ristabilire la connessione (⚠️ attenzione: la porta UDP del device potrebbe essere cambiata).

### Encoding delle stringhe

L'hostname e le credenziali Wi-Fi (SSID/password) vengono trattati come **ASCII**. Il firmware li memorizza come byte grezzi (_raw_), mentre il client JS li codifica e decodifica in UTF-8. Per l'ASCII standard il comportamento è identico, ma i caratteri non-ASCII possono produrre caratteri di rimpiazzo (`�`) o non corrispondere correttamente, specialmente in prossimità del limite di troncamento di 32 byte dell'hostname.

In pratica: tieniti a `[a-z0-9-]` per gli hostname (RFC 1123) ed evita caratteri non-ASCII nelle credenziali Wi-Fi.

## Provisioning BLE

Un device appena flashato non è ancora in rete, quindi il protocollo UDP qui sopra non serve a niente finché non gli dici a quale Wi-Fi connettersi. Quel primo handshake avviene via BLE GATT: gli passi SSID e password una volta, lui si riavvia connesso.

| Campo                    | Valore                                 |
| ------------------------ | -------------------------------------- |
| Service UUID             | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID      | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Proprietà characteristic | `WRITE`, `READ`, `NOTIFY`              |
| Nome device (advertised) | l'hostname configurato (es. `esp-1`)   |

### Payload di scrittura

Una singola stringa UTF-8 nel formato `<ssid>,<password>`:

- la virgola `,` è il separatore (quindi l'SSID non può contenere `,`)
- lunghezza massima SSID: 32 byte (limite IEEE 802.11)
- lunghezza massima password: 63 byte (limite WPA2)
- niente terminatore, niente length prefix — la lunghezza del write BLE è la lunghezza del payload

Dopo una scrittura valida il device salva le credenziali in NVS e si riavvia entro ~2 s. Se non arriva alcuna scrittura entro `BLE_TIMEOUT_MS` (default 180 s), il device si riavvia comunque.

> ⚠️ **Nota sicurezza**: niente pairing, niente cifratura. Le credenziali vengono trasmesse in chiaro via radio. È una scelta deliberata per semplicità di setup — il provisioning si fa una volta, in un luogo fidato.

Implementazioni di riferimento:

- Device (server): [`firmware/main/ble.c`](../firmware/main/ble.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](../cli/cmd/bluetooth.ts) — usa `@stoprocent/noble`

## Implementazioni di riferimento

Se vuoi scrivere un client in un altro linguaggio (Python, Rust, Go, Pure Data, Max/MSP…), queste sono le implementazioni autoritative:

- **Receiver (device)**: [`firmware/main/protocol.c`](../firmware/main/protocol.c) — listener UDP, costruzione delle risposte.
- **UDP sender (Node)**: [`cli/protocol.ts`](../cli/protocol.ts) — client UDP grezzo usato dalla CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](../client/src/main.ts) — usa il proxy WebSocket della CLI per raggiungere il device.

Il protocollo in sé non è coperto da licenza — il byte layout sopra è sufficiente per scrivere un client completamente compatibile da zero.

## Versionamento

Il protocollo cresce per aggiunta, mai per modifica: un comportamento nuovo è un `PacketType` nuovo. Un firmware vecchio semplicemente ignora i tipi che non conosce, così un client più recente non lo manda in crash — degrada con grazia. `GET_VERSION` e `GET_STATUS` sono nati così, senza rompere una riga di quello che c'era prima.

La regola d'oro: non cambiare il byte layout di un `PacketType` esistente senza aggiornare tutti i pacchetti che lo usano (firmware, CLI, client).

## Link

- [Torna al README principale](../README-it.md)
