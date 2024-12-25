void protocol_get_config(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(GET_CONFIG);
    udp.write((config.port >> 8) & 0xFF);
    udp.write(config.port & 0xFF);
    udp.write(config.id);
    udp.write(config.num_leds);
    udp.write(config.brightness);
    udp.write((uint8_t *)config.hostname, strlen(config.hostname));
    udp.endPacket();

    DEBUG_PRINTLN("GET_CONFIG");
}

void protocol_set_config(uint8_t message_id, uint8_t *packet, size_t len)
{
    if (len < 3)
    {
        DEBUG_PRINTLN("Invalid SET_CONFIG packet");
        return;
    }

    config.port = (packet[2] << 8) | packet[3];
    config.id = packet[4];
    config.num_leds = packet[5];
    config.brightness = packet[6];

    uint8_t hostname_length = len - 7;
    if (hostname_length >= sizeof(config.hostname))
    {
        hostname_length = sizeof(config.hostname) - 1;
    }
    memcpy(config.hostname, &packet[7], hostname_length);
    config.hostname[hostname_length] = '\0';

    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(SET_CONFIG);
    if (config_store())
    {
        udp.write(1);
        DEBUG_PRINTLN("SET_CONFIG: Configuration saved successfully. Restarting in 2 seconds.");
        delay(2000);
        ESP.restart();
    }
    else
    {
        udp.write(0);
        DEBUG_PRINTLN("SET_CONFIG: Configuration save failed.");
    }
    udp.endPacket();
}