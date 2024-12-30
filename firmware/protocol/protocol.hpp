// #include <sys/_stdint.h>
#include "protocol.h"

#include "ping.hpp"
#include "config.hpp"
#include "leds.hpp"
#include "blink.hpp"

size_t udp_packet_size = 1 + 1 + config.num_leds * 5; // message_id + message_type + max_message_size
uint8_t *udp_packet;

bool protocol_begin()
{
    udp_packet_size = 1 + 1 + config.num_leds * 5;
    udp_packet = (uint8_t *)malloc(udp_packet_size);

    led_buffer_update = (uint8_t *)malloc(led_buffer_size);
    memset(led_buffer_update, 0, led_buffer_size);

    udp.onPacket(protocol_process_packet);

    if (udp.listen(config.port))
    {
        DEBUG_PRINTLN("Listen on UDP port: " + String(config.port));

        udp.broadcast(config.hostname);
        udp.print(config.hostname);
        return true;
    }

    DEBUG_PRINTLN("Failed to bind UDP port");
    return false;
}

void protocol_process_packet(AsyncUDPPacket packet)
{
    size_t length = packet.length();
    if (length < 2)
    {
        DEBUG_PRINTLN("Received invalid packet");
        return;
    }
    const uint8_t *data = packet.data();
    sender->ip = packet.remoteIP();
    sender->port = packet.remotePort();

    uint8_t message_id = data[0];
    uint8_t message_type = data[1];
    switch (message_type)
    {
    case PING:
        protocol_ping(&packet);
        break;
    case GET_CONFIG:
        protocol_get_config(&packet);
        break;
    case SET_CONFIG:
        protocol_set_config(&packet);
        break;
    case SET_LEDS:
        protocol_set_leds(&packet);
        break;
    case BLINK:
        protocol_blink(&packet);
        break;
    default:
        DEBUG_PRINTLN("Unknown message type");
        break;
    }
}

void protocol_loop()
{
    update_leds();
}
