#pragma GCC optimize("O3")
#pragma GCC optimize("unroll-loops")
#pragma GCC optimize("fast-math")
// #pragma GCC optimize("-fno-exceptions")
// #pragma GCC optimize ("-fexceptions")

#define SERIAL_DEBUG true

#ifdef SERIAL_DEBUG
#define DEBUG_PRINT(x) Serial.print(x)
#define DEBUG_PRINTLN(x) Serial.println(x)
#define DEBUG_PRINTF(x, y) Serial.printf(x, y)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#define DEBUG_PRINTF(x, y)
#endif

#include "./fs.hpp"
#include "config.h"
#include "./wifi/wifi.hpp"
#include "mDNS.hpp"
#include "./strip.hpp"
#include "./protocol/protocol.hpp"
#include "ota.hpp"

enum RunMode
{
	AP = 0,
	NORMAL = 1
};

RunMode mode = RunMode::NORMAL;

void setup()
{
#ifdef SERIAL_DEBUG
	Serial.begin(115200);
#endif

	FS_begin();
	config_begin();

	strip_start();

	if (WiFiAutoConnect())
	{
		mode = RunMode::NORMAL;
		InitMDNS();

		udp_begin();

		strip_set_color_immediate(0, 0, 255, 0);

		ota_begin();
	}
	else
	{
		mode = RunMode::AP;
		APModeStart();

		strip_set_color_immediate(0, 255, 0, 0);
	}
}

void loop()
{
	if (mode == RunMode::AP)
	{
		dnsServer.processNextRequest();

		return;
	}

#if ESP8226
	MDNS.update();
#endif

	ota_loop();

	udp_read();
}
