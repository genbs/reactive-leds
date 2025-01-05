#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>
#include <stdint.h>

#define HOSTNAME "esp32s3-1"
#define PORT 4210
#define NUM_LEDS 15
#define ID 1

typedef struct
{
    char hostname[32];
    uint16_t port;
    uint8_t id;
    uint8_t num_leds;
    uint8_t pin;
    uint8_t brightness;
} Config;


Config config_get();
bool config_store();

#endif
