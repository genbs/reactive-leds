# Stampa 3D

Language: [English](./README.md) | [Italiano](./README-it.md)

Modelli 3D per il tubo LED e per il case dell'ESP32 + DC-DC.

Non sono un esperto di stampa 3D — queste impostazioni hanno funzionato con la mia stampante. Trattale come punto di partenza e adattale al tuo hardware.

## File

```
3dprint/
├── TubeLED v1.f3d      # Sorgente Fusion 360 (modificalo per fare il remix)
├── case/               # Case per ESP32-S3 + modulo DC-DC XL4015
│   ├── base.stl
│   ├── bottom.stl
│   ├── tap.stl
│   └── top.stl
└── tube-led/           # Binario LED
    ├── profile.stl     # Profilo che alloggia la striscia FCOB (PLA, 5x 20cm = 1m)
    └── opal.stl        # Diffusore traslucido (PETG, 4 pezzi da 25cm)
```

Il file `.f3d` è il sorgente Fusion 360 — aprilo se vuoi modificare le dimensioni, cambiare connettori o adattare il tutto a una striscia di larghezza diversa.

## Materiali e impostazioni

| Parte                  | Materiale                  | Note                                                                            |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `tube-led/profile.stl` | PLA                        | 5 pezzi × 20 cm per fare un binario da 1m                                       |
| `tube-led/opal.stl`    | PETG trasparente / opalino | Diffusore luce, stampato in 4 pezzi da 25 cm                                    |
| `case/*.stl`           | PLA                        | Dimensionato per ESP32-S3 + XL4015 DC-DC (vedi materiali nel README principale) |

### Impostazioni dello slicer

Ho stampato tutto con il profilo di default di Creality Slicer — niente di tarato apposta per questo progetto. Ha funzionato. Se hai un profilo migliore, contributi benvenuti.

## Assemblaggio

Il case è progettato per:

- Dev board ESP32-S3 N16R8
- Modulo DC-DC step-down XL4015 (24V → 5V)
- Profilo per striscia LED largo 12mm

Vedi il [README principale](../README-it.md) per la lista completa dei materiali e per il cablaggio.

## Remix

Se cambi larghezza striscia, modello board o modulo DC-DC, parti da `TubeLED v1.f3d` invece di modificare gli STL. L'STL è un formato senza ritorno — il sorgente parametrico ti permette di ri-esportare parti coerenti tra loro.

## Link

- [Torna al README principale](../README-it.md)
- [README firmware](../firmware/README-it.md) — schema di cablaggio
