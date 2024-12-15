#include "./fs.hpp"
#include "config.h"
#include "./wifi/wifi.hpp"
#include "mDNS.hpp"
#include "./strip.hpp"
#include "./protocol/protocol.hpp"

enum RunMode
{
	AP = 0,
	NORMAL = 1
};

RunMode mode = RunMode::NORMAL;

void setup()
{
	Serial.begin(115200);

	FS_begin();
	config_begin();

	strip_start();

	if (WiFiAutoConnect())
	{
		mode = RunMode::NORMAL;
		InitMDNS();

		udp_begin();

		strip_set_color_immediate(0, 0, 255, 0);
	}
	else
	{
		mode = RunMode::AP;
		APModeStart();

		strip_set_color_immediate(0, 255, 127, 0);
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

	udp_read();
}
