#include <sys/_stdint.h>
#include <WiFiUdp.h>
#include "protocol.h"

WiFiUDP udp;
unsigned long lastUpdateTime = 0;
const unsigned long updateInterval = 1000 / 120; // milliseconds, 120Hz

uint8_t *packet;
int max_packet_size = 1 + 1 + 5 * config.num_leds;

void udp_begin()
{
    if (udp.begin(config.port) != 1)
    {
        DEBUG_PRINTLN("Failed to bind UDP port");
        return;
    }
    else
    {
        DEBUG_PRINTLN("Listen on UDP port: " + String(config.port));
    }

    max_packet_size = 1 + 1 + 5 * config.num_leds;
    packet = (uint8_t *)malloc(max_packet_size);

    udp.setTimeout(updateInterval);
}

void udp_read()
{
    while (true)
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
                case GET_CONFIG:
                    protocol_get_config(message_id);
                    break;
                case SET_CONFIG:
                    protocol_set_config(message_id, packet, len);
                    break;
                case SET_LEDS:
                    protocol_set_leds(message_id, packet, len);
                    break;
                case BLINK:
                    protocol_blink(message_id, packet, len);
                    break;

                default:
                    DEBUG_PRINTLN("Unknown message type");
                    break;
                }
            }

            vTaskDelay(1 / portTICK_PERIOD_MS);
            // udp.clear();
        }
    }
}

void protocol_ping(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(PING);
    udp.endPacket();

    DEBUG_PRINTLN("PING");
}

void protocol_get_config(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(GET_CONFIG);
    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);
    udp.write(config.brightness);
    udp.write((uint8_t *)config.hostname, strlen(config.hostname));
    udp.endPacket();

    DEBUG_PRINTLN("GET_CONFIG");
}

void protocol_set_config(uint8_t message_id, byte *packet, int len)
{
    if (len < 3)
    {
        DEBUG_PRINTLN("Invalid SET_CONFIG packet");
        return;
    }

    config.port = (packet[2] << 8) | packet[3];
    config.id = packet[4];
    config.num_leds = packet[5];
    config.brightness = packet[6];

    uint8_t hostname_length = len - 7;
    if (hostname_length >= sizeof(config.hostname))
    {
        hostname_length = sizeof(config.hostname) - 1;
    }
    memcpy(config.hostname, &packet[7], hostname_length);
    config.hostname[hostname_length] = '\0';

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(SET_CONFIG);
    if (config_store())
    {
        udp.write(1);
        DEBUG_PRINTLN("SET_CONFIG: Configuration saved successfully. Restarting in 2 seconds.");
        delay(2000);
        ESP.restart();
    }
    else
    {
        udp.write(0);
        DEBUG_PRINTLN("SET_CONFIG: Configuration save failed.");
    }
    udp.endPacket();
}

void protocol_set_leds(uint8_t message_id, byte *packet, int len)
{
    for (int i = 2; i < len; i += 5)
    {
        uint8_t u = packet[i];

        if (u < config.num_leds)
        {

            uint8_t r = packet[i + 1];
            uint8_t g = packet[i + 2];
            uint8_t b = packet[i + 3];
            float w = packet[i + 4];

            strip.setPixelColor(u,
                                r,
                                g,
                                b, w);

            // DEBUG_PRINTLN("Set color " + String(u) + " = r: " + String(r) + ", g: " + String(g) + ", b:" + String(b) + ", w:" + String(w));
        }
    }

    uint8_t status = 0;
    if (millis() - lastUpdateTime >= updateInterval)
    {
        strip.show();
        lastUpdateTime = millis();
        status = 1;
        DEBUG_PRINTLN("SET_LEDS: Updated");
    }
    else
    {
        DEBUG_PRINTLN("SET_LEDS: Skip update");
    }

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(SET_LEDS);
    udp.write(status);
    udp.endPacket();
}

void protocol_blink(uint8_t message_id, byte *packet, int len)
{
    if (len < 13)
    {
        DEBUG_PRINTLN("Invalid BLINK packet");
        return;
    }

    DEBUG_PRINTLN("BLINK");

    uint8_t count = config.id;
    uint8_t base_color[4] = {packet[2], packet[3], packet[4], packet[5]};
    uint8_t blink_color[4] = {packet[6], packet[7], packet[8], packet[9]};
    uint8_t blink_count = packet[10];
    uint8_t blink_delay = packet[11] << 8 | packet[12];

    for (int repeat = 0; repeat < blink_count; repeat++)
    {
        for (int i = 0; i < config.num_leds; i++)
        {
            if (i < count)
                strip.setPixelColor(i, base_color[0], base_color[1], base_color[2], base_color[3]);
            else
                strip.setPixelColor(i, 0, 0, 0, 0);
        }
        strip.show();
        delay(blink_delay);

        for (int i = 0; i < count; i++)
        {
            strip.setPixelColor(i, blink_color[0], blink_color[1], blink_color[2], blink_color[3]);
            strip.show();
            delay(500);
        }
        delay(blink_delay);
    }
}