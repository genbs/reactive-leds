<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

# Stampa 3D

Language: [English](./README.md) | [Italiano](./README-it.md)

Modelli 3D per il tubo LED e per il case dell'ESP32 + DC-DC.

Non sono un esperto di stampa 3D — queste impostazioni hanno funzionato con la mia stampante. Trattale come punto di partenza e adattale al tuo hardware.

## File

```
3dprint/
├── RLEDsv1.f3d      # Sorgente Fusion 360 (modificalo per fare il remix)
├── case/               # Case per ESP32-S3 + modulo DC-DC XL4015
│   ├── base.stl
│   ├── bottom.stl
│   ├── tap.stl
│   └── top.stl
└── tube/               # Binario LED
    ├── profile.stl         # Profilo che alloggia la striscia FCOB (PLA, 4x 20cm)
    ├── profile_head.stl    # (Opzionale) Profilo che alloggia la striscia FCOB (PLA, 1x 20cm)
    └── opal.stl            # Diffusore traslucido (PETG, 4 pezzi da 25cm)
```

Il file `.f3d` è il sorgente Fusion 360 — aprilo se vuoi modificare le dimensioni, cambiare connettori o adattare il tutto a una striscia di larghezza diversa.

## Materiali e impostazioni

| Parte                       | Materiale                  | Note                                                                                                     |
| --------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tube/profile.stl`      | PLA                        | 4 o 5 pezzi × 20 cm per fare un binario da 1m                                                            |
| `tube/profile_head.stl` | PLA                        | 1 pezzo (se vuoi) × 20 cm per fare la parte iniziale del binario da 1m con spazio iniziale per saldature |
| `tube/opal.stl`         | PETG trasparente / opalino | Diffusore luce, stampato in 4 pezzi da 25 cm                                                             |
| `case/*.stl`                | PLA                        | Dimensionato per ESP32-S3 + XL4015 DC-DC (vedi materiali nel README principale)                          |

### Impostazioni dello slicer

Ho stampato tutto con il profilo di default di Creality Slicer — niente di tarato apposta per questo progetto. Ho usato il `brim` per i `profile` e per l'`opal`. Se hai un profilo migliore, i contributi sono benvenuti.

## Assemblaggio

Il case è progettato per:

- Dev board ESP32-S3 N16R8
- Modulo DC-DC step-down XL4015 (24V → 5V)
- Profilo per striscia LED largo 12mm

Vedi il [README principale](../README-it.md) per la lista completa dei materiali e per il cablaggio.

## Licenza

I modelli in questa cartella (`.f3d` e `.stl`) sono rilasciati sotto [CC0 1.0](./LICENSE) — di fatto pubblico dominio. Usali, modificali e ridistribuiscili liberamente; nessuna attribuzione richiesta. Sono prototipi funzionanti, non design ottimizzati: se li migliori, condividi il risultato in modo che altri possano beneficiarne.

## Link

- [Torna al README principale](../README-it.md)
- [README firmware](../firmware/README-it.md) — schema di cablaggio
