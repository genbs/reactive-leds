#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>
#include <stdint.h>

typedef struct
{
    uint8_t pin;
    uint8_t num_leds;
    uint16_t port;
    char hostname[33];
} config_t;

extern config_t config;

void config_begin();
bool config_store();
void config_print();

#endif // CONFIG_H
