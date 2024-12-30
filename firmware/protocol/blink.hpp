#define BLINK_DELAY 1000
#define BLINK_COUNT 3

void protocol_blink(AsyncUDPPacket *packet)
{
    uint8_t *data = packet->data();
    size_t len = packet->length();

    if (len < 13)
    {
        DEBUG_PRINTLN("Invalid BLINK packet");
        return;
    }

    DEBUG_PRINTLN("BLINK");

    uint8_t count = config.id;
    uint8_t base_color[4] = {data[2], data[3], data[4], data[5]};
    uint8_t blink_color[4] = {data[6], data[7], data[8], data[9]};
    uint8_t blink_count = data[10];
    uint8_t blink_delay = data[11] << 8 | data[12];

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
