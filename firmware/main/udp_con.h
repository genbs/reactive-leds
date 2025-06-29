#ifndef UDP_CON_H
#define UDP_CON_H

#include <stdbool.h>
#include "esp_log.h"
#include "lwip/err.h"
#include "lwip/sockets.h"
#include "lwip/sys.h"
#include <lwip/netdb.h>

#include "config.h"

#define UDP_TAG "UDP_SERVICE"

#define UDP_MAX_RETRIES 2
#define UDP_TIMEOUT_US (1000 / 60) * 1000 // 60Hz refresh rate

typedef struct {
    uint8_t data[1024];
    int len;
    struct sockaddr_storage source_addr;
    socklen_t socklen;
} udp_packet;

static inline bool is_valid_packet(udp_packet *packet) {
    return packet != NULL && packet->len >= 2; // At least 2 bytes: message_id and command
}

bool udp_con_begin(uint16_t port);
udp_packet* udp_con_read();
void udp_con_send(uint8_t *data, size_t len, struct sockaddr_storage *dest_addr);
void udp_con_close();

#endif