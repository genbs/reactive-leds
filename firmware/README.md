# Firmware

```mermaid
graph TD
    subgraph Initialization
        A((Firmware Start)) --> B{Scan for known Wi-Fi networks};
        B -- Network Found --> C[Connect to Wi-Fi];
        B -- Not Found --> D[Start BLE Service];
        D --> E[Wait for Wi-Fi credentials via BLE];
        E --> C;
    end

    subgraph "UDP Runtime Loop"
        C --> F[Initialize UDP Server & LEDs<br><br><span style='font-family: monospace; font-size: 0.9em;'>protocol_begin()</span>];
        F --> G{Enter Main Loop<br><br><span style='font-family: monospace; font-size: 0.9em;'>protocol_loop()</span>};
        G --> H[Read UDP Packet];
        H --> I{Is packet valid?};
        I -- No --> G;
        I -- Yes --> J[Process Packet by Type<br><br><span style='font-family: monospace; font-size: 0.9em;'>protocol_process_packet()</span>];
    end

    subgraph "UDP Message Handling"
        J -- PING --> K[<b>PING</b><br>Respond with PONG];
        J -- GET_CONFIG --> L[<b>GET_CONFIG</b><br>Respond with device configuration];
        J -- SET_CONFIG --> M[<b>SET_CONFIG</b><br>Update & save config, then respond];
        J -- SET_LEDS --> N[<b>SET_LEDS</b><br>Update LED strip colors];
    end

    K --> G;
    L --> G;
    M --> G;
    N --> G;
```

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) - [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

## Config & Build

⚠️ Note: I'm primarily a software developer, not a firmware expert. The following configuration is tested for my ESP32-S3 device. Suggestions are welcome

1. Menuconfig
   Run idf.py menuconfig and enable the following option:

Component config -> Bluetooth -> Bluedroid Options -> [*] BLE_42_FEATURE_SUPPORT

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
