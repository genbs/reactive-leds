# Firmware

## Requirements

- CMake
- Python 3
- [ESP-IDF](https://github.com/espressif/esp-idf) - [Installation guide](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html#installation)

## Build

Menuconfig

enable:

- BLE_42_FEATURE_SUPPORT

## Config

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

## Protocol

## TODO

- [] OTA
- [] Multiple stripe support
- [] Static IP
