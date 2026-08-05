<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg" width="180">
  </picture>
</p>

# 3D Print

Language: [English](https://github.com/genbs/reactive-leds/blob/master/3dprint/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/3dprint/README-it.md)

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
    ├── profile.stl         # Rail for the FCOB strip (PLA, 5 × 20 cm; use 4 with profile_head)
    ├── profile_head.stl    # Optional first rail piece with solder-joint clearance (PLA, 1 × 20 cm)
    └── opal.stl            # Translucent diffuser (PETG, 4 pieces of 25cm)
```

The `.f3d` file is the Fusion 360 source — open it if you want to change dimensions, swap connectors, or fit a different strip width.

## Materials and settings

| Part                    | Material                    | Notes                                                                                              |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `tube/profile.stl`      | PLA                         | 5 pieces × 20 cm, or 4 pieces when using `profile_head`, to make a 1 m rail                        |
| `tube/profile_head.stl` | PLA                         | 1 optional 20 cm piece that replaces the first `profile` and adds clearance for the solder joints |
| `tube/opal.stl`         | Transparent / opal PETG     | Light diffuser, printed in 4 pieces of 25 cm                                                       |
| `case/*.stl`            | PLA                         | Sized for ESP32-S3 + XL4015 DC-DC (see Materials in the main README)                               |

### Slicer settings

I printed everything with the default Creality Slicer profile — nothing tuned for this project specifically. I used a `brim` for the `profile` pieces and for the `opal`. If you have a better profile, contributions are welcome.

## Assembly

The enclosure is designed for:

- ESP32-S3 N16R8 dev board
- XL4015 DC-DC step-down module (24V → 5V)
- 12mm-wide LED strip rail

See the [main README](https://github.com/genbs/reactive-leds/blob/master/README.md) for the full bill of materials and the wiring.

## License

The models in this folder (`.f3d` and `.stl`) are released under [CC0 1.0](https://github.com/genbs/reactive-leds/blob/master/3dprint/LICENSE) — effectively public domain. Use, modify, and redistribute them freely; no attribution required. They are working prototypes, not optimized designs: if you improve them, share the result so others can benefit too.

## Links

- [Back to the main README](https://github.com/genbs/reactive-leds/blob/master/README.md)
- [Firmware README](https://github.com/genbs/reactive-leds/blob/master/firmware/README.md) — wiring diagram
