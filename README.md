<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg" width="180">
  </picture>
</p>

[![Test shared](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-shared.yml)
[![Test cli](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-cli.yml)
[![Test client](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/test-client.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub last commit](https://img.shields.io/github/last-commit/genbs/reactive-leds)](https://github.com/genbs/reactive-leds/commits/master)

# Welcome to Reactive-LEDS

Language: [English](https://github.com/genbs/reactive-leds/blob/master/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/README-it.md)

## Introduction

This project documents my personal experience building a 3D-printed LED tube, controllable over WiFi.

It was born out of a personal need: I wanted lights for my live coding performances, and as a software developer with a 3D printer I had fun building a system that lets me control lights from the browser with minimal latency at a reasonable cost.

The firmware and the 3D models are designed around the hardware I used. Take them as a starting point and adapt them to your own setup.

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

The first time, the device is configured over USB from the site or the CLI, or over BLE with the CLI. After rebooting, it joins the network and is ready to receive commands.

## WLED compatibility

I started developing the firmware out of curiosity and to have full control over the realtime path. Only later did I take a closer look at [WLED](https://kno.wled.ge/), which supports UDP control through DDP.

In tests with ESP32-S3 boards and 16 segments, WLED and reactive-leds were equally smooth at 60 fps. With 90 and 120 fps streams, stock WLED coalesced updates and rendered about 62 frames per second, while the included firmware rendered every frame without drops. For normal browser use at 60 fps, this difference is not significant.

WLED is not currently supported. If you would like to use it with reactive-leds, open a GitHub issue or submit a pull request.

## Repository layout

This is a small monorepo. Each main area has its own folder and its own README.

- [`firmware/`](https://github.com/genbs/reactive-leds/tree/master/firmware): ESP32-S3 firmware and build instructions.
- [`cli/`](https://github.com/genbs/reactive-leds/tree/master/cli): CLI tools and scripts to configure and test the devices and to start the WebSocket control server.
- [`client/`](https://github.com/genbs/reactive-leds/tree/master/client): JavaScript client for real-time control from the browser.
- [`shared/`](https://github.com/genbs/reactive-leds/tree/master/shared): Protocol and shared types used across packages.
- [`3dprint/`](https://github.com/genbs/reactive-leds/tree/master/3dprint): STL models and CAD sources for the enclosure and the LED rail.
- [`docs/`](https://github.com/genbs/reactive-leds/tree/master/docs): the [project site](https://genbs.github.io/reactive-leds/) (GitHub Pages): guided install (CLI + firmware flashing from the browser via Web Serial), live examples and the strip mapping tool.

## Getting started

- Build/flash the firmware: see [`firmware/README.md`](https://github.com/genbs/reactive-leds/blob/master/firmware/README.md).
- CLI tools for testing: see [`cli/README.md`](https://github.com/genbs/reactive-leds/blob/master/cli/README.md).
- Using the JavaScript client: see [`client/README.md`](https://github.com/genbs/reactive-leds/blob/master/client/README.md).
- Protocol/types: see [`shared/README.md`](https://github.com/genbs/reactive-leds/blob/master/shared/README.md).

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

For the rail I printed five 20 cm PLA pieces: either five `profile` pieces, or four `profile` pieces plus the optional `profile_head`. For the diffuser I used four 25 cm pieces of transparent PETG.

## Assembly

1. Print the enclosure parts (`case/*.stl`) and the LED rail (`tube/*.stl`); see [`3dprint/README.md`](https://github.com/genbs/reactive-leds/blob/master/3dprint/README.md) for materials and settings.
2. Solder the 330 Ω resistor on the data line, as close as possible to the start of the LED strip.
3. Connect power supply, DC-DC module, ESP32-S3 and strip following the diagram in [Wiring](https://github.com/genbs/reactive-leds/blob/master/firmware/README.md#wiring).
4. Fit the ESP32-S3 and the DC-DC module into the enclosure, close it with `top`/`bottom`/`tap` — glue the `tap` pieces so the DC-DC module cannot fall out.
5. Glue five rail pieces into the 1 m rail (`profile` × 5, or `profile` × 4 plus `profile_head`), mount the FCOB strip, then glue the four `opal` pieces on as the diffuser.
6. Flash the firmware (see [`firmware/README.md`](https://github.com/genbs/reactive-leds/blob/master/firmware/README.md)) and configure WiFi over USB or BLE with the [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README.md).

## Limitations and known issues

- **Segment-level control, not per-LED**: the FCOB strip has 896 LEDs per meter but only 16 ICs per meter. Control happens per segment (16 segments/m), not per individual LED. This is a deliberate choice: I preferred a brighter strip over resolution.
- **255 LEDs per device**: `num_leds` and `start_index` are single bytes in the UDP protocol. More than enough for segment strips (~15 m of FCOB per device); it is not designed for high-density matrix panels.
- **Color order**: the RGB/WRGB byte sequence depends on the strip's IC. The firmware is configured for the strip listed in Materials. Different strips may need a different order (see `firmware/main/leds.c`).
- **WiFi sleep disabled**: the WiFi radio power-saving mode is explicitly disabled to avoid latency spikes and packet loss during real-time updates.
- **WiFi credentials in cleartext over BLE**: during provisioning the credentials are sent unencrypted. For a personal project simplicity wins, but keep it in mind on sensitive networks.

## Power and safety

The LED strip runs at 24V. Power supply sizing depends on the strip's specs and the real load — as a reference, with all LEDs on the strip draws roughly **1 A per meter**. Use a supply with adequate headroom and proper wiring.
