#include <Adafruit_NeoPixel.h>

#define LED_PIN 4
#define STRIP_TYPE NEO_WRGB + NEO_KHZ800

Adafruit_NeoPixel strip = Adafruit_NeoPixel(config.num_leds, LED_PIN, STRIP_TYPE);

void stripe_clear()
{
    for (int i = 0; i < config.num_leds; i++)
        strip.setPixelColor(i, 0, 0, 0);
    strip.show();
}

void strip_begin()
{
    strip.setPin(LED_PIN);
    strip.updateLength(config.num_leds);
    strip.updateType(STRIP_TYPE);

    strip.begin();
    strip.setBrightness(config.brightness);

    stripe_clear();
}
