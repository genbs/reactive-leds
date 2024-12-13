#include <WiFiUdp.h>
#include "protocol.h"

WiFiUDP udp;
unsigned long lastUpdateTime = 0;
const unsigned long updateInterval = 30; // milliseconds

uint8_t *led_data;
byte *packet;
int max_packet_size = 1 + 5 * config.num_leds;

void udp_begin()
{
    if (udp.begin(config.port) != 1)
    {
        Serial.println("Failed to bind UDP port");
        return;
    }
    else
    {
        Serial.println("Listen on UDP port: " + String(config.port));
    }

    led_data = (uint8_t *)malloc(config.num_leds * 4);

    max_packet_size = 1 + 5 * config.num_leds;
    packet = (byte *)malloc(max_packet_size);
}

void udp_read()
{
    int packetSize = udp.parsePacket();
    if (packetSize)
    {
        int len = udp.read(packet, max_packet_size);

        if (len >= 2)
        {
            uint8_t message_id = packet[0];
            uint8_t message_type = packet[1];

            switch (message_type)
            {
            case PING:
                protocol_ping(message_id);
                break;
            case HANDSHAKE:
                protocol_handshake(message_id);
                break;
            case GET_CONFIG:
                protocol_get_config(message_id);
                break;
            case SET_CONFIG:
                protocol_set_config(message_id, packet, len);
                break;
            case SET_LEDS:
                protocol_set_leds(message_id, packet, len);
                break;

            default:
                Serial.println("Unknown message type");
                break;
            }
        }

        udp.clear();
    }
}

void protocol_ping(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(PING);
    udp.endPacket();

    Serial.println("PING");
}

void protocol_handshake(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(HANDSHAKE);
    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);
    udp.write((uint8_t *)config.hostname, sizeof(config.hostname));
    udp.endPacket();

    Serial.println("Handshake");
}

void protocol_get_config(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);
    udp.write((uint8_t *)config.hostname, sizeof(config.hostname));
    udp.endPacket();

    Serial.println("GET_CONFIG");
}

void protocol_set_config(uint8_t message_id, byte *packet, int len)
{
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

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(SET_CONFIG);
    if (config_store())
    {
        udp.write(1);
        Serial.println("Configuration saved successfully. Restarting in 2 seconds.");
        delay(2000);
        ESP.restart();
    }
    else
    {
        udp.write(0);
        Serial.println("Configuration save failed.");
    }
    udp.endPacket();
}

void protocol_set_leds(uint8_t message_id, byte *packet, int len)
{
    /*for (int n = 0; n < config.num_leds; n++)
    {
        uint8_t i = i * 5 + 2; //[message_id, message_type]
        uint8_t u = packet[i];

        if (u > config.num_leds)
            continue;

        uint8_t r = packet[i + 1];
        uint8_t g = packet[i + 2];
        uint8_t b = packet[i + 3];
        float w = packet[i + 4];
        float br = w / 255.0;

        led_data[u * 4 + 0] = r * br;
        led_data[u * 4 + 1] = g * br;
        led_data[u * 4 + 2] = b * br;
        led_data[u * 4 + 3] = w;
    }*/

    for (int i = 2; i < len; i += 5)
    {
        uint8_t u = packet[i];

        if (u > config.num_leds)
            continue;

        uint8_t r = packet[i + 1];
        uint8_t g = packet[i + 2];
        uint8_t b = packet[i + 3];
        float w = packet[i + 4];
        float br = w / 255.0;

        led_data[u * 4 + 0] = r * br;
        led_data[u * 4 + 1] = g * br;
        led_data[u * 4 + 2] = b * br;
        led_data[u * 4 + 3] = w;
    }

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(SET_LEDS);
    if (millis() - lastUpdateTime >= updateInterval)
    {
        update_strip();
        lastUpdateTime = millis();
        udp.write(1);

        Serial.println("SET_COLOR OK");
    }
    else
    {
        udp.write(0);

        Serial.println("SET_COLOR SKIP");
    }
    udp.endPacket();
}

void update_strip()
{
    for (int i = 0; i < config.num_leds; i++)
    {
        strip.setPixelColor(i, led_data[i * 4 + 0], led_data[i * 4 + 1], led_data[i * 4 + 2], led_data[i * 4 + 3]);
    }

    strip.show();
}