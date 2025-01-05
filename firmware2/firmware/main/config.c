#include "config.h"

static Config config = {
    HOSTNAME,
    PORT,
    ID,
    NUM_LEDS,
    15,
    255
};

Config config_get()
{
    return config;
}

bool config_store()
{
    return 1;
}