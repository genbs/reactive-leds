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

    config.pin = CONFIG_LED_PIN;
    config.num_leds = CONFIG_NUM_LEDS;
    config.port = CONFIG_PORT;
    strncpy(config.hostname, CONFIG_LWIP_LOCAL_HOSTNAME, sizeof(config.hostname) - 1);
    config.hostname[sizeof(config.hostname) - 1] = '\0';

    char buf[32];
    size_t len = sizeof(buf);

    if (storage_has_key("config", "pin")) {
        len = sizeof(buf);
        storage_get("config", "pin", buf, &len);
        config.pin = (uint8_t)atoi(buf);
    }

    if (storage_has_key("config", "num_leds")) {
        len = sizeof(buf);
        storage_get("config", "num_leds", buf, &len);
        config.num_leds = (uint8_t)atoi(buf);
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


static esp_err_t config_set_uint(const char* key, unsigned int value) {
    char tmp[32];
    snprintf(tmp, sizeof(tmp), "%u", value);
    return storage_set("config", key, tmp);
}


bool config_store() {
    ESP_LOGI(CONFIG_TAG, "Storing configuration...");

    if (config_set_uint("pin", config.pin) != ESP_OK ||
        config_set_uint("num_leds", config.num_leds) != ESP_OK ||
        config_set_uint("port", config.port) != ESP_OK ||
        storage_set("config", "hostname", config.hostname) != ESP_OK) {
        ESP_LOGE(CONFIG_TAG, "Configuration store failed");
        return false;
    }

    ESP_LOGI(CONFIG_TAG, "Configuration stored successfully.");
    return true;
}

void config_print() {
    ESP_LOGI(CONFIG_TAG, "Config:  pin=%u, num_leds=%u, port=%u, hostname=%s\n",
        config.pin, config.num_leds, config.port, config.hostname);
}
