#include <stdio.h>
#include <stdbool.h>
#include "freertos/FreeRTOS.h"
#include "freertos/projdefs.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "storage.h"
#include "wifi.h"
#include "config.h"
#include "protocol.h"
#include "ble.h"

#define TAG "MAIN"

void delay(uint32_t ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}

void app_main(void)
{
    storage_begin();

    
    wifi_init_sta();

    wifi_disable_sleep();

    int num_networks;
    wifi_ap_record_t *networks = wifi_scan(&num_networks);
    ESP_LOGV(TAG, "Found %d networks", num_networks);

    bool connected = false;
    char pass[32];
    char ssid[32];
    size_t pass_len = sizeof(pass);

    for (int i = 0; i < num_networks; i++) {
        char scanned_ssid[33];
        memset(scanned_ssid, 0, sizeof(scanned_ssid));      
        memcpy(scanned_ssid, networks[i].ssid, 32);         

        ESP_LOGI(TAG, "SSID: %s, RSSI: %d, Channel: %d, Authmode: %d",
                 scanned_ssid,
                 networks[i].rssi,
                 networks[i].primary,
                 networks[i].authmode);

        if (storage_has_key("wifi", scanned_ssid)) {
            ESP_LOGI(TAG, "Trying to connect to %s", scanned_ssid);
            
            storage_get("wifi", scanned_ssid, pass, &pass_len);
            pass[pass_len] = '\0';
            // print the password
            ESP_LOGI(TAG, "Password: '%s'", pass);
            wifi_connect(scanned_ssid, pass);

            uint32_t start = esp_log_timestamp();
            while (esp_log_timestamp() - start < 20000) {
                if (wifi_connected()) {
                    connected = true;
                    strncpy(ssid, scanned_ssid, sizeof(ssid) - 1);
                    ssid[sizeof(ssid) - 1] = '\0';

                    ESP_LOGI(TAG, "Connected to %s", ssid);
                    break;
                }
                delay(300);

                ESP_LOGI(TAG, ".");
            }
        }
    }

    if (!connected) {
        ESP_LOGI(TAG, "No known networks found, starting BLE");
        wifi_stop();
        ble_begin();
    
        while (1) {
            delay(100);
        }
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

            wifi_connect(ssid, pass);

            while (!wifi_connected()) {
                delay(100);
            }
        }
    }
}
