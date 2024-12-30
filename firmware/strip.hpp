#include <Adafruit_NeoPixel.h>

#define LED_PIN 4
#define STRIP_TYPE NEO_WRGB + NEO_KHZ800

Adafruit_NeoPixel strip = Adafruit_NeoPixel(config.num_leds, LED_PIN, STRIP_TYPE);

size_t led_buffer_size = config.num_leds * 5;
uint8_t *led_buffer = (uint8_t *)malloc(led_buffer_size);

void strip_update(uint8_t num_leds, uint8_t brightness)
{
    strip.updateLength(num_leds);
    strip.setBrightness(brightness);

    size_t prev_size = led_buffer_size;
    led_buffer_size = num_leds * 5;
    led_buffer = (uint8_t *)realloc(led_buffer, led_buffer_size);

    if (prev_size < led_buffer_size)
        memset(led_buffer + prev_size, 0, led_buffer_size - prev_size);

    for (int i = 0; i < num_leds; i++)
        strip.setPixelColor(led_buffer[i * 5], led_buffer[i * 5 + 1], led_buffer[i * 5 + 2], led_buffer[i * 5 + 3], led_buffer[i * 5 + 4]);

    strip.show();
}

void strip_clear()
{
    for (int i = 0; i < config.num_leds; i++)
        strip.setPixelColor(i, 0, 0, 0);
    strip.show();
}

void strip_begin()
{
    strip.setPin(LED_PIN);
    strip.updateType(STRIP_TYPE);

    strip_update(config.num_leds, config.brightness);

    strip.begin();

    strip_clear();
}
