#include "udp_con.h"

static int sock;

bool udp_con_begin(uint16_t port) {
    ESP_LOGV(UDP_TAG, "Starting UDP server on port %d", port);

    struct sockaddr_in dest_addr;
    dest_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(port);

    sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP); 
    if (sock < 0) {
        ESP_LOGE(UDP_TAG, "Unable to create socket: errno %d", errno);
        return 0;
    }

    int err = bind(sock, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
    if (err < 0) {
        ESP_LOGE(UDP_TAG, "Socket unable to bind: errno %d", errno);
        return 0;
    }

    ESP_LOGI(UDP_TAG, "Socket bound, port %d", port);
    return 1;
}

udp_packet* udp_con_read()
{
    ESP_LOGV(UDP_TAG, "Starting UDP read");

    static udp_packet packet;
    packet.source_addr = (struct sockaddr_storage) {0};
    packet.socklen = sizeof(packet.source_addr);

    if (!sock) {
        ESP_LOGE(UDP_TAG, "Socket not created");
        return NULL;
    }

    ESP_LOGV(UDP_TAG, "Waiting for data");
    packet.len = recvfrom(sock, packet.data, sizeof(packet.data) - 1, 0, (struct sockaddr *)&packet.source_addr, &packet.socklen);

    if (packet.len < 0) {
        ESP_LOGE(UDP_TAG, "recvfrom failed: errno %d", errno);
        return NULL;
    }
            
    inet_ntoa_r(((struct sockaddr_in *)&packet.source_addr)->sin_addr, packet.address, sizeof(packet.address) - 1);
    
    ESP_LOGV(UDP_TAG, "Received %d bytes from %s:", packet.len, packet.address);

    
    return &packet;
}

void udp_con_close() {
    if (sock != -1) {
        ESP_LOGI(UDP_TAG, "Shutting down socket and restarting...");
        shutdown(sock, 0);
        close(sock);
    }
}

void udp_con_send(uint8_t *data, size_t len, struct sockaddr_storage *dest_addr) {
    ESP_LOGV(UDP_TAG, "Sending data");

    int err = sendto(sock, data, len, 0, (struct sockaddr *)dest_addr, sizeof(*dest_addr));
    if (err < 0) {
        ESP_LOGE(UDP_TAG, "Error occurred during sending: errno %d", errno);
        return;
    }
}