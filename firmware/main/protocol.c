#include "protocol.h"

#include "esp_wifi.h"
#include "esp_app_desc.h"
#include "esp_heap_caps.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "driver/gpio.h"
#include "config.h"
#include "storage.h"
#include "udp_con.h"
#include "leds.h"
#include "wifi.h"
#include "esp_log.h"
#include <string.h>
#include <arpa/inet.h>

#define PROTOCOL_TAG "PROTOCOL"

// Runtime counters exposed by GET_STATUS.
static uint32_t s_led_frames_received = 0;
static uint32_t s_udp_packets_read = 0;
static uint32_t s_protocol_loop_max_gap_ms = 0;
static int64_t s_protocol_loop_last_us = 0;

// Benchmark SET_LEDS inter-arrival counters. Packet id 0 is untracked so
// ordinary one-shot commands do not pollute the histogram. The benchmark
// sender uses id 1 only for its start marker and streams frames as ids
// 2..255; that split lets us tell marker from stream by id alone, with no
// timing heuristic (see track_set_leds_metrics).
#define ARRIVAL_GAP_BUCKETS 6
#define SET_LEDS_BENCHMARK_START_PACKET_ID 1
#define SET_LEDS_STREAM_FIRST_PACKET_ID 2
#define SET_LEDS_STREAM_PACKET_COUNT 254 // ids 2..255
#define SET_LEDS_STREAM_PAUSE_MS 2000

static const uint32_t k_arrival_gap_bounds_ms[ARRIVAL_GAP_BUCKETS - 1] = {
    5, 10, 20, 50, 100
};
static uint32_t s_arrival_gap_hist[ARRIVAL_GAP_BUCKETS] = {0};
static uint32_t s_arrival_gap_max_ms = 0;
static int64_t s_arrival_gap_max_at_us = 0;
static int64_t s_last_set_leds_us = 0;

// Optional benchmark tracking: packet id 0 is the fire-and-forget path used by
// ordinary SET_LEDS senders. Benchmark streams use ids 2..255 (id 1 is the
// start marker), so sequence deltas are computed in that 254-wide space.
static uint32_t s_seq_lost = 0;
static uint32_t s_seq_reordered = 0;
static bool s_seq_started = false;
static uint8_t s_seq_last = 0;

static int arrival_gap_bucket(uint32_t gap_ms)
{
    int bucket = 0;
    while (bucket < ARRIVAL_GAP_BUCKETS - 1 && gap_ms > k_arrival_gap_bounds_ms[bucket]) {
        bucket++;
    }
    return bucket;
}

static void reset_arrival_gap_max(void)
{
    s_arrival_gap_max_ms = 0;
    s_arrival_gap_max_at_us = 0;
    // The benchmark marker is not a measured frame; the next frame starts timing.
    s_last_set_leds_us = 0;
}

static void track_set_leds_gap(int64_t now_us)
{
    if (s_last_set_leds_us == 0) {
        s_last_set_leds_us = now_us;
        return;
    }

    uint32_t gap_ms = (uint32_t)((now_us - s_last_set_leds_us) / 1000);
    s_last_set_leds_us = now_us;

    if (gap_ms > SET_LEDS_STREAM_PAUSE_MS) {
        s_seq_started = false;
        return;
    }

    s_arrival_gap_hist[arrival_gap_bucket(gap_ms)]++;
    if (gap_ms > s_arrival_gap_max_ms) {
        s_arrival_gap_max_ms = gap_ms;
        s_arrival_gap_max_at_us = now_us;
    }
}

// Sequence tracking over the stream id space (2..255). Deltas are computed in
// that 254-wide ring so the 255 -> 2 wrap is a clean +1 step (no false loss),
// and forward gaps count as loss while backward jumps count as reordering.
// Only stream ids reach here; the marker is handled in track_set_leds_metrics.
static void track_set_leds_sequence(uint8_t packet_id)
{
    if (s_seq_started) {
        uint8_t pos = packet_id - SET_LEDS_STREAM_FIRST_PACKET_ID;
        uint8_t last = s_seq_last - SET_LEDS_STREAM_FIRST_PACKET_ID;
        uint8_t delta = (uint8_t)((pos + SET_LEDS_STREAM_PACKET_COUNT - last) % SET_LEDS_STREAM_PACKET_COUNT);
        if (delta > 1 && delta < SET_LEDS_STREAM_PACKET_COUNT / 2) {
            s_seq_lost += delta - 1;
        } else if (delta >= SET_LEDS_STREAM_PACKET_COUNT / 2) {
            s_seq_reordered++;
            if (s_seq_lost > 0) s_seq_lost--;
            return;
        }
    }

    s_seq_last = packet_id;
    s_seq_started = true;
}

static void track_set_leds_metrics(uint8_t packet_id)
{
    int64_t now_us = esp_timer_get_time();

    // The benchmark opens each run with the marker id (streams only ever use
    // 2..255), so this is unambiguous with no timing heuristic: reset the
    // per-run max gap and re-arm the sequence baseline. The marker is a beacon,
    // not a measured frame, so it is not fed to gap or sequence tracking — the
    // first stream frame arms the baseline instead.
    if (packet_id == SET_LEDS_BENCHMARK_START_PACKET_ID) {
        s_seq_started = false;
        reset_arrival_gap_max();
        return;
    }

    track_set_leds_gap(now_us);
    track_set_leds_sequence(packet_id);
}

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    RESET_WIFI = 4,
    GET_INFO = 5,
    GET_STATUS = 6,
};

static bool is_protocol_packet_valid(const udp_packet* packet);
static void protocol_process_packet(udp_packet* packet);
static void write_u16(uint8_t* data, int offset, uint16_t value);
static void write_u32(uint8_t* data, int offset, uint32_t value);
static size_t write_string(uint8_t* data, int offset, const char* value, size_t max_len);
static void protocol_ping(const udp_packet* request);
static void protocol_get_config(const udp_packet* request);
static void protocol_set_config(const udp_packet* request);
static void protocol_set_leds(const udp_packet* request);
static void protocol_reset_wifi(const udp_packet* request);
static void protocol_get_info(const udp_packet* request);
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
    int64_t now_us = esp_timer_get_time();

    if (s_protocol_loop_last_us != 0) {
        uint32_t gap_ms = (uint32_t)((now_us - s_protocol_loop_last_us) / 1000);
        if (gap_ms > s_protocol_loop_max_gap_ms) {
            s_protocol_loop_max_gap_ms = gap_ms;
        }
    }
    s_protocol_loop_last_us = now_us;

    if (udp_con_read(&s_packet_buffer)) {
        s_udp_packets_read++;
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
        case GET_INFO:    protocol_get_info(packet); break;
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

    int new_pin = data[2];
    uint8_t new_num_leds = data[3];
    uint16_t new_port = (data[4] << 8) | data[5];

    size_t hostname_len_from_packet = len - 6;
    if (!GPIO_IS_VALID_OUTPUT_GPIO(new_pin) || new_num_leds == 0 || new_port < 1024 ||
        hostname_len_from_packet >= sizeof(config.hostname)) {
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_CONFIG values");
        return;
    }
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

    // Benchmark measurement
    if (data[0] != 0) { 
        track_set_leds_metrics(data[0]);
    }

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
        s_led_frames_received++;
        leds_show();
    }
}

static void protocol_reset_wifi(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "RESET_WIFI");

    ESP_LOGI(PROTOCOL_TAG, "Performing WiFi reset...");
    esp_err_t err = storage_delete("wifi", NULL);

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = RESET_WIFI;
    response.data[2] = err == ESP_OK ? 1 : 0;
    response.len = 3;
    udp_con_send(&response);

    if (err != ESP_OK) {
        ESP_LOGE(PROTOCOL_TAG, "WiFi reset failed: %s", esp_err_to_name(err));
        return;
    }

    // Give the response time to leave the chip before rebooting.
    // 500ms is generous even on congested networks.
    vTaskDelay(pdMS_TO_TICKS(500));

    ESP_LOGI(PROTOCOL_TAG, "WiFi credentials reset, restarting...");
    esp_restart();
}

/**
 * Reply with device identity/info.
 * Wire format:
 * [packet_id, GET_INFO, ip(4), port(2), mac(6), version_len(1), version, hostname_len(1), hostname]
 */
static void protocol_get_info(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "GET_INFO");

    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = GET_INFO;

    const esp_app_desc_t *desc = esp_app_get_description();
    wifi_ip_bytes(&response.data[2]);
    write_u16(response.data, 6, config.port);
    wifi_mac_bytes(&response.data[8]);
    int offset = 14;
    offset += write_string(response.data, offset, desc->version, 32);
    offset += write_string(response.data, offset, config.hostname, 32);
    response.len = offset;

    udp_con_send(&response);
}

/**
 * Reply with device status.
 * Wire format:
 * [packet_id, GET_STATUS, uptime(4), heap(4), rssi(1), ...metrics, ...counters]
 * Metrics are appended as uint32 BE fields:
 * internal_heap, largest_heap_block, min_heap, frames_received, frames_shown,
 * frames_dropped, udp_packets_read, protocol_loop_max_gap_ms.
 * Extended counters (uint32 BE) follow:
 * arrival_gap_hist[6] (<=5, <=10, <=20, <=50, <=100, >100 ms),
 * arrival_gap_max_ms, arrival_gap_max_age_s (seconds since it occurred),
 * seq_lost, seq_reordered, beacon_timeouts, wifi_disconnects.
 */
static void protocol_get_status(const udp_packet* request)
{
    ESP_LOGV(PROTOCOL_TAG, "GET_STATUS");

    uint32_t uptime_s = (uint32_t)(esp_timer_get_time() / 1000000ULL);
    uint32_t free_heap = (uint32_t)esp_get_free_heap_size();
    uint32_t internal_heap = (uint32_t)heap_caps_get_free_size(MALLOC_CAP_INTERNAL);
    uint32_t largest_heap_block = (uint32_t)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT);
    uint32_t min_heap = (uint32_t)esp_get_minimum_free_heap_size();
    leds_stats_t stats = leds_stats();

    int8_t rssi = 0;
    wifi_ap_record_t ap_info;
    if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
        rssi = ap_info.rssi;
    }
    udp_packet response;
    response.source_addr = request->source_addr;
    response.data[0] = request->data[0];
    response.data[1] = GET_STATUS;
    write_u32(response.data, 2, uptime_s);
    write_u32(response.data, 6, free_heap);
    response.data[10] = *(uint8_t*)&rssi; // write int8 as raw byte
    write_u32(response.data, 11, internal_heap);
    write_u32(response.data, 15, largest_heap_block);
    write_u32(response.data, 19, min_heap);
    write_u32(response.data, 23, s_led_frames_received);
    write_u32(response.data, 27, stats.shown);
    write_u32(response.data, 31, stats.dropped);
    write_u32(response.data, 35, s_udp_packets_read);
    write_u32(response.data, 39, s_protocol_loop_max_gap_ms);
    for (int i = 0; i < ARRIVAL_GAP_BUCKETS; i++) {
        write_u32(response.data, 43 + i * 4, s_arrival_gap_hist[i]);
    }
    write_u32(response.data, 67, s_arrival_gap_max_ms);
    uint32_t gap_age_s = 0;
    if (s_arrival_gap_max_at_us != 0) {
        gap_age_s = (uint32_t)((esp_timer_get_time() - s_arrival_gap_max_at_us) / 1000000LL);
    }
    write_u32(response.data, 71, gap_age_s);
    write_u32(response.data, 75, s_seq_lost);
    write_u32(response.data, 79, s_seq_reordered);
    write_u32(response.data, 83, wifi_beacon_timeouts());
    write_u32(response.data, 87, wifi_disconnects());
    response.len = 91;

    udp_con_send(&response);
}

static void write_u16(uint8_t* data, int offset, uint16_t value)
{
    data[offset] = (value >> 8) & 0xFF;
    data[offset + 1] = value & 0xFF;
}

static void write_u32(uint8_t* data, int offset, uint32_t value)
{
    data[offset] = (value >> 24) & 0xFF;
    data[offset + 1] = (value >> 16) & 0xFF;
    data[offset + 2] = (value >> 8) & 0xFF;
    data[offset + 3] = value & 0xFF;
}

static size_t write_string(uint8_t* data, int offset, const char* value, size_t max_len)
{
    size_t len = strlen(value);
    if (len > max_len) len = max_len;
    data[offset] = len;
    memcpy(&data[offset + 1], value, len);
    return 1 + len;
}
