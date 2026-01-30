#ifndef UDP_CON_H
#define UDP_CON_H

#include <stdbool.h>
#include "lwip/sockets.h"

#define UDP_MAX_PACKET_SIZE 1500

typedef struct {
    uint8_t data[UDP_MAX_PACKET_SIZE];
    int len;
    struct sockaddr_storage source_addr;
} udp_packet;

static inline bool is_valid_packet(udp_packet *packet) {
    return packet != NULL && packet->len >= 2; // At least 2 bytes: message_id and command
}

bool udp_con_begin(uint16_t port);
bool udp_con_read(udp_packet* packet); 
void udp_con_send(const udp_packet* packet); 
void udp_con_close();

#endif // UDP_CON_H