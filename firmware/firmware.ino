#pragma GCC optimize("Ofast")
#pragma GCC optimize("unroll-loops")
#pragma GCC optimize("fast-math")

// #pragma GCC optimize("no-exceptions")

///////////////////////////

#ifdef SERIAL_DEBUG
#define DEBUG_PRINT(x) Serial.print(x)
#define DEBUG_PRINTLN(x) Serial.println(x)
#define DEBUG_PRINTF(x, y) Serial.printf(x, y)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#define DEBUG_PRINTF(x, y)
#endif

///////////////////////////

#include "fs.hpp"
#include "config.h"

#include "wifi/WiFi.hpp"
#include "wifi/AP.hpp"
#include "mDNS.hpp"
#include "OTA.hpp"
#include "bluetooth.hpp"

#include "strip.hpp"
#include "protocol/protocol.hpp"

///////////////////////////

bool apMode = false;

void setup()
{
#ifdef SERIAL_DEBUG
	Serial.begin(115200);
#endif

	FS_begin();
	config_begin();
	strip_begin();

	strip.setPixelColor(0, 0, 0, 255);
  strip.show();
  
	/**
	 * Find wifi networks and connect to the first one that has a password stored in the FS
	 */
	if (WiFiAutoConnect())
	{
		apMode = false;

		strip.setPixelColor(0, 0, 255, 0);
		strip.setPixelColor(1, 0, 255, 0);
		strip.setPixelColor(2, 0, 255, 0);
		strip.show();

		OTA_begin();
		InitMDNS();

		if (!protocol_begin())
		{
			strip.setPixelColor(0, 255, 0, 0);
			strip.setPixelColor(1, 255, 0, 0);
			strip.setPixelColor(2, 255, 0, 0);
			strip.show();

			delay(2000);
			ESP.restart();
		}
		else
		{
			DEBUG_PRINTLN("Start successfully.");
		}
	}
	else
	{
		apMode = true;

		strip.setPixelColor(0, 255, 0, 0);
		strip.show();

		APModeStart();
		bluetooth_begin();
	}
}

void loop()
{
	if (apMode)
	{
		dnsServer.processNextRequest();

		return;
	}

	OTA_loop();

#if ESP8266
	MDNS.update();
#endif

	protocol_loop();
}
