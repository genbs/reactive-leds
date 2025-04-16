#ifndef PROTOCOL_H
#define PROTOCOL_H

#define PROTOCOL_TAG "PROTOCOL"

#include "config.h"
#include "udp_con.h"
#include "leds.h"

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    BLINK = 4, // Find LED strip and blink it by config id
};


bool protocol_begin();
void protocol_loop();

void update_leds();
void protocol_process_packet(udp_packet* packet);
void protocol_ping(udp_packet* packet);
void protocol_get_config(udp_packet* packet);
void protocol_set_config(udp_packet* packet);
void protocol_set_leds(udp_packet* packet);
void protocol_blink(udp_packet* packet);

#endif