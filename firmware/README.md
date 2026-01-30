# Firmware

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) - [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

## Config & Build

⚠️ Note: I'm primarily a software developer, not a firmware expert. The following configuration is tested for my ESP32-S3 device. Suggestions are welcome

1. Menuconfig
   Run idf.py menuconfig and enable the following option:

Component config -> Bluetooth -> Bluedroid Options -> [*] CONFIG_BT_BLE_42_FEATURES_SUPPORTED
CONFIG_LWIP_UDP_RECVMBOX_SIZE=6
CONFIG_LWIP_TCPIP_TASK_PRIO=1
CONFIG_UDP_RECVMBOX_SIZE=6

Setup the "Device configuration"

- Pin: GPIO pin connected to the LED strip (default: 4)
- Number of LEDs: Number of LEDs in the strip (default: 60)
- Brightness: Brightness level (0-255, default: 128)
- Port: UDP port for communication (default: 12345)

NOTE: The hostname is set to CONFIG_LWIP_LOCAL_HOSTNAME, the default is "espressif".

2. Build the project

```bash
idf.py build
```

3. Flash the device

```bash
# Replace /dev/tty.usbmodem1101 with your device's port
idf.py -p /dev/tty.usbmodem1101 flash
```

### Send udp message using netcat

```bash
// send [1,4] to
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210
```

Print result in hex

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

## TODO

- [] OTA
- [] Multiple stripe support
- [] Static IP
