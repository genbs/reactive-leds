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
CONFIG_LWIP_UDP_RECVMBOX_SIZE=64
CONFIG_LWIP_TCPIP_TASK_PRIO=1
CONFIG_UDP_RECVMBOX_SIZE=64

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

### VSCode configuration

.vscode/c_cpp_properties.json

```json
{
	"configurations": [
		{
			"name": "Mac",
			"includePath": ["${workspaceFolder}/**", "~/esp/esp-idf/**"],
			"defines": [],
			"macFrameworkPath": ["/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/Frameworks"],
			"compilerPath": "${config:idf.toolsPath}/tools/xtensa-esp-elf/esp-13.2.0_20240530/xtensa-esp-elf/bin/xtensa-esp32s3-elf-gcc",
			"cStandard": "c17",
			"cppStandard": "c++17",
			"intelliSenseMode": "macos-clang-arm64"
		}
	],
	"version": 4
}
```

.vscode/settings.json

```json
{
	"idf.pythonInstallPath": "/usr/bin/python3",
	"idf.port": "/dev/tty.usbmodem1101",
	"idf.openOcdConfigs": ["board/esp32s3-builtin.cfg"],
	"idf.customExtraVars": {
		"IDF_TARGET": "esp32s3"
	},
	"idf.flashType": "UART"
}
```

## TODO

- [] OTA
- [] Multiple stripe support
- [] Static IP
