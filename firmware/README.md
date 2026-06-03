# Firmware

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Firmware Build](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml)

Language: [English](./README.md) | [Italiano](./README-it.md)

This is the heart of the project: the firmware running on the ESP32-S3, receiving commands via UDP and updating the LEDs in realtime with minimal latency.

On first boot, the firmware enters BLE provisioning mode, where it waits for WiFi credentials from a client (e.g. the [CLI](../cli/README.md)). After receiving credentials, it connects to the network and listens for [UDP packets](#protocol).

The firmware is tuned for a 24V FCOB strip with 16 ICs and WRGB byte order, but it can be adapted to others — see [Adapting to a different LED strip](#adapting-to-a-different-led-strip).

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) v5.5.X — [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

**USB driver (macOS/Windows)**: depending on the dev board, the ESP32-S3 appears via native USB (no driver, as `/dev/cu.usbmodem*`) or via a USB-UART bridge chip. If the port is not recognized, install the bridge driver for your board: **CH340/CH9102** (WCH, appears as `/dev/cu.wchusbserial*`) or **CP210x** (Silicon Labs, appears as `/dev/cu.SLAB_USBtoUART`). Use `ls /dev/cu.*` to see how your board appears. On Linux these drivers are usually already in the kernel.

## Configuration and Build

> **Note**: The following configuration is tested on my ESP32-S3. Suggestions and PRs are welcome.

Configuration is in [`sdkconfig.defaults`](./sdkconfig.defaults).
ESP-IDF combines it with its own defaults to generate `sdkconfig` at build time:

- `CONFIG_BT_BLE_42_FEATURES_SUPPORTED=y` — required by the BLE provisioning GATT server.
- `CONFIG_LWIP_UDP_RECVMBOX_SIZE=6` — small UDP receive mailbox by design. Under overload the kernel drops new arrivals (drop-tail) instead of accumulating stale frames; delay is bounded to ~36 ms with a 6 ms poll. See "Design choices" for the rationale.
- `CONFIG_LWIP_TCPIP_TASK_PRIO=1` — low TCP/IP priority so the protocol task (priority 5) can preempt it under load.
- `CONFIG_FREERTOS_HZ=1000` — 1 ms granularity for `vTaskDelay`.
- `CONFIG_RMT_ISR_IRAM_SAFE=y` — keeps the RMT interrupt in IRAM, so LED signal timing is not disturbed by flash accesses (cache misses). This matters for clean WS2812 waveforms.
- `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y`, `CONFIG_COMPILER_OPTIMIZATION_PERF=y`, `CONFIG_ESP32S3_INSTRUCTION_CACHE_32KB=y` — performance tuning (max clock, `-O2`, larger I-cache) for the realtime path.
- `CONFIG_LOG_DEFAULT_LEVEL_WARN=y` — default runtime log level is WARN, so verbose `ESP_LOGV`/`ESP_LOGD` traces are excluded from the build. Raise it (menuconfig → Log output) if you need them for debugging.
- Custom partition table (see [`partitions.csv`](./partitions.csv)).
- Device defaults (`CONFIG_LED_PIN=18`, `CONFIG_NUM_LEDS=16`, `CONFIG_PORT=4210`, `CONFIG_LWIP_LOCAL_HOSTNAME="esp32-X"`).

To change device-specific values, edit `sdkconfig.defaults` directly.

### Device configuration

Run `idf.py menuconfig` and look under "Device configuration".
There you can change:

- `LED_PIN` — GPIO for the LED strip data line (default 18)
- `NUM_LEDS` — number of LEDs on the strip (default 16)
- `PORT` — UDP port the firmware listens on (default 4210)

The `hostname` is configurable under "Component config → LWIP". Default is `esp32-X` where `X` is the device ID. Pick something recognizable to identify devices on the network (e.g. `rleds-1`, `rleds-2`).

### Firmware version

By default ESP-IDF derives it from `git describe --tags --long --dirty`, so just tag the repo (e.g. `git tag vX.Y.Z`). For a manual override, add `set(PROJECT_VER "X.Y.Z")` in `CMakeLists.txt` before `idf_component_register`.

### Build and flash

After configuring, build and flash the firmware:

1. Build the project

```bash
idf.py build
```

2. Flash the device

**Note**: Replace `/dev/tty.wchusbserialXXXX` with your device port.

```bash
idf.py -p /dev/tty.wchusbserialXXXX flash
```

3. Monitor the device

```bash
idf.py -p /dev/tty.wchusbserialXXXX monitor
```

## Design Choices

**RMT peripheral for the LED signal**
The WS2812 protocol requires nanosecond-precise timing. Instead of generating the signal in software — slow, imprecise, and CPU-blocking — the firmware uses the ESP32-S3 RMT peripheral. RMT generates the signal in hardware: the CPU is not involved during transmission and remains free for other work.

**UDP instead of TCP**
LED updates travel over UDP. The goal is minimum latency: TCP's delivery guarantees introduce buffers and retransmissions that are counterproductive in a realtime context. A dropped frame is always better than a late frame.

Under sustained load, the small UDP mailbox (`CONFIG_LWIP_UDP_RECVMBOX_SIZE = 6`) bounds delay: when the queue is full the kernel drops new arrivals (drop-tail), so the firmware processes packets in arrival order with a maximum delay of ~36 ms from the present. Tested empirically, this feels smoother than draining the queue and showing only the last frame (intermediate frames would be lost and animations appear choppy).

**BLE provisioning instead of captive portal**
With the [CLI](../cli/README.md) you can send WiFi credentials over Bluetooth.

> ⚠️ **Security note**: BLE provisioning uses no encryption or pairing — WiFi credentials travel in plaintext and any nearby device can connect during the provisioning window. For this project this is a deliberate choice: provisioning happens once, in a controlled environment (home), before taking the device to a performance. Keep this in mind if you provision in public places.

## Adapting to a different LED strip

The firmware is tuned for a 24V FCOB strip with WRGB byte order. Different LED ICs expect a different wire order — if your strip shows wrong colors (e.g. red appears as green), this is what you need to change.

The byte order is set in [`firmware/main/leds.c`](../firmware/main/leds.c) inside `leds_update`:

```c
size_t index = pixel_index * 4;
s_led_buffer[index] = w;      // adapt these 4 lines to your strip
s_led_buffer[index + 1] = r;
s_led_buffer[index + 2] = g;
s_led_buffer[index + 3] = b;
```

Common orders:

| IC / strip             | Bytes per LED | Order      |
| ---------------------- | ------------- | ---------- |
| FCOB (this project)    | 4             | W, R, G, B |
| SK6812 RGBW            | 4             | R, G, B, W |
| WS2812 / WS2812B       | 3             | G, R, B    |
| WS2811                 | 3             | R, G, B    |

If you switch to a 3-byte type (no white channel), also change:

- `s_led_buffer = malloc(config.num_leds * 4)` → `* 3` in `leds_begin`
- `config.num_leds * 4` → `* 3` in `leds_show`

The WS2812 timing constants in `rmt_new_led_strip_encoder` (T0H/T0L/T1H/T1L) work for most WS281x and SK68xx families. Exotic ICs (APA102, SPI-based) require a completely different encoder.

Making the byte order and pixel size configurable (via Kconfig or runtime config) is a natural next step — PRs welcome.

## Wiring

```
24V PSU
  ├── (+) ──→ DC-DC XL4015 input (+)
  │            DC-DC output (5V) ──→ ESP32 5V pin
  │            DC-DC GND ─────────→ ESP32 GND
  │
  └── (+) ──→ LED strip (+) 24V
      (-)  ──→ LED strip (-) GND (shared with ESP32 GND)

ESP32 GPIO18 ──→ 330 Ω resistor ──→ LED strip data line
```

The XL4015 module steps down from 24V to 5V to power the ESP32. The LED strip runs directly at 24V. All GNDs must be connected together.
The 330 Ω resistor is in series on the data line, as close to the strip as practical, to reduce ringing and keep the LED signal clean.

## Flash layout and OTA

The custom `partitions.csv` defines five partitions sized for the ESP32-S3 N16R8 (16 MB flash):

| Partition  | Size   | Purpose                                     |
| ---------- | ------ | ------------------------------------------- |
| `nvs`      | 24 KB  | WiFi credentials, device configuration      |
| `phy_init` | 4 KB   | RF calibration data                         |
| `factory`  | 1.5 MB | Main image (flashed via USB)                |
| `ota_0`    | 1.5 MB | OTA slot A (reserved, not yet implemented)  |
| `ota_1`    | 1.5 MB | OTA slot B (reserved, not yet implemented)  |

**OTA is not implemented.** Updates currently require USB flash. The OTA slots are reserved in the partition table so a future OTA implementation can land without repartitioning — repartitioning would erase NVS, forcing every device through BLE provisioning again. PRs to implement OTA are welcome.

## Protocol

The UDP protocol is defined in [`shared/`](../shared/README.md): binary packets `[PacketID, PacketType, ...data]` on port 4210 (or as configured).

For normal use there is the [CLI](../cli/README.md), but since it is just bytes over UDP you can also drive the device with a shell one-liner — handy for quick debugging. The response prints with `xxd` or `hexdump -C`:

```bash
# PING (type 0): is the device alive?
echo -n -e '\x01\x00' | nc -u -w1 192.168.x.x 4210 | xxd
# expected response: 01 00 01  → PacketID=1, PING, status=1 (OK)

# GET_CONFIG (type 1): read pin, num_leds, port, hostname
echo -n -e '\x01\x01' | nc -u -w1 192.168.x.x 4210 | xxd

# GET_STATUS (type 6): uptime, free heap, WiFi RSSI
echo -n -e '\x01\x06' | nc -u -w1 192.168.x.x 4210 | xxd
# response: 11 bytes → id, type, uptime (4 B BE), heap (4 B BE), rssi (1 B, int8)

# SET_LEDS (type 3): turn LED 1 red — fire-and-forget, no response
echo -n -e '\x01\x03\x01\xFF\x00\x00\x00' | nc -u -w1 192.168.x.x 4210
```

## Recovery

**WiFi credentials no longer work (e.g. you changed the router password).** Power-cycle the device. On boot it tries the saved network for ~20 s, fails, and falls back to BLE provisioning — at that point you can send new credentials with the CLI (`rleds bt-credential`). If the device is already running when you change the password, the same remedy applies: the reconnect task in [`main.c`](../firmware/main/main.c) keeps retrying with the stored (now wrong) credentials until you reboot. This is intentional: a frozen frame during a live performance is preferable to a sudden reboot.

**Clear all WiFi credentials from a running device.** Send `RESET_WIFI` via UDP (`rleds reset-wifi <ip>`). The device clears NVS, reboots, and starts in BLE provisioning mode.

## Links

- [Back to main README](../README.md)
