<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg" width="180">
  </picture>
</p>

[![Test shared](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![Test cli](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![Test client](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub last commit](https://img.shields.io/github/last-commit/genbs/reactive-leds)](https://github.com/genbs/reactive-leds/commits/master)

# Welcome to Reactive-LEDS

Language: [English](./README.md) | [Italiano](./README-it.md)

## Introduction

This project documents my personal experience building a 3D-printed LED tube, controllable over WiFi.

It was born out of a personal need: I wanted lights for my live coding performances, and as a software developer with a 3D printer I had fun building a system that lets me control lights from the browser with minimal latency at a reasonable cost.

The firmware and the 3D models are designed around the hardware I used. Take them as a starting point and adapt them to your own setup.

If you are looking for an LED controller for home use, [WLED](https://kno.wled.ge/) is the right choice: mature, feature-rich, and backed by a large community.

## Result

The current build is a 1-meter tube with a 24V FCOB strip, driven by an ESP32-S3 microcontroller, all powered by a 24V supply and controllable over WebSocket or UDP.
You can build as many strips as you want — just connect them to the same network.

## How it works

The complete flow:

```
browser
  → WebSocket → CLI proxy (ws)
    → UDP → ESP32-S3
      → RMT peripheral
        → LED strip
```

Browsers cannot send UDP directly, so the CLI exposes a local WebSocket proxy that bridges to the device. The ESP32 receives the UDP packets and updates the strip through the RMT peripheral, which generates the signal in hardware without involving the CPU.

The first time, the device is configured over BLE: a CLI command sends the WiFi credentials to the device via Bluetooth. After rebooting, the device joins the network and is ready to receive commands.

## Repository layout

This is a small monorepo. Each main area has its own folder and its own README.

- [`firmware/`](firmware/): ESP32-S3 firmware and build instructions.
- [`cli/`](cli/): CLI tools and scripts to configure and test the devices and to start the WebSocket control server.
- [`client/`](client/): JavaScript client for real-time control from the browser.
- [`shared/`](shared/): Protocol and shared types used across packages.
- [`3dprint/`](3dprint/): STL models and CAD sources for the enclosure and the LED rail.
- [`docs/`](docs/): the [project site](https://genbs.github.io/reactive-leds/) (GitHub Pages): guided install (CLI + firmware flashing from the browser via Web Serial), live examples and the strip mapping tool.

## Getting started

- Build/flash the firmware: see [`firmware/README.md`](firmware/README.md).
- CLI tools for testing: see [`cli/README.md`](cli/README.md).
- Using the JavaScript client: see [`client/README.md`](client/README.md).
- Protocol/types: see [`shared/README.md`](shared/README.md).

## Materials

- [24V FCOB LED strip](https://it.aliexpress.com/item/1005007316659176.html)
- [XL4015 DC-DC module (24V → 5V)](https://it.aliexpress.com/item/1005008231627584.html)
- [ESP32-S3](https://it.aliexpress.com/item/1005005045724400.html)
- [24V power supply](https://www.amazon.it/dp/B0C8CM7GS7)
- [Power cable](https://it.aliexpress.com/item/1005007046323657.html)
- [JST](https://it.aliexpress.com/item/1005005362711029.html) ([alternative](https://it.aliexpress.com/item/1005004615616698.html)) pick the 3-pin variant (VCC, GND, DATA)
- 330 Ω resistor in series on the LED data line

These are the materials I used, but the project adapts to similar strips and components. Just make sure to configure the firmware for your strip (color order, number of segments, etc.). ESP32-S3 modules with PSRAM are fine, but PSRAM is not required for this use case: the realtime LED path uses small buffers in internal RAM.

## 3D printing

The models and settings are only a starting point — I am not a 3D printing expert.
The enclosure is designed to house the ESP32-S3 and the DC-DC module listed above, together with a 12mm LED strip rail.

For the rail I printed 5 PLA pieces, 20 cm each. For the diffuser bar I used transparent PETG, 4 pieces of 25 cm.

## Assembly

1. Print the enclosure parts (`case/*.stl`) and the LED rail (`tube/*.stl`); see [`3dprint/README.md`](3dprint/README.md) for materials and settings.
2. Solder the 330 Ω resistor on the data line, as close as possible to the start of the LED strip.
3. Connect power supply, DC-DC module, ESP32-S3 and strip following the diagram in [Wiring](firmware/README.md#wiring).
4. Fit the ESP32-S3 and the DC-DC module into the enclosure, close it with `top`/`bottom`/`tap` — glue the `tap` pieces so the DC-DC module cannot fall out.
5. Glue the 5 `profile` pieces together into the 1m rail, mount the FCOB strip, then glue the 4 `opal` pieces on as the diffuser.
6. Flash the firmware (see [`firmware/README.md`](firmware/README.md)) and configure WiFi over BLE with the [CLI](cli/README.md).

## Limitations and known issues

- **Segment-level control, not per-LED**: the FCOB strip has 896 LEDs per meter but only 16 ICs per meter. Control happens per segment (16 segments/m), not per individual LED. This is a deliberate choice: I preferred a brighter strip over resolution.
- **255 LEDs per device**: `num_leds` and `pixel_index` are single bytes in the UDP protocol. More than enough for segment strips (~15 m of FCOB per device); it is not designed for high-density matrix panels.
- **Color order**: the RGB/WRGB byte sequence depends on the strip's IC. The firmware is configured for the strip listed in Materials. Different strips may need a different order (see `firmware/main/leds.c`).
- **WiFi sleep disabled**: the WiFi radio power-saving mode is explicitly disabled to avoid latency spikes and packet loss during real-time updates.
- **WiFi credentials in cleartext over BLE**: during provisioning the credentials are sent unencrypted. For a personal project simplicity wins, but keep it in mind on sensitive networks.

## Power and safety

The LED strip runs at 24V. Power supply sizing depends on the strip's specs and the real load — as a reference, with all LEDs on the strip draws roughly **1 A per meter**. Use a supply with adequate headroom and proper wiring.
