#include "protocol.h"

#include "esp_wifi.h"
#include "esp_app_desc.h"
#include "esp_timer.h"
#include "config.h"
#include "storage.h"
#include "udp_con.h"
#include "leds.h"
#include "esp_log.h"
#include <string.h>
#include <arpa/inet.h>

#define PROTOCOL_TAG "PROTOCOL"

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    RESET_WIFI = 4,
    GET_VERSION = 5,
    GET_STATUS = 6,
};

static bool is_protocol_packet_valid(const udp_packet* packet);
static void protocol_process_packet(udp_packet* packet);
static void protocol_ping(const udp_packet* request);
static void protocol_get_config(const udp_packet* request);
static void protocol_set_config(const udp_packet* request);
static void protocol_set_leds(const udp_packet* request);
static void protocol_reset_wifi(const udp_packet* request);
static void protocol_get_version(const udp_packet* request);
static void protocol_get_status(const udp_packet* request);

bool protocol_begin() {
    if (udp_con_begin(config.port)) {
        return leds_begin();
    }

    return false;
}

/**
 * Protocol loop.
 * Reads one UDP packet per call (non-blocking) and processes it if valid.
 * Pacing is handled by the caller (vTaskDelay + non-blocking recvfrom).
 * Sustained overload is absorbed by kernel-level drop-tail on the small
 * UDP receive mailbox.
 */
void protocol_loop()
{
    static udp_packet s_packet_buffer;

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
        case PING:        protocol_ping(packet); break;
        case GET_CONFIG:  protocol_get_config(packet); break;
        case SET_CONFIG:  protocol_set_config(packet); break;
        case SET_LEDS:    protocol_set_leds(packet); break;
        case RESET_WIFI:  protocol_reset_wifi(packet); break;
        case GET_VERSION: protocol_get_version(packet); break;
        case GET_STATUS:  protocol_get_status(packet); break;
        default:          ESP_LOGW(PROTOCOL_TAG, "Unknown message type: %d", packet->data[1]); break;
    }
}

/**
 * When receving [PACKET_ID, PING], respond with [PACKET_ID, PING, 1]
 */
static void protocol_ping(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "PING");

    udp_packet response;
    response.source_addr = request->source_addr; // same source address to reply to the sender

    response.data[0] = request->data[0]; // echo back the packet ID
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
    response.data[4] = (config.port >> 8) & 0xFF;
    response.data[5] = config.port & 0xFF;

    size_t hostname_len = strlen(config.hostname);
    size_t max_host_len = (sizeof(response.data) > 6) ? (sizeof(response.data) - 6) : 0;
    if (hostname_len > max_host_len) {
        hostname_len = max_host_len;
    }
    memcpy(&response.data[6], config.hostname, hostname_len);
    response.len = 6 + hostname_len;

    udp_con_send(&response);
}

static void protocol_set_config(const udp_packet* request)
{
    const uint8_t *data = request->data;
    size_t len = request->len;

    if (len < 6) {
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_CONFIG packet: too short");
        return;
    }

    ESP_LOGV(PROTOCOL_TAG, "SET_CONFIG");

    uint8_t new_pin = data[2];
    uint8_t new_num_leds = data[3];
    uint16_t new_port = (data[4] << 8) | data[5];

    size_t hostname_len_from_packet = len - 6;
    size_t len_to_copy = (hostname_len_from_packet < sizeof(config.hostname)) ? hostname_len_from_packet : (sizeof(config.hostname) - 1);

    char new_hostname[sizeof(config.hostname)];
    memset(new_hostname, 0, sizeof(new_hostname));
    memcpy(new_hostname, &data[6], len_to_copy);

    uint8_t old_pin = config.pin;
    uint8_t old_num_leds = config.num_leds;
    uint16_t old_port = config.port;
    char old_hostname[sizeof(config.hostname)];
    memcpy(old_hostname, config.hostname, sizeof(config.hostname));

    config.pin = new_pin;
    config.num_leds = new_num_leds;
    config.port = new_port;
    memcpy(config.hostname, new_hostname, sizeof(config.hostname));

    bool saved = config_store();

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = data[0];
    response.data[1] = SET_CONFIG;
    response.data[2] = saved ? 1 : 0;
    response.len = 3;
    udp_con_send(&response);

    // pin and port only take effect after reboot (RMT and UDP socket are bound at startup)
    if (saved) {
        vTaskDelay(pdMS_TO_TICKS(100));
        ESP_LOGI(PROTOCOL_TAG, "Configuration saved, restarting to apply...");
        esp_restart();
    } else {
        config.pin = old_pin;
        config.num_leds = old_num_leds;
        config.port = old_port;
        memcpy(config.hostname, old_hostname, sizeof(config.hostname));
    }
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

    bool updated = false;
    for (int i = 2; i + 4 < len; i += 5) {
        uint8_t pixel_index = data[i];
        if (pixel_index >= config.num_leds) {
            ESP_LOGW(PROTOCOL_TAG, "LED index %d out of range", pixel_index);
            continue;
        }
        leds_update(pixel_index, data[i+1] /* R */, data[i+2] /* G */, data[i+3] /* B */, data[i+4] /* W */);
        updated = true;
    }
    if (updated) {
        leds_show();
    }
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

    // Give the UDP packet time to actually leave the chip before
    // we wipe WiFi credentials and reboot. 500ms is generous even
    // on congested networks.
    vTaskDelay(pdMS_TO_TICKS(500));

    ESP_LOGI(PROTOCOL_TAG, "Performing WiFi reset...");
    storage_delete("wifi", NULL); 

    ESP_LOGI(PROTOCOL_TAG, "WiFi credentials reset, restarting...");
    esp_restart();
}

/**
 * Reply with the firmware version string from the build (PROJECT_VER /
 * `git describe`). Same wire pattern as GET_CONFIG hostname: variable-length,
 * no terminator, length carried by udp_packet.len.
 */
static void protocol_get_version(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "GET_VERSION");

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = GET_VERSION;

    const esp_app_desc_t *desc = esp_app_get_description();
    size_t version_len = strlen(desc->version);
    size_t max_len = (sizeof(response.data) > 2) ? (sizeof(response.data) - 2) : 0;
    if (version_len > max_len) {
        version_len = max_len;
    }
    memcpy(&response.data[2], desc->version, version_len);
    response.len = 2 + version_len;

    udp_con_send(&response);
}

/**
 * Reply with device status: uptime (4 bytes), free heap (4 bytes), RSSI (1 byte).
 * Wire format: [packet_id, GET_STATUS, uptime(32-bit big-endian), heap(32-bit big-endian), rssi(int8)]
 * Total payload: 9 bytes.
 */
static void protocol_get_status(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "GET_STATUS");

    uint32_t uptime_s = (uint32_t)(esp_timer_get_time() / 1000000ULL);
    uint32_t free_heap = (uint32_t)esp_get_free_heap_size();

    int8_t rssi = 0;
    wifi_ap_record_t ap_info;
    if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
        rssi = ap_info.rssi;
    }

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = GET_STATUS;
    response.data[2] = (uptime_s >> 24) & 0xFF;
    response.data[3] = (uptime_s >> 16) & 0xFF;
    response.data[4] = (uptime_s >> 8) & 0xFF;
    response.data[5] = uptime_s & 0xFF;
    response.data[6] = (free_heap >> 24) & 0xFF;
    response.data[7] = (free_heap >> 16) & 0xFF;
    response.data[8] = (free_heap >> 8) & 0xFF;
    response.data[9] = free_heap & 0xFF;
    response.data[10] = *(uint8_t*)&rssi; // write int8 as raw byte
    response.len = 11;

    udp_con_send(&response);
}
