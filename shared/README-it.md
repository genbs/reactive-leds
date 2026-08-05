# Shared

[![Test](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Language: [English](https://github.com/genbs/reactive-leds/blob/master/shared/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/shared/README-it.md)

Questo pacchetto contiene la specifica del protocollo binario per comunicare con i device `reactive-leds`, più i tipi TypeScript e gli helper di serializzazione che la implementano (condivisi da [client](https://github.com/genbs/reactive-leds/blob/master/client/README-it.md) e dalla [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README-it.md)).

Se vuoi controllare i LED da un altro linguaggio, puoi partire da qui.

> Questo è un pacchetto interno al monorepo: viene inlinato in `@reactive-leds/client` e `@reactive-leds/cli` al build time, non è pubblicato su npm.

## Protocollo

Si parla col firmware via UDP, con pacchetti binari a formato fisso: niente JSON, niente overhead, solo byte. L'obiettivo è la latenza minima per aggiornare i LED in tempo reale.

Ogni pacchetto inizia con due byte:

```
[PacketID, PacketType, ...PacketData]
```

- **PacketID**: numero di sequenza usato per abbinare le risposte alle richieste sincrone.
- **PacketType**: uno dei valori nella tabella seguente.

| Tipo         | Valore | Direzione          | Descrizione                                                                                      |
| ------------ | ------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| `PING`       | 0      | richiesta/risposta | Verifica se il dispositivo è raggiungibile                                                       |
| `GET_CONFIG` | 1      | richiesta/risposta | Legge la configurazione del dispositivo                                                          |
| `SET_CONFIG` | 2      | richiesta/risposta | Scrive la configurazione del dispositivo (il device si riavvia in caso di successo — vedi sotto) |
| `SET_LEDS`   | 3      | solo richiesta     | Aggiorna i colori dei LED (nessuna risposta)                                                     |
| `RESET_WIFI` | 4      | richiesta/risposta | Cancella le credenziali WiFi salvate (il device risponde OK, poi si riavvia)                     |
| `GET_INFO`   | 5      | richiesta/risposta | Legge identita del device (IP, porta, MAC, hostname, versione firmware)                          |
| `GET_STATUS` | 6      | richiesta/risposta | Legge uno snapshot fisso dello stato runtime e dei contatori diagnostici                         |

### Esempio (PING)

Un esempio concreto: PING al device 192.168.1.10 sulla porta 4210.

```
→  01 00               # richiesta:  PacketID=1, PING
←  01 00 01            # risposta:   PacketID=1, PING, status=OK (1)
```

Lo stesso pattern vale per ogni tipo richiesta/risposta: invia `[id, type, ...data]`, ricevi `[id, type, ...risposta]`. L'unico tipo fire-and-forget è `SET_LEDS`, che non ha risposta.

### Dimensioni dei pacchetti

| PacketType   | Richiesta                         | Risposta                                               |
| ------------ | --------------------------------- | ------------------------------------------------------ |
| `PING`       | 2 B (fissa)                       | 3 B (fissa)                                            |
| `GET_CONFIG` | 2 B (fissa)                       | 6–38 B (header + hostname 0–32 B)                      |
| `SET_CONFIG` | 6–38 B (header + hostname 0–32 B) | 3 B (`id, type, status`)                               |
| `SET_LEDS`   | 7–1023 B (3 + N×4, N = 1..255)    | — (nessuna risposta)                                   |
| `RESET_WIFI` | 2 B (fissa)                       | 3 B (fissa)                                            |
| `GET_INFO`   | 2 B (fissa)                       | 16–80 B (identità + versione/hostname 0–32 B ciascuno) |
| `GET_STATUS` | 2 B (fissa)                       | 91 B (fissa)                                           |

### Formato GET_STATUS

`GET_STATUS` restituisce un pacchetto fisso di 91 byte: l’header di due byte seguito da un payload di 89 byte. Questi contatori e istantanee di stato sono utili per il debug e per il benchmark della latenza. Il firmware mantiene i contatori in memoria, quindi non vengono persi tra un pacchetto e l’altro.

| Offset nel pacchetto | Campo                                                                                      | Encoding   | Significato                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------- |
| 0                    | `packetId`                                                                                 | u8         | Corrisponde alla richiesta                                                  |
| 1                    | `type`                                                                                     | u8         | Sempre `GET_STATUS` (`6`)                                                   |
| 2–5                  | `uptime`                                                                                   | u32 BE     | Secondi dall’avvio                                                          |
| 6–9                  | `heap`                                                                                     | u32 BE     | Byte heap liberi                                                            |
| 10                   | `rssi`                                                                                     | i8         | RSSI WiFi in dBm; `0` se non disponibile                                    |
| 11–22                | `internalHeap`, `largestHeapBlock`, `minHeap`                                              | 3 × u32 BE | Stato della memoria interna                                                 |
| 23–42                | `framesReceived`, `framesShown`, `framesDropped`, `udpPacketsRead`, `protocolLoopMaxGapMs` | 5 × u32 BE | Throughput LED/UDP e massimo ritardo del loop di protocollo                 |
| 43–66                | `arrivalGapHist[6]`                                                                        | 6 × u32 BE | Conteggi degli intervalli tra `SET_LEDS`: ≤5, ≤10, ≤20, ≤50, ≤100 e >100 ms |
| 67–74                | `arrivalGapMaxMs`, `arrivalGapMaxAgeS`                                                     | 2 × u32 BE | Intervallo massimo osservato e secondi trascorsi da quell’evento            |
| 75–82                | `seqLost`, `seqReordered`                                                                  | 2 × u32 BE | ID `SET_LEDS` mancanti e fuori ordine (`0` non è tracciato)                 |
| 83–90                | `beaconTimeouts`, `wifiDisconnects`                                                        | 2 × u32 BE | Eventi di salute del collegamento WiFi dall’avvio                           |

### Packet ID di `SET_LEDS` per il benchmark

Il benchmark usa il `PacketID` per attivare il tracciamento di arrivi e sequenza. È indipendente dal byte `start_index` nel payload di `SET_LEDS`.

| PacketID  | Scopo                              | Effetto sullo stato diagnostico                                                                                                                                                               |
| --------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | `SET_LEDS` normale fire-and-forget | Non aggiorna né azzera il tracciamento di gap/sequence. Aggiorna comunque i normali contatori frame.                                                                                          |
| `1`       | Marker di inizio benchmark         | Non è misurato dal tracciamento gap/sequenza; azzera `arrivalGapMaxMs`/`arrivalGapMaxAgeS` e riattiva la baseline di sequenza. **Non** cancella `arrivalGapHist`, `seqLost` o `seqReordered`. |
| `2`–`255` | Frame dello stream benchmark       | Aggiornano il tracciamento di gap e sequenza; gli ID ripartono da `2` dopo `255`.                                                                                                             |

Gli ID diversi da zero sono riservati al benchmark della CLI.

### Formato SET_LEDS

Per aggiornare LED contigui si invia l'indice iniziale seguito da gruppi RGBW di 4 byte:

```
[start_index, r, g, b, w, r, g, b, w, ...]
```

```
[PacketID, SET_LEDS, start_index, r, g, b, w, r, g, b, w, ...]
```

Il primo gruppo aggiorna `start_index`, i successivi gli indici consecutivi. I LED fuori dall'intervallo non vengono modificati.

`SET_LEDS` non ha risposta — è fire-and-forget per minimizzare la latenza.

**Il tetto del protocollo è 255 LED per device**: sia `start_index` che il campo `num_leds` della config sono singoli byte. È una scelta deliberata, su misura per strisce a segmenti (16 segmenti/m ≈ 15 m di FCOB per device), non per pannelli ad alta densità.

### Aggiornare la configurazione

```
[PacketID, SET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
```

La porta è divisa su due byte (big-endian). L'hostname è length-delimited dal pacchetto — il firmware legge `packet_length - 6` byte a partire dall'offset 6.

**Reboot in caso di successo.** Quando `SET_CONFIG` salva correttamente, il device invia la risposta OK e poi si riavvia entro ~100 ms. Questo è necessario perché `pin` (periferica RMT) e `port` (socket UDP) vengono associati allo startup e non possono essere riassociati a runtime. Il client deve aspettarsi che il device sia irraggiungibile per ~5s dopo la risposta e ristabilire la connessione (⚠️ attenzione: la porta UDP del device potrebbe essere cambiata).

### Encoding delle stringhe

L'hostname viene trattato come **ASCII**. Le credenziali Wi-Fi vengono codificate in UTF-8 e validate in byte: massimo 32 byte per l'SSID e 63 per la password.

In pratica: tieniti a `[a-z0-9-]` per gli hostname (RFC 1123). Nelle credenziali Wi-Fi i caratteri non-ASCII sono supportati, ma possono occupare più di un byte e raggiungere prima i limiti.

## Provisioning BLE e USB

Un device appena flashato non è ancora in rete, quindi il protocollo UDP qui sopra non serve a niente finché non gli dici a quale Wi-Fi connettersi. BLE GATT e USB seriale condividono lo stesso payload di credenziali.

| Campo                    | Valore                                 |
| ------------------------ | -------------------------------------- |
| Service UUID             | `a9ca1f56-8436-41d7-81dc-947facf48fe8` |
| Characteristic UUID      | `474c5e20-2f61-450c-a4d3-b51a3685ba5c` |
| Proprietà caratteristica | `WRITE`, `READ`, `NOTIFY`              |
| Nome device annunciato   | l'hostname configurato (es. `esp-1`)   |

### Payload di scrittura

Il payload è `[ssid_len, password_len, ssid..., password...]`:

- offset `0`: lunghezza SSID in byte
- offset `1`: lunghezza password in byte
- offset `2`: byte UTF-8 dell'SSID, seguiti dai byte della password
- lunghezza massima SSID: 32 byte (limite IEEE 802.11)
- lunghezza massima password: 63 byte (limite WPA2)
- la password può essere vuota per una rete aperta

Dopo una scrittura valida il device salva le credenziali in NVS. Il provisioning BLE riavvia il device dopo circa 2 s; il provisioning via seriale USB dopo circa 500 ms. Se non arrivano credenziali entro `PROVISIONING_TIMEOUT_MS` (valore predefinito: 180 s), il device si riavvia comunque.

Su seriale il payload è preceduto dai cinque byte ASCII `RLEDS`. Il device risponde con `RLEDS:OK\n` o `RLEDS:ERROR\n`.

> ⚠️ **Nota di sicurezza BLE**: il provisioning BLE non usa pairing né cifratura, quindi le credenziali vengono trasmesse via radio in chiaro. È una scelta deliberata per semplificare la configurazione: esegui il provisioning in un luogo fidato. Il provisioning via seriale USB non è interessato da questa limitazione BLE.

Implementazioni di riferimento:

- Device (server): [`firmware/main/ble.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/ble.c)
- Parser condiviso: [`firmware/main/credentials.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/credentials.c)
- USB seriale: [`firmware/main/serial_provisioning.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/serial_provisioning.c)
- CLI (client): [`cli/cmd/bluetooth.ts`](https://github.com/genbs/reactive-leds/blob/master/cli/cmd/bluetooth.ts) — usa `@stoprocent/noble`

## Implementazioni di riferimento

Se vuoi scrivere un client in un altro linguaggio (Python, Rust, Go, Pure Data, Max/MSP…), queste sono le implementazioni autoritative:

- **Receiver (device)**: [`firmware/main/protocol.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/protocol.c) — listener UDP, costruzione delle risposte.
- **UDP sender (Node)**: [`cli/protocol.ts`](https://github.com/genbs/reactive-leds/blob/master/cli/protocol.ts) — client UDP grezzo usato dalla CLI.
- **WebSocket sender (browser)**: [`client/src/main.ts`](https://github.com/genbs/reactive-leds/blob/master/client/src/main.ts) — usa il proxy WebSocket della CLI per raggiungere il device.

Il protocollo in sé non è coperto da licenza — il byte layout sopra è sufficiente per scrivere un client completamente compatibile da zero.

## Versionamento

Il protocollo cresce per aggiunta: un comportamento nuovo è un `PacketType` nuovo, e le risposte esistenti possono crescere solo aggiungendo campi opzionali in coda. Prima della prima release pubblica, una pulizia incompatibile resta accettabile quando rende il protocollo più chiaro; `GET_INFO` ha sostituito il più limitato `GET_VERSION` per questo motivo.

La regola d'oro: non riordinare o reinterpretare byte esistenti senza aggiornare tutti i pacchetti che li usano (firmware, CLI, client).

## Link

- [Torna al README principale](https://github.com/genbs/reactive-leds/blob/master/README-it.md)
