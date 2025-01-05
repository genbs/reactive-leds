#include "config.h"

static config_t config = {
    HOSTNAME,
    PORT,
    ID,
    NUM_LEDS,
    15,
    255
};

config_t config_get()
{
    return config;
}

bool config_store()
{
    return 1;
}