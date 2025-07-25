#ifndef LEDS_H
#define LEDS_H

#include <stdint.h>
#include <stdbool.h>

bool leds_begin();
void leds_update(uint8_t pixel_index, uint8_t r, uint8_t g, uint8_t b, uint8_t w);
void leds_clear();
void leds_show();
void leds_end();

#endif // LEDS_H