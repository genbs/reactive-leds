#ifndef BLE_H
#define BLE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"

#include "esp_system.h"
#include "esp_log.h"
#include "esp_err.h"
#include "nvs.h"
#include "nvs_flash.h"

#include "esp_bt.h"
#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"
#include "esp_bt_main.h"
#include "esp_gatt_common_api.h"

#include "storage.h"
#include "config.h"

#define BLE_TAG "BLE"

#define GATTS_APP_ID 0

static const uint8_t SERVICE_UUID_128[ESP_UUID_LEN_128] = {
    0xe8, 0x8f, 0xf4, 0xac,
    0x7f, 0x94, 0xdc, 0x81,
    0xd7, 0x41, 0x36, 0x84,
    0x56, 0x1f, 0xca, 0xa9
};

void ble_begin();
void ble_down();

#endif