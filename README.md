# reactive-leds

Language: [English](./README.md) | [Italiano](./README-it.md)

## Introduction

This project shares my personal experience building a 3D-printed LED tube that can be controlled over WiFi in realtime.

It started as a personal need: I wanted lights for my live coding performances, and as a software developer with a 3D printer I had fun building a system to control them in realtime from the browser, with minimal latency and browser-based integration.

The firmware and 3D models are designed around the exact hardware I used. You can treat this as a starting point and adapt it to your setup.

If you are looking for a general-purpose LED controller for home use, [WLED](https://kno.wled.ge/) is the right choice: mature, feature-rich, and with a large community.

## Result

The current build is a 1 meter tube with a 24V FCOB strip, connected to an ESP32-S3, powered by a 24V PSU, and controllable via WebSocket or UDP.
You can build as many strips as you want — just connect them to the same WiFi network.

## How it works

The full data flow:

```
browser
  → WebSocket → CLI proxy (ws)
    → UDP → ESP32-S3
      → RMT peripheral
        → LED strip
```

The browser cannot send UDP directly, so the CLI exposes a local WebSocket proxy that bridges to the device. The ESP32 receives UDP packets and updates the strip via the RMT peripheral, which handles signal timing in hardware without involving the CPU.

On first use the device is provisioned via BLE: a CLI command sends WiFi credentials to the device over Bluetooth. After reboot the device connects to the network and is ready to receive UDP commands.

## Repository Structure

This is a small monorepo. Each major area has its own folder and README.

- `firmware/`: ESP32-S3 firmware and build instructions.
- `cli/`: CLI tools and scripts for provisioning and testing devices, and running the WebSocket proxy.
- `client/`: JavaScript client for realtime control in the browser.
- `shared/`: Shared protocol and types used across packages.
- `3dprint/`: STL models and CAD source for the enclosure and LED rail. See [3dprint/README.md](./3dprint/README.md).

## Getting Started

- Firmware build/flash: see `firmware/README.md`.
- CLI tools: see `cli/README.md`.
- JavaScript client: see `client/README.md`.
- Protocol/types: see `shared/README.md`.

## Materials

- [LED strip FCOB 24V](https://it.aliexpress.com/item/1005007316659176.html)
- [DC-DC module XL4015 (24V → 5V)](https://it.aliexpress.com/item/1005008231627584.html)
- [ESP32-S3](https://it.aliexpress.com/item/1005005045724400.html)
- [24V power supply](https://www.amazon.it/dp/B0C8CM7GS7)
- [Power cable](https://it.aliexpress.com/item/1005007046323657.html)
- [JST](https://it.aliexpress.com/item/1005005362711029.html) ([alternative](https://it.aliexpress.com/item/1005004615616698.html))

These are the components I used, but the project can be adapted to similar strips and hardware. Make sure to configure the firmware correctly for your strip (color order, number of segments, etc).

## 3D Printing

The models and settings are a starting point — I am not a 3D printing expert.
The case is designed to fit the ESP32-S3 and the DC-DC module listed above, along with a 12mm LED strip profile.

For the profile I printed 5 pieces in PLA, each 20cm long. For the diffuser bar I used transparent PETG, each piece 25cm long.

## Limitations and Known Issues

- **Segment control, not per-LED**: the FCOB strip has 896 LEDs per meter but only 16 ICs per meter. Control is per segment (16 segments/m), not per individual LED. This was an intentional trade-off for brightness over resolution.
- **Color order**: the RGB/WRGB byte order depends on the LED IC. The current firmware is set for the strip listed in Materials. Different strips may need a different order (see `firmware/main/leds.c`).
- **WiFi sleep disabled**: power saving mode on the WiFi radio is explicitly disabled to avoid latency spikes and packet loss during realtime updates.
- **WiFi credentials in plaintext over BLE**: during provisioning, credentials are sent unencrypted. For a personal project simplicity takes priority, but keep this in mind if you use sensitive networks.

## Power and Safety

The LED strip runs at 24V. PSU sizing depends on the strip specifications and real load. Use a power supply with adequate headroom and proper wiring.
