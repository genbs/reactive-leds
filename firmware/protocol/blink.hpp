#define BLINK_DELAY 1000
#define BLINK_COUNT 3

void protocol_blink(uint8_t message_id, uint8_t *packet, size_t len)
{
    if (len < 13)
    {
        DEBUG_PRINTLN("Invalid BLINK packet");
        return;
    }

    DEBUG_PRINTLN("BLINK");

    uint8_t count = config.id;
    uint8_t base_color[4] = {packet[2], packet[3], packet[4], packet[5]};
    uint8_t blink_color[4] = {packet[6], packet[7], packet[8], packet[9]};
    uint8_t blink_count = packet[10];
    uint8_t blink_delay = packet[11] << 8 | packet[12];

    for (int repeat = 0; repeat < blink_count; repeat++)
    {
        for (int i = 0; i < config.num_leds; i++)
        {
            if (i < count)
                strip.setPixelColor(i, base_color[0], base_color[1], base_color[2], base_color[3]);
            else
                strip.setPixelColor(i, 0, 0, 0, 0);
        }
        strip.show();
        delay(blink_delay);

        for (int i = 0; i < count; i++)
        {
            strip.setPixelColor(i, blink_color[0], blink_color[1], blink_color[2], blink_color[3]);
            strip.show();
            delay(500);
        }
        delay(blink_delay);
    }
}
