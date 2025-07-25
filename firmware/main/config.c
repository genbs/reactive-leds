#include "config.h"
#include "sdkconfig.h"
#include "storage.h"

#include "esp_log.h"
#include <string.h>    
#include <stdio.h>     
#include <stdlib.h>    

#define CONFIG_TAG "CONFIG_SERVICE"

config_t config;

void config_begin(void) {
    ESP_LOGI(CONFIG_TAG, "Loading configuration...");

    // Initialize default values
    config.pin = CONFIG_LED_PIN;
    config.num_leds = CONFIG_NUM_LEDS;
    config.brightness = CONFIG_BRIGHTNESS;
    config.port = CONFIG_PORT;
    strncpy(config.hostname, CONFIG_LWIP_LOCAL_HOSTNAME, sizeof(config.hostname) - 1);
    config.hostname[sizeof(config.hostname) - 1] = '\0'; 

    // overwrite with stored values if they exist
    char buf[32];
    size_t len = sizeof(buf);
    
    if (storage_has_key("config", "pin")) {
        storage_get("config", "pin", buf, &len);
        config.pin = (uint8_t)atoi(buf);
    }
    
    if (storage_has_key("config", "num_leds")) {
        storage_get("config", "num_leds", buf, &len);
        config.num_leds = (uint8_t)atoi(buf);
    }

    if (storage_has_key("config", "brightness")) {
        storage_get("config", "brightness", buf, &len);
        config.brightness = (uint8_t)atoi(buf);
    }
    
    if (storage_has_key("config", "port")) {
        len = sizeof(buf);
        storage_get("config", "port", buf, &len);
        config.port = (uint16_t)atoi(buf);
    }

    if (storage_has_key("config", "hostname")) {
        len = sizeof(config.hostname);
        storage_get("config", "hostname", config.hostname, &len);
    }

    ESP_LOGI(CONFIG_TAG, "Configuration loaded successfully.");
}

bool config_store() {
    ESP_LOGI(CONFIG_TAG, "Storing configuration...");
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

    ESP_LOGI(CONFIG_TAG, "Configuration stored successfully.");
    return true;
}

void config_print() {
    ESP_LOGI(CONFIG_TAG, "Config:  pin=%u, num_leds=%u, brightness=%u, port=%u, hostname=%s\n",
        config.pin, config.num_leds, config.brightness, config.port, config.hostname);
}