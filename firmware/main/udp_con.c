#include "udp_con.h"
#include "config.h"
#include "esp_log.h"
#include <string.h>
#include <lwip/netdb.h>
#include <fcntl.h> 

#define UDP_TAG "UDP_SERVICE"

static int sock = -1;

bool udp_con_begin(uint16_t port) {
    ESP_LOGI(UDP_TAG, "Starting UDP server on port %d", port);

    // close any existing socket
    if (sock != -1) {
        udp_con_close();
    }

    struct sockaddr_in dest_addr;
    dest_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(port);

    sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP); 
    if (sock < 0) {
        ESP_LOGE(UDP_TAG, "Unable to create socket: errno %d", errno);
        return false;
    }

    // non blocking mode
    int flags = fcntl(sock, F_GETFL, 0);
    if (flags < 0) {
        ESP_LOGE(UDP_TAG, "fcntl(F_GETFL) failed: errno %d", errno);
        close(sock);
        sock = -1;
        return false;
    }

    if (fcntl(sock, F_SETFL, flags | O_NONBLOCK) < 0) {
        ESP_LOGE(UDP_TAG, "fcntl(F_SETFL) failed: errno %d", errno);
        close(sock);
        sock = -1;
        return false;
    }

    if (bind(sock, (struct sockaddr *)&dest_addr, sizeof(dest_addr)) < 0) {
        ESP_LOGE(UDP_TAG, "Socket unable to bind: errno %d", errno);
        close(sock);
        sock = -1;
        return false;
    }

    ESP_LOGI(UDP_TAG, "Socket bound, port %d", port);
    return true;
}

bool udp_con_read(udp_packet* packet)
{
    if (sock < 0) {
        return false;
    }

    socklen_t socklen = sizeof(packet->source_addr);
    int len = recvfrom(sock, packet->data, UDP_MAX_PACKET_SIZE, 0,
                       (struct sockaddr *)&packet->source_addr, &socklen);

    if (len > 0) {
        packet->len = len;
        return true;
    }

    if (len < 0 && errno != EAGAIN && errno != EWOULDBLOCK) {
        ESP_LOGE(UDP_TAG, "recvfrom failed: errno %d", errno);
    }

    return false;
}

void udp_con_send(const udp_packet* packet) {
    if (sock < 0 || packet == NULL) {
        return;
    }
    
    int addr_len = (packet->source_addr.ss_family == AF_INET)
                   ? sizeof(struct sockaddr_in)
                   : sizeof(struct sockaddr_in6);

    int err = sendto(sock, packet->data, packet->len, 0,
                     (struct sockaddr *)&packet->source_addr, addr_len);
                     
    if (err < 0) {
        ESP_LOGE(UDP_TAG, "Error during sending: errno %d", errno);
    }
}

void udp_con_close() {
    if (sock != -1) {
        ESP_LOGI(UDP_TAG, "Shutting down socket...");
        shutdown(sock, 0);
        close(sock);
        sock = -1;  
    }
}
