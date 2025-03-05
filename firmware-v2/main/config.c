#include <stdio.h>
#include <stdlib.h>
#include "config.h"
#include "storage.h"

config_t config = {
    LED_PIN,
    NUM_LEDS,
    BRIGHTNESS,
    PORT,     
    HOSTNAME
};


void config_begin(void) {
    char buf[32];
    size_t len;
    
    if (storage_has_key("config", "pin")) {
        len = sizeof(buf);
        storage_get("config", "pin", buf, &len);
        memset(buf, 0, sizeof(buf));
        config.pin = (uint8_t)atoi(buf);
        ESP_LOGI(CONFIG_TAG, "Loaded pin: %u", config.pin);
    }
    
    if (storage_has_key("config", "num_leds")) {
        len = sizeof(buf);
        storage_get("config", "num_leds", buf, &len);
        memset(buf, 0, sizeof(buf));
        config.num_leds = (uint8_t)atoi(buf);
        ESP_LOGI(CONFIG_TAG, "Loaded num_leds: %u", config.num_leds);
    }

    if (storage_has_key("config", "brightness")) {
        len = sizeof(buf);
        storage_get("config", "brightness", buf, &len);
        memset(buf, 0, sizeof(buf));
        config.brightness = (uint8_t)atoi(buf);
        ESP_LOGI(CONFIG_TAG, "Loaded brightness: %u", config.brightness);
    }
    
    if (storage_has_key("config", "port")) {
        len = sizeof(buf);
        storage_get("config", "port", buf, &len);
        memset(buf, 0, sizeof(buf));
        config.port = (uint16_t)atoi(buf);
        ESP_LOGI(CONFIG_TAG, "Loaded port: %u", config.port);
    }

    if (storage_has_key("config", "hostname")) {
        len = sizeof(config.hostname);
        memset(buf, 0, sizeof(buf));
        storage_get("config", "hostname", config.hostname, &len);
        ESP_LOGI(CONFIG_TAG, "Loaded hostname: %s", config.hostname);
    }
}

bool config_store() {
    char tmp[32];

    snprintf(tmp, sizeof(tmp), "%u", config.pin);
    storage_set("config", "pin", tmp);

    snprintf(tmp, sizeof(tmp), "%u", config.num_leds);
    storage_set("config", "num_leds", tmp);

    snprintf(tmp, sizeof(tmp), "%u", config.brightness);
    storage_set("config", "brightness", tmp);

    snprintf(tmp, sizeof(tmp), "%u", config.port);
    storage_set("config", "port", tmp);

    storage_set("config", "hostname", config.hostname);

    return true;
}

void config_print() {
    ESP_LOGI(CONFIG_TAG, "Config:  pin=%u, num_leds=%u, brightness=%u, port=%u, hostname=%s\n",
        config.pin, config.num_leds, config.brightness, config.port, config.hostname);
}