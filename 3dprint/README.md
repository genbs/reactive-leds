# 3D Print

Language: [English](./README.md) | [Italiano](./README-it.md)

3D models for the LED tube and the ESP32 + DC-DC enclosure.

I am not a 3D printing expert — these settings worked for me on my printer. Treat them as a starting point and adapt to your hardware.

## Files

```
3dprint/
├── TubeLED v1.f3d      # Fusion 360 source (edit this to remix)
├── case/               # Enclosure for ESP32-S3 + XL4015 DC-DC module
│   ├── base.stl
│   ├── bottom.stl
│   ├── tap.stl
│   └── top.stl
└── tube-led/           # LED rail
    ├── profile.stl     # Rail that holds the FCOB strip (PLA, 5x 20cm = 1m)
    └── opal.stl        # Translucent diffuser bar (PETG, 4x 25cm pieces)
```

The `.f3d` file is the Fusion 360 source — open it if you want to modify dimensions, swap connectors, or fit a different strip width.

## Materials and settings

| Part | Material | Notes |
|---|---|---|
| `tube-led/profile.stl` | PLA | 5 pieces × 20 cm to make a 1m rail |
| `tube-led/opal.stl` | Transparent / opal PETG | Light diffuser, printed in 4 pieces × 25 cm |
| `case/*.stl` | PLA | Sized for ESP32-S3 + XL4015 DC-DC (see main README Materials) |

### Slicer settings

I printed everything with the default Creality Slicer profile — nothing tuned for this project specifically. It worked. If you have a better profile, contributions are welcome.

## Assembly

The enclosure is designed for:

- ESP32-S3 N16R8 dev board
- XL4015 DC-DC step-down module (24V → 5V)
- 12mm wide LED strip profile

See [main README](../README.md) for the full bill of materials and wiring.

## Remixing

If you change strip width, board model, or DC-DC module, start from `TubeLED v1.f3d` rather than editing STLs. STL is a dead-end format — the parametric source lets you re-export consistent parts.

## License

The models in this folder (`.f3d` and `.stl`) are released under [CC0 1.0](./LICENSE) — effectively public domain. Use, modify, and redistribute them freely; no attribution required. They are working prototypes, not optimized designs: if you improve them, sharing the result back is appreciated but never required.

## Links

- [Back to main README](../README.md)
- [Firmware README](../firmware/README.md) — wiring diagram
