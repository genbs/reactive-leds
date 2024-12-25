// #include <sys/_stdint.h>
#include <WiFiUdp.h>
#include "protocol.h"

#include "ping.hpp"
#include "config.hpp"
#include "leds.hpp"
#include "blink.hpp"

// const unsigned long updateInterval = 1000 / 144; // milliseconds, 144Hz

size_t udp_packet_size = 1 + 1 + config.num_leds * 5; // message_id + message_type + max_message_size
uint8_t *udp_packet;

bool protocol_begin()
{
    if (udp.begin(config.port) != 1)
    {
        DEBUG_PRINTLN("Failed to bind UDP port");
        return false;
    }
    else
    {
        DEBUG_PRINTLN("Listen on UDP port: " + String(config.port));
    }

    udp_packet_size = 1 + 1 + config.num_leds * 5;
    udp_packet = (uint8_t *)malloc(udp_packet_size);

    led_buffer_size = config.num_leds * 5;
    led_buffer = (uint8_t *)malloc(led_buffer_size);
    led_buffer_update = (uint8_t *)malloc(led_buffer_size);

    memset(led_buffer, 0, led_buffer_size);
    memset(led_buffer_update, 0, led_buffer_size);

    // udp.setTimeout(updateInterval);

    return true;
}

void protocol_loop()
{
    // check for incoming data
    size_t packetSize = udp.parsePacket();
    if (packetSize)
    {
        size_t read_len = udp.read(udp_packet, udp_packet_size);
        if (read_len >= 2)
        {
            uint8_t message_id = udp_packet[0];
            uint8_t message_type = udp_packet[1];

            switch (message_type)
            {
            case PING:
                protocol_ping(message_id);
                break;
            case GET_CONFIG:
                protocol_get_config(message_id);
                break;
            case SET_CONFIG:
                protocol_set_config(message_id, udp_packet, read_len);
                break;
            case SET_LEDS:
                protocol_set_leds(message_id, udp_packet, read_len);
                break;
            case BLINK:
                protocol_blink(message_id, udp_packet, read_len);
                break;
            default:
                DEBUG_PRINTLN("Unknown message type");
                break;
            }
        }

        udp.clear();
    }

    update_leds();
}
