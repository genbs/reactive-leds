#include <Adafruit_NeoPixel.h>

#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif
#include <WiFiUdp.h>

#ifdef ESP8266
#include <ESP8266mDNS.h>
#else
#include <ESPmDNS.h>
#endif

#include "config.h"
#include "wifi.hpp"
#include "mDNS.hpp"

WiFiUDP udp;
unsigned int localPort = 4210;

Adafruit_NeoPixel strip(16, D2, NEO_WRGB + NEO_KHZ800);

const int NUM_LEDS = 16;

enum MessageType
{
	GET_CONFIG = 0,
	SET_CONFIG = 1,
	SET_COLORS = 2,
};

void setup()
{
	Serial.begin(115200);

	ConnectWiFi_STA();
	InitMDNS();

	udp.begin(localPort);

	strip.begin();
	strip.setBrightness(255);
	strip.show();
}

void loop()
{
	MDNS.update();

	// Controlla se ci sono pacchetti UDP in arrivo
	int packetSize = udp.parsePacket();
	if (packetSize)
	{
		byte packet[255];
		int len = udp.read(packet, sizeof(packet));

		if (len > 0)
		{
			uint8_t message_type = packet[0];

			switch (message_type)
			{
			case GET_CONFIG:
				Serial.println("GET_CONFIG");
				// Handle GET_CONFIG here
				break;

			case SET_CONFIG:
				Serial.println("SET_CONFIG");
				// Handle SET_CONFIG here
				break;

			case SET_COLORS:
				// Serial.println("SET_COLORS");
				handleColorUpdate(packet, len);
				break;

			default:
				Serial.println("Unknown message type");
				break;
			}
		}
	}
}

void handleColorUpdate(byte *packet, int len)
{
	// Expecting each LED to have 5 bytes: ID, R, G, B, brightness
	for (int i = 0; i < NUM_LEDS; i++)
	{
		uint8_t u = packet[i * 5 + 1];
		uint8_t r = packet[i * 5 + 2];
		uint8_t g = packet[i * 5 + 3];
		uint8_t b = packet[i * 5 + 4];
		float w = packet[i * 5 + 5];
		float br = w / 255.0;

		// Set pixel color with brightness applied
		strip.setPixelColor(u, r * br, g * br, b * br);
	}
	strip.show();
}
