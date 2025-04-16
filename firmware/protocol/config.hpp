void protocol_get_config(AsyncUDPPacket *packet)
{
    uint8_t *data = packet->data();

    udp_response[0] = data[0];
    udp_response[1] = GET_CONFIG;
    udp_response[2] = (config.port >> 8) & 0xFF;
    udp_response[3] = config.port & 0xFF;
    udp_response[4] = config.id;
    udp_response[5] = config.num_leds;
    udp_response[6] = config.brightness;

    size_t hostname_len = strlen(config.hostname);
    memcpy(&udp_response[7], config.hostname, hostname_len);

    packet->write(udp_response, 7 + hostname_len);

    DEBUG_PRINTLN("GET_CONFIG");
}

void protocol_set_config(AsyncUDPPacket *packet)
{
    uint8_t *data = packet->data();
    size_t len = packet->length();

    if (len < 3)
    {
        DEBUG_PRINTLN("Invalid SET_CONFIG packet");
        return;
    }

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

    udp_response[0] = data[0];
    udp_response[1] = SET_CONFIG;

    if (config_store())
    {
        udp_response[2] = 1;
        DEBUG_PRINTLN("SET_CONFIG: Configuration saved successfullyå");

        strip_update(config.num_leds, config.brightness);
    }
    else
    {
        udp_response[2] = 0;
        DEBUG_PRINTLN("SET_CONFIG: Configuration save failed.");
    }

    packet->write(udp_response, 3);
}