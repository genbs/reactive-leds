#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip(16, 4, NEO_WRGB + NEO_KHZ800);

void strip_start()
{
    strip.begin();
    strip.setBrightness(config.brightness);

    for (int i = 0; i < config.num_leds; i++)
        strip.setPixelColor(i, 0, 0, 0);

    strip.show();
}

void strip_set_color_immediate(int led, int r, int g, int b)
{
    strip.setPixelColor(led, r, g, b);
    strip.show();
}