#ifndef BLE_H
#define BLE_H

#include <stdint.h>
#include "esp_bt_defs.h"

extern const uint8_t SERVICE_UUID_128[ESP_UUID_LEN_128];

void ble_begin();
void ble_down();
uint32_t ble_last_activity_ms();

#endif // BLE_H
