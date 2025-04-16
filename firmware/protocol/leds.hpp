
uint8_t *led_buffer_update;
bool led_update_available = false;

void protocol_set_leds(AsyncUDPPacket *packet)
{
    uint8_t *data = packet->data();
    size_t len = packet->length();

    if (len < 2 + led_buffer_size)
    {
        DEBUG_PRINTLN("Invalid SET_LEDS packet");
        return;
    }

    memcpy(led_buffer_update, &data[2], led_buffer_size);
    led_update_available = true;
}

void update_leds()
{
    if (!led_update_available)
    {
        return;
    }

    size_t leds_updated = 0;
    for (int i = 0; i < led_buffer_size; i += 5)
    {
        uint8_t led_index = led_buffer_update[i];
        if (led_index >= config.num_leds)
        {
            continue;
        }

        if (memcmp(&led_buffer[led_index * 5 + 1], &led_buffer_update[i + 1], 4) == 0)
        {
            continue;
        }

        uint8_t r = led_buffer_update[i + 1];
        uint8_t g = led_buffer_update[i + 2];
        uint8_t b = led_buffer_update[i + 3];
        uint8_t w = led_buffer_update[i + 4];

        strip.setPixelColor(led_index, r, g, b, w);

        memcpy(&led_buffer[led_index * 5], &led_buffer_update[i], 5);

        leds_updated++;
    }

    if (leds_updated > 0)
    {
        DEBUG_PRINTF("Updated %d LEDs\n", leds_updated);

        strip.show();
    }

    led_update_available = false;
}