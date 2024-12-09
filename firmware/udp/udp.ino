#include "config.h"

#include "./fs.hpp"
#include "./wifi/wifi.hpp"
#include "mDNS.hpp"
#include "./strip.hpp"
#include "./protocol.hpp"

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
	strip_start();

	String hostname = FS_read("/config", "hostname", default_hostname);

	if (WiFiAutoConnect())
	{
		mode = RunMode::NORMAL;
		InitMDNS(hostname);

		udp_begin(hostname);

		strip_set_color_immediate(0, 255, 0, 0, 255);
	}
	else
	{
		mode = RunMode::AP;
		APModeStart(hostname);

		strip_set_color_immediate(0, 255, 127, 0, 255);
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
