# Firmware

Language: [English](./README.md) | [Italiano](./README-it.md)

ESP32-S3 firmware for UDP-controlled RGBW LED strips. It connects to WiFi after BLE provisioning and listens for UDP packets to update the LEDs in real time.

For all protocol details, see the [shared README](../shared/README.md).

The firmware is tuned for a 24V FCOB strip with 16 ICs per meter (segment control).

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) v5.5.1 (tested) — [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

**USB driver (macOS/Windows)**: depending on your dev board, the ESP32-S3 shows up either over its native USB (no driver needed, appears as `/dev/cu.usbmodem*`) or through a USB-UART bridge chip. If the port isn't recognized, install the driver for your board's bridge: **CP210x** (Silicon Labs, appears as `/dev/cu.SLAB_USBtoUART`) or **CH340/CH9102** (WCH). Check `ls /dev/cu.*` to see which one your board enumerates as. On Linux these drivers are usually already in the kernel.

## Config and Build

Note: I am primarily a software developer, not a firmware expert. The following configuration is tested for my ESP32-S3 device. Suggestions are welcome.

Project-specific configuration lives in [`sdkconfig.defaults`](./sdkconfig.defaults). ESP-IDF combines it with its own defaults to generate `sdkconfig` at build time (the generated file is gitignored — per-developer state). Key overrides in `sdkconfig.defaults`:

- `CONFIG_BT_BLE_42_FEATURES_SUPPORTED=y` — required by the BLE provisioning GATT server.
- `CONFIG_LWIP_UDP_RECVMBOX_SIZE=6` — small UDP receive mailbox by design. Under overload the kernel drops new arrivals (drop-tail) rather than accumulating stale frames; bounded staleness is ~36 ms at 6 ms polling. See "Design Decisions" for the rationale.
- `CONFIG_LWIP_TCPIP_TASK_PRIO=1` — lower TCP/IP priority so the protocol task (priority 5) can preempt it under load.
- `CONFIG_FREERTOS_HZ=1000` — 1 ms tick granularity for `vTaskDelay`.
- `CONFIG_RMT_ISR_IRAM_SAFE=y` — keeps the RMT interrupt in IRAM so LED signal timing isn't disturbed by flash operations (cache misses). Matters for clean WS2812-style waveforms.
- `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y`, `CONFIG_COMPILER_OPTIMIZATION_PERF=y`, `CONFIG_ESP32S3_INSTRUCTION_CACHE_32KB=y` — performance tuning (max clock, `-O2`, larger I-cache) for the realtime hot path.
- `CONFIG_LOG_DEFAULT_LEVEL_WARN=y` — default runtime log level is WARN, so the verbose `ESP_LOGV`/`ESP_LOGD` traces are compiled out. Raise it (menuconfig → Log output) if you need them while debugging.
- Custom partition table (see [`partitions.csv`](./partitions.csv)).
- Device defaults (`CONFIG_LED_PIN=18`, `CONFIG_NUM_LEDS=16`, `CONFIG_PORT=4210`, `CONFIG_LWIP_LOCAL_HOSTNAME="esp32-X"`).

To change device-specific values for your build, either edit `sdkconfig.defaults` directly or run `idf.py menuconfig` and look under "Device configuration". The hostname follows the convention `esp-[device_id]`.

### Firmware version

The version string returned by the `GET_VERSION` packet (`rleds version <ip>`) comes from `PROJECT_VER`. By default ESP-IDF derives it from `git describe --tags --long --dirty`, so tagging the repo (e.g. `git tag v0.1.0`) is enough. Without any tag, ESP-IDF falls back to `"1"`. To override manually, add `set(PROJECT_VER "0.1.0")` in `CMakeLists.txt` before `idf_component_register`.

After configuration, build and flash the firmware:

1. Build the project

```bash
idf.py build
```

2. Flash the device

```bash
# Replace /dev/tty.usbmodem1101 with your device's port
idf.py -p /dev/tty.usbmodem1101 flash
```

3. Monitor the device

```bash
idf.py -p /dev/tty.usbmodem1101 monitor
```

## Design Decisions

**RMT peripheral for LED signaling**
The WS2812 protocol requires very precise pulse timing (hundreds of nanoseconds). Instead of bit-banging in software — which is unreliable at these timescales and blocks the CPU — the firmware uses the ESP32-S3 RMT (Remote Control) peripheral. RMT handles the signal generation in hardware, freeing the CPU entirely during transmission.

**UDP instead of TCP**
LED updates are sent over UDP. The goal is minimal latency: TCP's delivery guarantees would add buffering and retransmissions that are counterproductive for real-time visuals. A dropped frame is always better than a late one.

Under sustained overload, the small UDP receive mailbox (`CONFIG_LWIP_UDP_RECVMBOX_SIZE = 6`) bounds staleness: when the queue is full the kernel drops new arrivals (drop-tail), so the firmware processes packets in arrival order with a maximum lag of ~36 ms behind real time. This was tested to feel smoother than draining the queue and showing only the latest frame (intermediate frames would have been lost, making animations look choppy).

**BLE provisioning instead of a captive portal**
With the [CLI](../cli/README.md) you can send WiFi credentials to the device over Bluetooth.

> **Security note**: BLE provisioning uses no encryption or pairing — WiFi credentials are transmitted in plaintext and any nearby device can connect during provisioning. This is a deliberate choice for this project: provisioning happens once, at home, before taking the device to a performance. If you provision in a public place, be aware of this.

## Adapting to a different LED strip

The firmware is tuned for a 24 V FCOB strip with WRGB byte order. Different LED ICs expect a different byte order on the wire — if your strip is wrong-colored (e.g. red shows up as green), this is what you change.

The byte order is set in [`firmware/main/leds.c`](../firmware/main/leds.c) inside `leds_update`:

```c
size_t index = pixel_index * 4;
s_led_buffer[index] = w;      // adapt these 4 lines to your strip
s_led_buffer[index + 1] = r;
s_led_buffer[index + 2] = g;
s_led_buffer[index + 3] = b;
```

Common orders:

| LED IC / strip | Bytes per LED | Order |
|---|---|---|
| FCOB (this project) | 4 | W, R, G, B |
| SK6812 RGBW | 4 | R, G, B, W |
| WS2812 / WS2812B | 3 | G, R, B |
| WS2811 | 3 | R, G, B |

If you switch to a 3-byte type (no white channel), also change:
- `s_led_buffer = malloc(config.num_leds * 4)` → `* 3` in `leds_begin`
- `config.num_leds * 4` → `* 3` in `leds_show`

The WS2812 timing constants in `rmt_new_led_strip_encoder` (T0H/T0L/T1H/T1L) work for most WS281x and SK68xx families. Exotic ICs (APA102, SPI-based) need a different encoder entirely.

Making the byte order and pixel size configurable (via Kconfig or runtime config) is a natural next step — PRs welcome.

## Wiring

```
24V PSU
  ├── (+) ──→ DC-DC step-down input (+)
  │            DC-DC output (5V) ──→ ESP32 5V pin
  │            DC-DC GND ──────────→ ESP32 GND
  │
  └── (+) ──→ LED strip (+) 24V
      (-)  ──→ LED strip (-) GND (shared with ESP32 GND)

ESP32 GPIO18 ──→ LED strip data line
```

The XL4015 DC-DC module converts 24V to 5V to power the ESP32. The LED strip runs directly at 24V. All grounds must be connected together.

## Flash layout and OTA

The custom `partitions.csv` defines five partitions sized for the ESP32-S3 N16R8 (16 MB flash):

| Partition | Size | Purpose |
|---|---|---|
| `nvs` | 24 KB | Wi-Fi credentials, device config |
| `phy_init` | 4 KB | RF calibration data |
| `factory` | 1.5 MB | Main app image (USB flash) |
| `ota_0` | 1.5 MB | OTA slot A (reserved, not used yet) |
| `ota_1` | 1.5 MB | OTA slot B (reserved, not used yet) |

**OTA is not implemented.** Updates require USB flashing today. The OTA slots are reserved in the partition table so a future OTA implementation can land without re-partitioning the flash — a re-partition would erase NVS, forcing every device through BLE provisioning again. PRs implementing OTA are welcome.

## Recovery

**Wi-Fi credentials no longer work (e.g. you changed the password on your router).** Power-cycle the device. At boot it tries the saved network for ~20 s, fails, and falls back to BLE provisioning automatically — at which point you can send the new credentials with the CLI (`rleds bt-credential`).

**Device unreachable while powered on after a router change.** Same procedure: power-cycle. The reconnect task in [`main.c`](../firmware/main/main.c) retries indefinitely with the stored (now wrong) credentials and will not self-recover until the next boot. This is intentional: a frozen frame during a live performance is preferable to a surprise reboot.

**Wipe all stored Wi-Fi credentials from a running device.** Send `RESET_WIFI` over UDP (`rleds reset-wifi <ip>`). The device clears NVS, reboots, and comes up in BLE provisioning mode.

## Protocol

The UDP protocol is defined in `shared/protocol.ts`.

## Examples (netcat)

```bash
# send [1,4] to reset WiFi
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210
```

Print response in hex:

```bash
# ping
echo -n -e '\x01\x01' | nc -u -w1 192.168.x.x 4210 | hexdump -C

# set led 1 to red
echo -n -e '\x01\x03\x01\xFF\x00\x00\x00' | nc -u -w1 192.168.x.x 4210 | hexdump -C
```

or

```bash
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210 | xxd -p
```

## Links

- [Back to main README](../README.md)
