<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

# 3D Print

Language: [English](./README.md) | [Italiano](./README-it.md)

3D models for the LED tube and the ESP32 + DC-DC enclosure.

I am not a 3D printing expert — these settings worked for me on my printer. Treat them as a starting point and adapt to your hardware.

## Files

```
3dprint/
├── RLEDsv1.f3d      # Fusion 360 source (edit this to remix)
├── case/               # Enclosure for ESP32-S3 + XL4015 DC-DC module
│   ├── base.stl
│   ├── bottom.stl
│   ├── tap.stl
│   └── top.stl
└── tube/               # LED rail
    ├── profile.stl         # Rail that holds the FCOB strip (PLA, 4x 20cm)
    ├── profile_head.stl    # (Optional) rail piece that holds the FCOB strip (PLA, 1x 20cm)
    └── opal.stl            # Translucent diffuser (PETG, 4 pieces of 25cm)
```

The `.f3d` file is the Fusion 360 source — open it if you want to change dimensions, swap connectors, or fit a different strip width.

## Materials and settings

| Part                    | Material                    | Notes                                                                                              |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `tube/profile.stl`      | PLA                         | 4 or 5 pieces × 20 cm to make a 1m rail                                                            |
| `tube/profile_head.stl` | PLA                         | 1 piece (optional) × 20 cm for the start of the 1m rail, with extra room for the solder joints     |
| `tube/opal.stl`         | Transparent / opal PETG     | Light diffuser, printed in 4 pieces of 25 cm                                                       |
| `case/*.stl`            | PLA                         | Sized for ESP32-S3 + XL4015 DC-DC (see Materials in the main README)                               |

### Slicer settings

I printed everything with the default Creality Slicer profile — nothing tuned for this project specifically. I used a `brim` for the `profile` pieces and for the `opal`. If you have a better profile, contributions are welcome.

## Assembly

The enclosure is designed for:

- ESP32-S3 N16R8 dev board
- XL4015 DC-DC step-down module (24V → 5V)
- 12mm-wide LED strip rail

See the [main README](../README.md) for the full bill of materials and the wiring.

## License

The models in this folder (`.f3d` and `.stl`) are released under [CC0 1.0](./LICENSE) — effectively public domain. Use, modify, and redistribute them freely; no attribution required. They are working prototypes, not optimized designs: if you improve them, share the result so others can benefit too.

## Links

- [Back to the main README](../README.md)
- [Firmware README](../firmware/README.md) — wiring diagram
