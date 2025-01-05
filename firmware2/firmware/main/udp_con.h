#ifndef UDP_CON_H
#define UDP_CON_H

#include <stdbool.h>
#include "esp_log.h"
#include "lwip/err.h"
#include "lwip/sockets.h"
#include "lwip/sys.h"
#include <lwip/netdb.h>

#define UDP_TAG "UDP_CON"

typedef struct {
    uint8_t data[1024];
    int len;
    struct sockaddr_storage source_addr;
    socklen_t socklen;
    char address[32];
} udp_packet;


bool udp_con_begin(uint16_t port);
udp_packet* udp_con_read();
void udp_con_send(uint8_t *data, size_t len, struct sockaddr_storage *dest_addr);

#endif