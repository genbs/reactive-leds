#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>
#include <stdint.h>
#include "esp_log.h"
#include "storage.h"

#define CONFIG_TAG "CONFIG_SERVICE"

#define LED_PIN 18
#define NUM_LEDS 16
#define BRIGHTNESS 255
#define PORT 4210
#define HOSTNAME "esp32-4"

typedef struct
{
    uint8_t pin;
    uint8_t num_leds;
    uint8_t brightness;
    uint16_t port;
    char hostname[32];
} config_t;

extern config_t config;

void config_begin();
bool config_store();
void config_print();

#endif
