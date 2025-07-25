#include <stdio.h>
#include <stdbool.h>
#include "freertos/FreeRTOS.h"
#include "freertos/projdefs.h"
#include "freertos/task.h"
#include "esp_heap_caps.h"
#include "esp_log.h"
#include "string.h"

#include "storage.h"
#include "wifi.h"
#include "config.h"
#include "protocol.h"
#include "ble.h"

#define TAG "MAIN"

#define CHECK_CONNECTED_TIMEOUT 100 // delay to check if wifi/ble is connected
#define WIFI_CONNECT_TIMEOUT 20000 // Timeout to enstablish wifi connection
#define BLE_TIMEOUT_MS 60000 // Reboot if no BLE connection is established

// current wifi credentials
typedef struct {
    char ssid[32];
    char pass[WIFI_PASS_MAX_LEN];
} wifi_credentials_t;

void delay(uint32_t ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}

/**
 * Scan all wifi networks, check if any of them is known and try to connect to it.
 */
bool connect_to_known_networks(wifi_credentials_t *credentials) {
    int num_networks;

    ESP_LOGI(TAG, "Scanning for WiFi networks...");
    // scan wifi networks and get the list of available networks
    wifi_ap_record_t *networks = wifi_scan(&num_networks);
    
    if (num_networks <= 0) {
        ESP_LOGI(TAG, "No networks found.");
        free(networks);
        return false;
    }

    ESP_LOGV(TAG, "Found %d networks", num_networks);
    for (int i = 0; i < num_networks; i++) {
        char scanned_ssid[33] = {0};
        snprintf(scanned_ssid, sizeof(scanned_ssid), "%.*s", 32, networks[i].ssid);

        ESP_LOGV(TAG, "Found SSID: %s, RSSI: %d, Channel: %d, Authmode: %d",
            scanned_ssid, networks[i].rssi, networks[i].primary, networks[i].authmode);

        // check if the network is known
        if (storage_has_key("wifi", scanned_ssid)) {
            ESP_LOGV(TAG, "Trying to connect to %s", scanned_ssid);
                        
            // store the password and ssid in the credentials struct
            size_t pass_len = sizeof(credentials->pass) - 1;
            storage_get("wifi", scanned_ssid, credentials->pass, &pass_len);
            credentials->pass[pass_len] = '\0';
            strncpy(credentials->ssid, scanned_ssid, sizeof(credentials->ssid) - 1);

            // try to connect to the network
            wifi_connect(credentials->ssid, credentials->pass);

            uint32_t start = esp_log_timestamp();
            while (esp_log_timestamp() - start < WIFI_CONNECT_TIMEOUT) {
                if (wifi_connected()) {
                    ESP_LOGI(TAG, "Connected to %s", credentials->ssid);
                    free(networks);
                    return true;
                }

                delay(CHECK_CONNECTED_TIMEOUT);
            }

            ESP_LOGW(TAG, "Failed to connect to %s", credentials->ssid);

            // TODO: remove the network from the known networks, maybe the password is wrong
            // storage_delete("wifi", scanned_ssid);
        } else {
            ESP_LOGI(TAG, "Network %s is unknown", scanned_ssid);
        }
    }
    
    free(networks);
    return false;
}

/**
 * Start BLE and wait to retrieve the wifi credentials from the client.
 * When client sends the credentials, store them and reboot the device.
 */
void ble_configuration_loop() {
    ble_begin();
    
    uint32_t start_time = esp_log_timestamp();
    while (esp_log_timestamp() - start_time < BLE_TIMEOUT_MS) { 
        delay(CHECK_CONNECTED_TIMEOUT);
    }

    ESP_LOGW(TAG, "BLE timeout, rebooting");
    esp_restart();
}

/**
 * Protocol loop task.
 */
void app_protocol_loop(void *param) {
    while (1) {
        protocol_loop();

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

/**
 * While connected to wifi, keep the connection alive.
 * If the connection is lost, try to reconnect.
 */
void wifi_reconnect_task(void *param) {
    wifi_credentials_t *credentials = (wifi_credentials_t *)param;

    while (1) {
        if (wifi_connected()) {
            delay(CHECK_CONNECTED_TIMEOUT);
        } else {
            ESP_LOGI(TAG, "Reconnecting to WiFi");
            wifi_connect(credentials->ssid, credentials->pass);

            uint32_t start_time = esp_log_timestamp();
            while (!wifi_connected()) {
                delay(CHECK_CONNECTED_TIMEOUT);

                if (esp_log_timestamp() - start_time > WIFI_CONNECT_TIMEOUT) {
                    ESP_LOGW(TAG, "WiFi connection timeout, rebooting");
                    
                    // TODO: off the leds?
                    esp_restart();
                }
            }
        }
    }
}

/**
 * Application entry point.
 * 
 * Connect to known WiFi networks or start BLE configuration if none are found.
 * If wifi is connected, start the protocol to communicate with the server.
 */
void app_main(void)
{
    // init storage service
    storage_begin();

    // load config from storage
    config_begin();
    config_print();

    // start wifi in station mode and disable sleep
    wifi_init_sta();
    wifi_disable_sleep();

    wifi_credentials_t credentials = {0};
    if (!connect_to_known_networks(&credentials)) {
        ESP_LOGI(TAG, "No known networks found, starting BLE");

        // stop wifi, when BLE receives the credentials, it will restart the device
        wifi_stop();

        // start ble configuration loop
        ble_configuration_loop();
    } else {
        // stop BLE
        ble_down();
    }
    
    // Start application
    ESP_LOGI(TAG, "Connected to WiFi");
    ESP_LOGI(TAG, "IP address: %s", wifi_ip());
    ESP_LOGI(TAG, "Hostname: %s", config.hostname);
    ESP_LOGI(TAG, "MAC address: %s", wifi_mac());

    // Start protocol to handshake with the server and communicate with it
    if (!protocol_begin()) {   
        ESP_LOGE(TAG, "Failed to start protocol");
        esp_restart();
    }

    // Keep connected to WiFi and handle reconnections
    xTaskCreatePinnedToCore(wifi_reconnect_task, "wifi_reconnect_task", 4096, &credentials, 1, NULL, 1);

    // Create a task to monitor the protocol
    xTaskCreatePinnedToCore(app_protocol_loop, "app_protocol_loop", 4096, NULL, 5, NULL, 0);
    
    // Delete the main task
    vTaskDelete(NULL);
}