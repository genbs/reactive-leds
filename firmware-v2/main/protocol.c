#include "protocol.h"


uint8_t *protocol_response = NULL;

bool protocol_begin() {
    protocol_response = (uint8_t *)malloc(1 + 1 + config_get().num_leds * 5);

    if (udp_con_begin(4210)) {
        leds_begin();

        return 1;
    }

    return 0;
}

void protocol_process_packet(udp_packet *packet)
{
    size_t length = packet->len;
    if (length < 2)
    {
        ESP_LOGW(PROTOCOL_TAG, "Received invalid packet");
        return;
    }

    switch (packet->data[1])
    {
    case PING:
        protocol_ping(packet);
        break;
    case GET_CONFIG:
        protocol_get_config(packet);
        break;
    case SET_CONFIG:
        protocol_set_config(packet);
        break;
    case SET_LEDS:
        protocol_set_leds(packet);
        break;
    // case BLINK:
    //     protocol_blink(packet);
    //     break;
    default:
        ESP_LOGW(PROTOCOL_TAG, "Unknown message type");
        break;
    }
}

void protocol_loop()
{
    udp_packet *packet = udp_con_read();
    if (packet != NULL) {
        ESP_LOGI(PROTOCOL_TAG, "Received %d bytes from %s:", packet->len, packet->address);
        ESP_LOGI(PROTOCOL_TAG, "%s", packet->data);
        
        protocol_process_packet(packet);
    }
}


void protocol_ping(udp_packet *packet)
{
    protocol_response[0] = packet->data[0];
    protocol_response[1] = PING;

    udp_con_send(protocol_response, 2, &packet->source_addr);

    ESP_LOGI(PROTOCOL_TAG, "PING");
}


void protocol_get_config(udp_packet *packet)
{
    uint8_t *data = packet->data;

    config_t config = config_get();
    protocol_response[0] = data[0];
    protocol_response[1] = GET_CONFIG;
    protocol_response[2] = (config.port >> 8) & 0xFF;
    protocol_response[3] = config.port & 0xFF;
    protocol_response[4] = config.id;
    protocol_response[5] = config.num_leds;
    protocol_response[6] = config.brightness;

    size_t hostname_len = strlen(config.hostname);
    memcpy(&protocol_response[7], config.hostname, hostname_len);

    udp_con_send(protocol_response, 7 + hostname_len, &packet->source_addr);

    ESP_LOGI(PROTOCOL_TAG, "GET_CONFIG");
}

void protocol_set_config(udp_packet *packet)
{
    uint8_t *data = packet->data;
    size_t len = packet->len;

    if (len < 3)
    {
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_CONFIG packet");
        return;
    }

    config_t config = config_get();
    config.port = (data[2] << 8) | data[3]; // TODO: if port changes, restart the server
    config.id = data[4];
    config.num_leds = data[5];
    config.brightness = data[6];

    uint8_t hostname_length = len - 7;
    if (hostname_length >= sizeof(config.hostname))
    {
        hostname_length = sizeof(config.hostname) - 1;
    }
    memcpy(config.hostname, &data[7], hostname_length);
    config.hostname[hostname_length] = '\0';

    protocol_response[0] = data[0];
    protocol_response[1] = SET_CONFIG;

    if (config_store())
    {
        protocol_response[2] = 1;
        ESP_LOGI(PROTOCOL_TAG, "SET_CONFIG: Configuration saved successfully");

        //strip_update(config.num_leds, config.brightness);
    }
    else
    {
        protocol_response[2] = 0;
        ESP_LOGI(PROTOCOL_TAG, "SET_CONFIG: Configuration save failed.");
    }

    udp_con_send(protocol_response, 3, &packet->source_addr);
}

void protocol_set_leds(udp_packet *packet)
{
    uint8_t *data = packet->data;
    size_t len = packet->len;

    if (len < 2 + 5 /* index + RGBW */)
    {
        ESP_LOGW(PROTOCOL_TAG, "Invalid SET_LEDS packet");
        return;
    }


    for (int i = 2; i < len; i += 5)
    {
        uint8_t pixel_index = data[i];
        uint8_t r = data[i + 1];
        uint8_t g = data[i + 2];
        uint8_t b = data[i + 3];
        uint8_t w = data[i + 4];

        leds_update(pixel_index, r, g, b, w);
    }

    leds_show();

    protocol_response[0] = data[0];
    protocol_response[1] = SET_LEDS;
    udp_con_send(protocol_response, 2, &packet->source_addr);
}