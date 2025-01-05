#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "wifi.h"
#include "config.h"
#include "protocol.h"

#define TAG "MAIN"

void delay(uint32_t ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES ||
        ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    wifi_init_sta();

    wifi_connect(
        "TP-Link_B229",
        "41156888"
    );

    ESP_LOGI(TAG, "Connecting to WiFi");

    while (!wifi_connected()) {
        ESP_LOGI(TAG, "Waiting for WiFi connection...");
        delay(1000);
    }

    ESP_LOGI(TAG, "Connected to WiFi");
    ESP_LOGI(TAG, "IP address: %s", wifi_ip());
    ESP_LOGI(TAG, "MAC address: %s", wifi_mac());

    protocol_begin();

    while (1) {
        if (wifi_connected()) {
            protocol_loop();
        } else {
            ESP_LOGI(TAG, "Reconnecting to WiFi");

            wifi_connect(
                "TP-Link_B229",
                "41156888"
            );
        }
    }
}


