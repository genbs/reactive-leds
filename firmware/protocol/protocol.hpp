#include <WiFiUdp.h>
#include "protocol.h"

WiFiUDP udp;
unsigned long lastUpdateTime = 0;
const unsigned long updateInterval = 30; // milliseconds

uint8_t *led_data;

void udp_begin()
{
    udp.begin(config.port);

    led_data = (uint8_t *)malloc(config.num_leds * 5);
}

void udp_read()
{
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
            case PING:
                protocol_ping();
                break;
            case HANDSHAKE:
                protocol_handshake();
                break;
            case GET_CONFIG:
                protocol_get_config();
                break;
            case SET_CONFIG:
                protocol_set_config(packet, len);
                break;
            case SET_COLORS:
                protocol_set_colors(packet, len);
                break;

            default:
                Serial.println("Unknown message type");
                break;
            }
        }
    }
}

void protocol_ping()
{
    Serial.println("PING");

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(PING);
    udp.endPacket();
}

void protocol_get_config()
{
    Serial.println("GET_CONFIG");

    udp.beginPacket(udp.remoteIP(), udp.remotePort());

    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);

    udp.endPacket();
}

void protocol_handshake()
{
    Serial.println("Handshake");

    udp.beginPacket(udp.remoteIP(), udp.remotePort());

    udp.write(HANDSHAKE);
    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);
    for (int i = 0; i < sizeof(config.hostname); i++)
        udp.write(config.hostname[i]);

    udp.endPacket();
}

void protocol_set_config(byte *packet, int len)
{
    Serial.println("SET_CONFIG");
    if (len < 3)
    {
        Serial.println("Invalid SET_CONFIG packet");
        return;
    }

    config.id = packet[1];
    config.num_leds = packet[2];
    if (len >= 5)
        config.port = (packet[3] << 8) | packet[4];

    if (len > 5)
    {
        const char *hostname = (const char *)&packet[5];
        strncpy(config.hostname, hostname, sizeof(config.hostname) - 1);
        config.hostname[sizeof(config.hostname) - 1] = '\0';
    }

    if (config_store())
    {
        Serial.println("Configuration saved successfully.");
        Serial.println("Restarting in 2 seconds.");
        delay(2000);
        ESP.restart();
    }
    else
    {
        Serial.println("Configuration save failed.");
    }
}

void protocol_set_colors(byte *packet, int len)
{
    for (int i = 0; i < config.num_leds; i++)
    {
        uint8_t u = packet[i * 5 + 1];

        if (u > config.num_leds)
            continue;

        uint8_t r = packet[i * 5 + 2];
        uint8_t g = packet[i * 5 + 3];
        uint8_t b = packet[i * 5 + 4];
        float w = packet[i * 5 + 5];
        float br = w / 255.0;

        led_data[u * 4 + 0] = r * br;
        led_data[u * 4 + 1] = g * br;
        led_data[u * 4 + 2] = b * br;
        led_data[u * 4 + 3] = w;
    }

    if (millis() - lastUpdateTime >= updateInterval)
    {
        update_strip();
        lastUpdateTime = millis();
    }
}

void update_strip()
{
    for (int i = 0; i < config.num_leds; i++)
    {
        strip.setPixelColor(i, led_data[i * 4 + 0], led_data[i * 4 + 1], led_data[i * 4 + 2], led_data[i * 4 + 3]);
    }

    strip.show();
}