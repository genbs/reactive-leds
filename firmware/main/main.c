#include <stdio.h>
#include <stdbool.h>
#include "freertos/FreeRTOS.h"
#include "freertos/projdefs.h"
#include "freertos/task.h"
#include "esp_heap_caps.h"
#include "esp_log.h"

#include "storage.h"
#include "wifi.h"
#include "config.h"
#include "protocol.h"
#include "ble.h"
#include "serial_provisioning.h"

#define TAG "MAIN"

#define CHECK_CONNECTED_TIMEOUT 100 // polling interval for wifi/ble state checks
#define WIFI_RECONNECT_POLL_MS 1000

// Timeout per WiFi association attempt. 20s is generous (most associations
// complete in 2–5s), but covers slow routers and weak RSSI. At boot it caps
// the time spent trying each saved network before moving on to the next or
// starting provisioning.
#define WIFI_CONNECT_TIMEOUT 20000

// Reboot if no activity occurs for this long during provisioning. Includes user
// time for scan + selection + typing SSID + typing password.
#define PROVISIONING_TIMEOUT_MS 180000

// current wifi credentials
typedef struct {
    char ssid[WIFI_SSID_MAX_LEN];
    char pass[WIFI_PASS_MAX_LEN];
} wifi_credentials_t;

void delay(uint32_t ms)
{
    vTaskDelay(pdMS_TO_TICKS(ms));
}

/** Scan all wifi networks, check if any of them is known and try to connect to it. */
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
            size_t pass_len = sizeof(credentials->pass);
            storage_get("wifi", scanned_ssid, credentials->pass, &pass_len);
            credentials->pass[sizeof(credentials->pass) - 1] = '\0';
            snprintf(credentials->ssid, sizeof(credentials->ssid), "%s", scanned_ssid);

            // try to connect to the network
            wifi_connect(credentials->ssid, credentials->pass);

            uint32_t start = esp_log_timestamp();
            while (esp_log_timestamp() - start < WIFI_CONNECT_TIMEOUT) {
                if (wifi_connected()) {
                    free(networks);
                    return true;
                }

                delay(CHECK_CONNECTED_TIMEOUT);
            }

            ESP_LOGW(TAG, "Failed to connect to %s", credentials->ssid);

        } else {
            ESP_LOGV(TAG, "Network %s is unknown", scanned_ssid);
        }
    }
    
    free(networks);
    return false;
}

/**
 * Start BLE and serial provisioning and wait for WiFi credentials.
 * When client sends the credentials, store them and reboot the device.
 */
void configuration_loop() {
    ble_begin();
    if (!serial_provisioning_begin()) {
        ESP_LOGE(TAG, "Failed to start serial provisioning");
    }

    while (true) {
        delay(CHECK_CONNECTED_TIMEOUT);
        if (esp_log_timestamp() - ble_last_activity_ms() > PROVISIONING_TIMEOUT_MS) {
            ESP_LOGW(TAG, "Provisioning timeout, rebooting");
            esp_restart();
        }
    }
}

/**
 * Protocol loop task.
 *
 * Non-blocking recvfrom + 1 ms yield. Simple polling beats select() in
 * practice — lwIP's select() notification pipe adds more latency than it
 * saves on this hardware.
 */
void app_protocol_loop(void *param) {
    while (1) {
        protocol_loop();
        // 1 ms yield between polls. Relies on CONFIG_FREERTOS_HZ=1000 (1 tick = 1 ms).
        vTaskDelay(pdMS_TO_TICKS(1));
    }
}

/**
 * If the connection is lost, retry the current network a couple of times, 
 * then on the 3rd consecutive failure scan for every known network in storage and try each one instead. 
 * Provisioning starts only if no known network is visible at boot.
 */
void wifi_reconnect_task(void *param) {
    wifi_credentials_t *credentials = (wifi_credentials_t *)param;
    int failures = 0;

    while (1) {
        if (wifi_connected()) {
            failures = 0;
            delay(WIFI_RECONNECT_POLL_MS);
            continue;
        }

        if (++failures >= 3) {
            failures = 0;
            connect_to_known_networks(credentials);
            continue;
        }

        wifi_connect(credentials->ssid, credentials->pass);
        uint32_t t = esp_log_timestamp();
        while (!wifi_connected() && esp_log_timestamp() - t < WIFI_CONNECT_TIMEOUT)
            delay(CHECK_CONNECTED_TIMEOUT);
    }
}

/**
 * Application entry point.
 * 
 * Connect to known WiFi networks or start USB/BLE configuration if none are found.
 * If wifi is connected, start the protocol to communicate with the server.
 */
void app_main(void)
{
    storage_begin();

    config_begin();
    config_print();

    // start wifi in station mode and disable sleep
    wifi_init_sta();
    static wifi_credentials_t credentials = {0};
    if (!connect_to_known_networks(&credentials)) {
        ESP_LOGI(TAG, "No known networks found, starting provisioning");

        // stop WiFi; provisioning stores the credentials and restarts the device
        wifi_stop();
        configuration_loop();
    } else {
        ble_down();
        wifi_disable_sleep();
    }
    
    // Start application
    ESP_LOGI(TAG, "Connected to WiFi: %s", credentials.ssid);
    ESP_LOGI(TAG, "IP address: %s", wifi_ip());
    ESP_LOGI(TAG, "Hostname: %s", config.hostname);
    ESP_LOGI(TAG, "MAC address: %s", wifi_mac());

    if (!protocol_begin()) {   
        ESP_LOGE(TAG, "Failed to start protocol");
        esp_restart();
    }

    // WiFi reconnect housekeeping on core 0, with lwIP/timer tasks.
    xTaskCreatePinnedToCore(wifi_reconnect_task, "wifi_reconnect_task", 4096, &credentials, 1, NULL, 0);

    // Realtime UDP/RMT path on core 1, isolated from network housekeeping.
    xTaskCreatePinnedToCore(app_protocol_loop, "app_protocol_loop", 4096, NULL, 5, NULL, 1);

    // Delete the main task
    vTaskDelete(NULL);
}
