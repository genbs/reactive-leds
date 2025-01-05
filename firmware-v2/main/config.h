#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>
#include <stdint.h>

#define HOSTNAME "esp32s3-1"
#define PORT 4210
#define NUM_LEDS 14
#define ID 1
#define LED_PIN 18

typedef struct
{
    char hostname[32];
    uint16_t port;
    uint8_t id;
    uint8_t num_leds;
    uint8_t pin;
    uint8_t brightness;
} config_t;


config_t config_get();
bool config_store();

#endif
