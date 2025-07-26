#include "protocol.h"

#include "esp_wifi.h"
#include "config.h"
#include "storage.h"
#include "udp_con.h"
#include "leds.h"
#include "esp_log.h"
#include <string.h>
#include <arpa/inet.h>

#define PROTOCOL_TAG "PROTOCOL"

static udp_packet s_packet_buffer;

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    RESET_WIFI = 4
};

static bool is_protocol_packet_valid(const udp_packet* packet);
static void protocol_process_packet(udp_packet* packet);
static void protocol_ping(const udp_packet* request);
static void protocol_get_config(const udp_packet* request);
static void protocol_set_config(const udp_packet* request);
static void protocol_set_leds(const udp_packet* request);
static void protocol_reset_wifi(const udp_packet* request);

bool protocol_begin() {
    if (udp_con_begin(config.port)) {
        return leds_begin();
    }

    return false;
}

/**
 * Protocol loop.
 * Reads UDP packets and processes them if they are valid.
 */
void protocol_loop()
{
    if (udp_con_read(&s_packet_buffer)) {
        if (is_protocol_packet_valid(&s_packet_buffer)) {
            ESP_LOGV(PROTOCOL_TAG, "Received %d valid bytes.", s_packet_buffer.len);
            protocol_process_packet(&s_packet_buffer);
        } else {
            ESP_LOGW(PROTOCOL_TAG, "Received invalid packet of size %d.", s_packet_buffer.len);
        }
    }
}

static bool is_protocol_packet_valid(const udp_packet* packet) {
    return packet != NULL && packet->len >= 2; // At least 2 bytes: message_id and command
}

static void protocol_process_packet(udp_packet* packet)
{
    switch (packet->data[1]) { // The second byte is the command
        case PING:       protocol_ping(packet); break;
        case GET_CONFIG: protocol_get_config(packet); break;
        case SET_CONFIG: protocol_set_config(packet); break;
        case SET_LEDS:   protocol_set_leds(packet); break;
        case RESET_WIFI: protocol_reset_wifi(packet); break;
        default:         ESP_LOGW(PROTOCOL_TAG, "Unknown message type: %d", packet->data[1]); break;
    }
}

/**
 * When receving [PACKET_ID, PING], respond with [PACKET_ID, PING, 1]
 */
static void protocol_ping(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "PING");

    udp_packet response;
    response.source_addr = request->source_addr; // L'indirizzo di destinazione è la sorgente della richiesta

    response.data[0] = request->data[0]; // Ripeti il PACKET_ID
    response.data[1] = PING;
    response.data[2] = 1; // PONG
    response.len = 3;

    udp_con_send(&response);
}


static void protocol_get_config(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "GET_CONFIG");

    udp_packet response;
    response.source_addr = request->source_addr;
    
    response.data[0] = request->data[0];
    response.data[1] = GET_CONFIG;
    response.data[2] = config.pin;
    response.data[3] = config.num_leds;
    response.data[4] = config.brightness;
    response.data[5] = (config.port >> 8) & 0xFF;
    response.data[6] = config.port & 0xFF;

    size_t hostname_len = strlen(config.hostname);
    memcpy(&response.data[7], config.hostname, hostname_len);
    response.len = 7 + hostname_len;

    udp_con_send(&response);
}

static void protocol_set_config(const udp_packet* request)
{
    const uint8_t *data = request->data;
    size_t len = request->len;

    if (len < 7) {
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_CONFIG packet: too short");
        return;
    }

    ESP_LOGV(PROTOCOL_TAG, "SET_CONFIG");

    // TODO: when config is set, restart the device

    config.pin = data[2];
    config.num_leds = data[3];
    config.brightness = data[4];
    config.port = (data[5] << 8) | data[6]; 

    size_t hostname_len_from_packet = len - 7;
    size_t len_to_copy = (hostname_len_from_packet < sizeof(config.hostname)) ? hostname_len_from_packet : (sizeof(config.hostname) - 1);
    
    memcpy(config.hostname, &data[7], len_to_copy);
    config.hostname[len_to_copy] = '\0';

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = data[0];
    response.data[1] = SET_CONFIG;
    response.data[2] = config_store() ? 1 : 0;
    response.len = 3;

    udp_con_send(&response);
}

static void protocol_set_leds(const udp_packet* request)
{
    const uint8_t *data = request->data;
    size_t len = request->len;

    if (len < 2 + 5) { // Header + at least one LED (5 bytes per LED - index + R + G + B + W)
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_LEDS packet: too short");
        return;
    }

    ESP_LOGV(PROTOCOL_TAG, "SET_LEDS");

    for (int i = 2; i + 4 < len; i += 5) {
        uint8_t pixel_index = data[i];
        if (pixel_index >= config.num_leds) {
            ESP_LOGW(PROTOCOL_TAG, "LED index %d out of range", pixel_index);
            continue;
        }
        leds_update(pixel_index, data[i+1] /* R */, data[i+2] /* G */, data[i+3] /* B */, data[i+4] /* W */);
    }

    leds_show();
}

static void protocol_reset_wifi(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "RESET_WIFI");

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = RESET_WIFI;
    response.data[2] = 1; 
    response.len = 3;
    udp_con_send(&response);

    vTaskDelay(pdMS_TO_TICKS(100));

    ESP_LOGI(PROTOCOL_TAG, "Performing WiFi reset...");
    esp_wifi_restore();
    storage_delete("wifi", NULL); 

    ESP_LOGI(PROTOCOL_TAG, "WiFi credentials reset, restarting...");
    esp_restart();
}