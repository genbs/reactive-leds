<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg">
    <img alt="rleds logo" src="https://raw.githubusercontent.com/genbs/reactive-leds/master/docs/logo-black.svg" width="180">
  </picture>
</p>

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Firmware Build](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml/badge.svg)](https://github.com/genbs/reactive-leds/actions/workflows/firmware-build.yml)

# Firmware

Language: [English](https://github.com/genbs/reactive-leds/blob/master/firmware/README.md) | [Italiano](https://github.com/genbs/reactive-leds/blob/master/firmware/README-it.md)

This is the heart of the project: the firmware that runs on the ESP32, receives commands over UDP and updates the LEDs in real time.

On first boot the firmware waits for WiFi credentials over BLE or USB serial. Once it receives them, it joins the network and listens for [UDP packets](#protocol).

The firmware is tuned for a 24V FCOB strip with 16 ICs per meter and WRGB byte order, but can be adapted to other strips — see [Adapting to a different LED strip](#adapting-to-a-different-led-strip).

> **Don't want to build?** You can flash the latest release straight from the browser on the [project site](https://genbs.github.io/reactive-leds/) (Chrome/Edge, via Web Serial) — no ESP-IDF install needed. The rest of this README only matters if you want to modify or rebuild the firmware.

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) v5.5.X — [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

**USB drivers (macOS/Windows)**: depending on the dev board, the ESP32 shows up over native USB (no driver, e.g. `/dev/cu.usbmodem*`) or through a USB-UART bridge chip. If the port is not recognized, install the driver for your board's bridge: **CH340/CH9102** (WCH, shows up as `/dev/cu.wchusbserial*`) or **CP210x** (Silicon Labs, shows up as `/dev/cu.SLAB_USBtoUART`). Use `ls /dev/cu.*` to see how your board appears. On Linux these drivers are usually already in the kernel.

## Configuration and build

> **Note**: the following configuration is tested on my ESP32-S3. Suggestions and PRs are welcome.

The configuration lives in [`sdkconfig.defaults`](https://github.com/genbs/reactive-leds/blob/master/firmware/sdkconfig.defaults).
ESP-IDF combines it with its own defaults to generate `sdkconfig` at build time:

- `CONFIG_BT_BLE_42_FEATURES_SUPPORTED=y` — required by the BLE provisioning GATT server.
- `CONFIG_LWIP_UDP_RECVMBOX_SIZE=6` — small UDP receive mailbox by design. Under overload the kernel drops new arrivals (drop-tail) instead of building an unbounded queue. See "Design choices" for the rationale.
- `CONFIG_LWIP_LOCAL_HOSTNAME="esp32-X"` — initial hostname used before a saved runtime config overrides it.
- `CONFIG_FREERTOS_HZ=1000` — 1 ms granularity for `vTaskDelay`. Required by the 1 ms protocol poll: at the 100 Hz default, `pdMS_TO_TICKS(1)` would round down to 0 ticks.
- `CONFIG_RMT_ENCODER_FUNC_IN_IRAM=y`, `CONFIG_RMT_ISR_IRAM_SAFE=y`, `CONFIG_GDMA_ISR_IRAM_SAFE=y` — keep the RMT encoder, RMT interrupt and GDMA interrupt IRAM-safe. This protects an in-flight transfer even if a flash-cache-disable window (e.g. an NVS write) overlaps it.
- `CONFIG_LWIP_TCPIP_TASK_AFFINITY_CPU0=y`, `CONFIG_FREERTOS_TIMER_TASK_AFFINITY_CPU0=y` — pin the WiFi/lwIP stack to core 0, leaving core 1 to the protocol/render task (`xTaskCreatePinnedToCore(..., 1)` in `main.c`). Isolates the realtime path from the network stack.
- `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y`, `CONFIG_COMPILER_OPTIMIZATION_PERF=y`, `CONFIG_ESP32S3_INSTRUCTION_CACHE_32KB=y`, `CONFIG_ESP32S3_DATA_CACHE_64KB=y` — performance tuning (max clock, `-O2`, larger I-cache and D-cache) for the realtime path.
- Custom partition table (see [`partitions.csv`](https://github.com/genbs/reactive-leds/blob/master/firmware/partitions.csv)).

The device-specific defaults (`LED_PIN=18`, `NUM_LEDS=16`, `PORT=4210`) live in [`main/Kconfig.projbuild`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/Kconfig.projbuild). Change them with `idf.py menuconfig` before building, or update each flashed device at runtime with `rleds config`.

### Device configuration

Run `idf.py menuconfig` and look under "Device configuration".
There you can change:

- `LED_PIN` — GPIO for the LED strip data line (default 18)
- `NUM_LEDS` — number of LEDs on the strip (default 16)
- `PORT` — UDP port the firmware listens on (default 4210)

The `hostname` is configurable under "Component config → LWIP". Its build-time default is the literal value `esp32-X`; choose a unique value for each device at runtime. A recognizable pattern helps identify devices on the network (for example, `rleds-1`, `rleds-2`).

### Firmware version

By default ESP-IDF derives it from `git describe --tags --long --dirty`, so tagging the repo is enough (e.g. `git tag vX.Y.Z`). To override manually, add `set(PROJECT_VER "X.Y.Z")` in `CMakeLists.txt` before `idf_component_register`.

### One build, many devices

You only need to build once. The Kconfig defaults (`pin=18`, `num_leds=16`, `port=4210`) are a starting point — after flashing you can change all of them at runtime with `rleds config <host[:port]> <key> <value>` without rebuilding. The device reboots and loads the new config from NVS.

This means you can flash the same binary on all your devices and configure each one individually from the [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README.md).

The most important thing to set on each device is the **hostname** — it identifies the device uniquely on the network and it is what `rleds scan` shows. Set it right after the first flash:

```bash
rleds config <host> hostname esp32-1
```

After that you can use the hostname instead of the IP in any command:

```bash
rleds ping esp32-1
rleds config esp32-1 hostname esp32-2
```

### Build and flash

Once configured, build and flash the firmware with:

1. Build the project

```bash
idf.py build
```

2. Flash the device

**Note**: replace `/dev/tty.wchusbserialXXXX` with your device's port

```bash
idf.py -p /dev/tty.wchusbserialXXXX flash
```

3. Monitor the device

```bash
idf.py -p /dev/tty.wchusbserialXXXX monitor
```

## Design choices

**RMT peripheral for the LED signal**
The WS2812 protocol requires nanosecond-precise timing. Instead of bit-banging the signal in software — slow, imprecise and CPU-blocking — the firmware uses the ESP32-S3's RMT peripheral. RMT generates the signal in hardware: the CPU is not involved during transmission and stays free for everything else.

**UDP instead of TCP**
LED updates travel over UDP. The goal is minimal latency: TCP's delivery guarantees would introduce buffering and retransmissions that are counterproductive in a real-time context. A lost frame always beats a late frame.

Under sustained load, the small UDP mailbox (`CONFIG_LWIP_UDP_RECVMBOX_SIZE = 6`) bounds the queued work: when the queue is full the kernel drops new arrivals (drop-tail), so the firmware keeps processing packets in arrival order instead of building a long backlog. Tested empirically, this feels smoother than draining the queue and showing only the last frame (intermediate frames would be lost and animations look choppy).

**WiFi tuned for a stationary device**
The device never moves, so 802.11k/v roaming is disabled (`rm_enabled = 0`, `btm_enabled = 0` in `wifi.c`) and association uses `WIFI_FAST_SCAN`. The periodic background channel scans that roaming triggers briefly interrupt UDP reception — visible as animation stutter. Disabling them eliminated the periodic hiccups; the residual random stutter is an intrinsic WiFi limit, not something further config tweaks can fix.

**Provisioning without a captive portal**
The [site](https://genbs.github.io/reactive-leds/) can send credentials over USB immediately after flashing. Alternatively, the [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README.md) can send them over Bluetooth. Both transports use the same length-prefixed payload documented in [`shared/README.md`](https://github.com/genbs/reactive-leds/blob/master/shared/README.md#ble-and-usb-provisioning).

> ⚠️ **Security note**: BLE provisioning uses no encryption and no pairing — WiFi credentials travel in cleartext and any nearby device can connect during the configuration phase. For this project it is a deliberate choice: provisioning happens once, in a controlled environment (home), before taking the device to a performance. If you configure the device in public places, keep that in mind.

## Adapting to a different LED strip

The firmware is tuned for a 24V FCOB strip with WRGB byte order. Different LED ICs expect a different order on the wire — if your strip shows the wrong colors (e.g. red displayed as green), this is what you need to change.

The byte order is set in [`firmware/main/leds.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/leds.c) inside `leds_update`:

```c
size_t index = pixel_index * 4;
buf[index] = w;      // adapt these 4 lines to your strip
buf[index + 1] = r;
buf[index + 2] = g;
buf[index + 3] = b;
```

Common orders:

| IC / strip             | Bytes per LED | Order      |
| ---------------------- | ------------- | ---------- |
| FCOB (this project)    | 4             | W, R, G, B |
| SK6812 RGBW            | 4             | R, G, B, W |
| WS2812 / WS2812B       | 3             | G, R, B    |
| WS2811                 | 3             | R, G, B    |

If you switch to a 3-byte type (no white channel), also change:

- `buffer_size = config.num_leds * 4` → `* 3` in `leds_begin` (sizes both double-buffering buffers)
- `config.num_leds * 4` → `* 3` in `leds_show`

The WS2812 timing constants in `rmt_new_led_strip_encoder` (T0H/T0L/T1H/T1L) work for most WS281x and SK68xx families. Exotic ICs (APA102, SPI-based) need a completely different encoder.

Making the byte order and pixel size configurable (via Kconfig or runtime config) could be a next step — PRs welcome.

## Wiring

```
[24V power supply]
   ├── (+) 24V ───┬──→ [IN+]  XL4015 module  [OUT+] (5V) ──→ ESP32 (5V pin)
   │              └──→ (+) 24V LED strip
   │
   └── (-) GND ───┬──→ [IN-]  XL4015 module  [OUT-] (GND) ─┬─→ ESP32 (GND pin)
                  └──→ (-) LED strip ──────────────────────┘ (common ground)

ESP32 GPIO18 ──→ 330 Ω resistor ──→ LED strip data line
```

The XL4015 module steps the voltage down from 24V to 5V to power the ESP32. The LED strip runs directly at 24V. All grounds must be connected together.
The 330 Ω resistor goes in series on the data line, as close as possible to the strip, to reduce ringing and keep the LED signal clean.

## Flash layout and OTA

The custom `partitions.csv` defines five partitions sized for the ESP32-S3 N16R8 (16 MB flash):

| Partition  | Size   | Purpose                                  |
| ---------- | ------ | ---------------------------------------- |
| `nvs`      | 24 KB  | WiFi credentials, device configuration   |
| `phy_init` | 4 KB   | RF calibration data                      |
| `factory`  | 1.5 MB | Main image (flashed over USB)            |
| `ota_0`    | 1.5 MB | OTA slot A (reserved, not used yet)      |
| `ota_1`    | 1.5 MB | OTA slot B (reserved, not used yet)      |

**OTA is not implemented.** Today updates require flashing over USB. The OTA slots are reserved in the partition table so a future OTA implementation can land without re-partitioning the flash — a re-partition would erase NVS, forcing every device back through BLE provisioning. If someone feels like implementing OTA, go for it.

## Protocol

The UDP protocol is defined in [`shared/`](https://github.com/genbs/reactive-leds/blob/master/shared/README.md): binary packets `[PacketID, PacketType, ...data]` on port 4210 (or whichever is configured).

For everyday use there is the [CLI](https://github.com/genbs/reactive-leds/blob/master/cli/README.md), but since it is just bytes over UDP you can also drive the device from a shell one-liner — handy for quick debugging or to understand how it works. Print the response with `xxd` or `hexdump -C`:

```bash
# PING (type 0): is the device alive?
echo -n -e '\x01\x00' | nc -u -w1 192.168.x.x 4210 | xxd
# expected response: 01 00 01  → PacketID=1, PING, status=1 (OK)

# GET_CONFIG (type 1): read pin, num_leds, port, hostname
echo -n -e '\x01\x01' | nc -u -w1 192.168.x.x 4210 | xxd

# GET_INFO (type 5): IP, port, MAC, firmware version, hostname
echo -n -e '\x01\x05' | nc -u -w1 192.168.x.x 4210 | xxd

# GET_STATUS (type 6): fixed runtime-status snapshot
echo -n -e '\x01\x06' | nc -u -w1 192.168.x.x 4210 | xxd
# response: 91 bytes fixed (2-byte header + 89-byte payload)
# The counters are maintained since boot; GET_STATUS does not run a benchmark.
# Full field layout: shared/README.md#GET_STATUS-format

# SET_LEDS (type 3): turn LED 1 red — fire-and-forget, no response
echo -n -e '\x01\x03\x01\xFF\x00\x00\x00' | nc -u -w1 192.168.x.x 4210
```

## Recovery

**The WiFi credentials stopped working (e.g. you changed the router password).** Power-cycle the device. At boot it scans the visible networks and tries every saved network it finds for up to ~20s each before moving on or falling back to provisioning. You can then send new credentials over USB or with the CLI (`rleds bt-credential`). If the device is already on when you change the password, the reconnect task in [`main.c`](https://github.com/genbs/reactive-leds/blob/master/firmware/main/main.c) keeps retrying the stored (now wrong) credentials until you reboot it.

**Clear all WiFi credentials from a powered device.** Send `RESET_WIFI` over UDP (`rleds reset-wifi <host[:port]>`). The device deletes the saved WiFi credentials, reboots, and starts provisioning again.

**`SET_CONFIG` is best-effort, not atomic.** Each field (pin, num_leds, port, hostname) is written to NVS separately. If a storage error happens mid-sequence, the device may reboot with a partially updated config. Fix: send `SET_CONFIG` again with the correct values — that overwrites the bad fields. (`RESET_WIFI` won't help: it only clears the WiFi credentials namespace and does not touch the config namespace, so it cannot repair a partial config.)

## Links

- [Back to the main README](https://github.com/genbs/reactive-leds/blob/master/README.md)
