#include "ble.h"
#include "config.h"
#include "storage.h"
#include "utils.h"
#include "wifi.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_bt.h"
#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"
#include "esp_bt_main.h"

#define BLE_TAG "BLE"
#define GATTS_APP_ID 0

const uint8_t SERVICE_UUID_128[ESP_UUID_LEN_128] = {
    0xe8, 0x8f, 0xf4, 0xac, 0x7f, 0x94, 0xdc, 0x81,
    0xd7, 0x41, 0x36, 0x84, 0x56, 0x1f, 0xca, 0xa9
};

static const uint8_t CHARACTERISTIC_UUID_128[ESP_UUID_LEN_128] = {
    0x5c, 0xba, 0x85, 0x36, 0x1a, 0xb5, 0xd3, 0xa4,
    0x0c, 0x45, 0x61, 0x2f, 0x20, 0x5e, 0x4c, 0x47
};

static uint16_t gatt_service_handle = 0;
static uint16_t gatt_char_handle = 0;

static esp_ble_adv_params_t adv_params = {
    .adv_int_min       = 0x20,
    .adv_int_max       = 0x40,
    .adv_type          = ADV_TYPE_IND,
    .own_addr_type     = BLE_ADDR_TYPE_PUBLIC,
    .channel_map       = ADV_CHNL_ALL,
    .adv_filter_policy = ADV_FILTER_ALLOW_SCAN_ANY_CON_ANY,
};

static uint32_t s_last_activity_ms = 0;

uint32_t ble_last_activity_ms()
{
    return s_last_activity_ms;
}

static void ble_mark_activity()
{
    s_last_activity_ms = esp_log_timestamp();
}

// when the client sends the credentials, store them and restart the device
// TODO: Could be a problem if the client sends too many credentials - maybe invalid - and occupies unnecessary memory
void store_credentials(uint8_t *value, size_t len)
{
    const char *separator = (const char *)memchr(value, ',', len);

    if (separator == NULL) {
        ESP_LOGW(BLE_TAG, "Invalid credentials format: separator ',' not found.");
        return;
    }

    size_t ssid_len = separator - (const char *)value;
    size_t pass_len = len - (ssid_len + 1);
    if (ssid_len == 0 || pass_len == 0 || ssid_len >= WIFI_SSID_MAX_LEN || pass_len >= WIFI_PASS_MAX_LEN) {
        ESP_LOGW(BLE_TAG, "Invalid credentials length: ssid_len=%d, pass_len=%d", ssid_len, pass_len);
        return;
    }

    char ssid[WIFI_SSID_MAX_LEN];
    char password[WIFI_PASS_MAX_LEN];

    strncpy(ssid, (const char *)value, ssid_len);
    ssid[ssid_len] = '\0';

    strncpy(password, separator + 1, pass_len);
    password[pass_len] = '\0';

    ESP_LOGI(BLE_TAG, "Received credentials: SSID='%s', PWD='%s'", ssid, mask_wifi_password(password));
    storage_set("wifi", ssid, password);
}

static void restart_timer_callback(TimerHandle_t xTimer)
{
    ESP_LOGI(BLE_TAG, "Restarting now...");
    esp_restart();
}

void gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t *param){
    switch (event) {
    case ESP_GATTS_CONNECT_EVT:
        ESP_LOGV(BLE_TAG, "Connected, conn_id %d", param->connect.conn_id);
        ble_mark_activity();
        break;
    case ESP_GATTS_REG_EVT: 
        ESP_LOGV(BLE_TAG, "Registered, status %d, app_id %d", param->reg.status, param->reg.app_id);
        esp_gatt_srvc_id_t srvc_id;
        srvc_id.is_primary = true;
        srvc_id.id.inst_id = 0;
        srvc_id.id.uuid.len = ESP_UUID_LEN_128;
        memcpy(srvc_id.id.uuid.uuid.uuid128, SERVICE_UUID_128, ESP_UUID_LEN_128);
        esp_ble_gatts_create_service(gatts_if, &srvc_id, 10);
        break;
    case ESP_GATTS_CREATE_EVT:
        ESP_LOGV(BLE_TAG, "Service created, handle %d", param->create.service_handle);
        gatt_service_handle = param->create.service_handle;
        esp_ble_gatts_start_service(gatt_service_handle);

        esp_bt_uuid_t char_uuid;
        char_uuid.len = ESP_UUID_LEN_128;
        memcpy(char_uuid.uuid.uuid128, CHARACTERISTIC_UUID_128, ESP_UUID_LEN_128);

        esp_gatt_char_prop_t property = ESP_GATT_CHAR_PROP_BIT_WRITE | ESP_GATT_CHAR_PROP_BIT_READ | ESP_GATT_CHAR_PROP_BIT_NOTIFY;
        esp_err_t add_char_ret = esp_ble_gatts_add_char(
            gatt_service_handle, &char_uuid,
            ESP_GATT_PERM_WRITE, property, NULL, NULL
        );
        if (add_char_ret != ESP_OK) {
            ESP_LOGE(BLE_TAG, "Characteristic creation error: %s", esp_err_to_name(add_char_ret));
        }
        break;
    case ESP_GATTS_ADD_CHAR_EVT:
        ESP_LOGV(BLE_TAG, "Characteristic added, handle %d", param->add_char.attr_handle);
        gatt_char_handle = param->add_char.attr_handle;
        break;
    case ESP_GATTS_WRITE_EVT: 
        ESP_LOGV(BLE_TAG, "Write received, conn_id %u, trans_id %u, handle %u",
                (unsigned int)param->write.conn_id,
                (unsigned int)param->write.trans_id,
                (unsigned int)param->write.handle);
        ble_mark_activity();

        if (param->write.need_rsp) {
            esp_gatt_rsp_t rsp = {0}; 
            rsp.attr_value.handle = param->write.handle;
            rsp.attr_value.len = param->write.len;
            memcpy(rsp.attr_value.value, param->write.value, param->write.len);

            esp_err_t err = esp_ble_gatts_send_response(gatts_if, param->write.conn_id,
                                                        param->write.trans_id, ESP_GATT_OK, &rsp);

            if (err != ESP_OK) {
                ESP_LOGE(BLE_TAG, "Failed to send response: %s", esp_err_to_name(err));
            } else {
                ESP_LOGV(BLE_TAG, "Response sent");
            }
        }
        
        if (param->write.handle == gatt_char_handle && param->write.len > 0) {
            store_credentials(param->write.value, param->write.len);

            ESP_LOGV(BLE_TAG, "Credentials stored, restarting...");
            TimerHandle_t restart_timer = xTimerCreate("RestartTimer",
                pdMS_TO_TICKS(2000),
                pdFALSE,      // one-shot
                NULL,
                restart_timer_callback);

            if (restart_timer != NULL) {
                xTimerStart(restart_timer, 0);
            } else {
                ESP_LOGE(BLE_TAG, "Failed to create restart timer");
            }
        }
        break;
    case ESP_GATTS_DISCONNECT_EVT:
        ESP_LOGV(BLE_TAG, "Client disconnected, restarting advertising");
        esp_ble_gap_start_advertising(&adv_params);
        break;
    default:
        break;
    }
}

void gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param)
{
    switch (event) {
    case ESP_GAP_BLE_ADV_DATA_SET_COMPLETE_EVT:
        ESP_LOGV(BLE_TAG, "Advertising data set");
        esp_ble_gap_start_advertising(&adv_params);
        break;
    case ESP_GAP_BLE_ADV_START_COMPLETE_EVT:
        if (param->adv_start_cmpl.status == ESP_BT_STATUS_SUCCESS) {
            ESP_LOGV(BLE_TAG, "Advertising started");
        } else {
            ESP_LOGE(BLE_TAG, "Advertising start error: %d", param->adv_start_cmpl.status);
        }
        break;
    default:
        break;
    }
}

// Start the BLE service
// This function is called from the main application loop to retrieve the wifi credentials from the client.
// When the client sends the credentials, they are stored and the device is rebooted.
void ble_begin()
{
    ESP_LOGI(BLE_TAG, "BLE initialization");
    ble_mark_activity();

    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    
    esp_err_t ret = esp_bt_controller_init(&bt_cfg);
    if (ret) {
        ESP_LOGE(BLE_TAG, "Controller init failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bt_controller_enable(ESP_BT_MODE_BLE);
    if (ret) {
        ESP_LOGE(BLE_TAG, "Controller enable failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bluedroid_init();
    if (ret) {
        ESP_LOGE(BLE_TAG, "Bluedroid init failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bluedroid_enable();
    if (ret) {
        ESP_LOGE(BLE_TAG, "Bluedroid enable failed: %s", esp_err_to_name(ret));
        return;
    }

    esp_ble_gatts_register_callback(gatts_event_handler);
    esp_ble_gap_register_callback(gap_event_handler);
    esp_ble_gatts_app_register(GATTS_APP_ID);

    esp_ble_gap_set_device_name(config.hostname);
    static esp_ble_adv_data_t adv_data = {
        .set_scan_rsp = false,
        .include_name = false,
        .include_txpower = false,
        .min_interval        = 0x20,
        .max_interval        = 0x40,
        .appearance          = 0,
        .manufacturer_len    = 0,
        .p_manufacturer_data = NULL,
        .service_data_len    = 0,
        .p_service_data      = NULL,
        .service_uuid_len    = ESP_UUID_LEN_128,
        .p_service_uuid      = (uint8_t *)SERVICE_UUID_128,
        .flag                = (ESP_BLE_ADV_FLAG_GEN_DISC | ESP_BLE_ADV_FLAG_BREDR_NOT_SPT),
    };
    
    static esp_ble_adv_data_t scan_rsp_data = {
        .set_scan_rsp = true,       
        .include_name = true,       
        .include_txpower = true,
        .appearance = 0,
    };

    ESP_ERROR_CHECK(esp_ble_gap_config_adv_data(&adv_data));
    ESP_ERROR_CHECK(esp_ble_gap_config_adv_data(&scan_rsp_data));

    ESP_LOGI(BLE_TAG, "BLE ready");
}

// Disable bluetooth if not needed
// This function is called when the device is connected to a wifi network
void ble_down() {
    esp_bt_controller_disable();
    esp_bt_controller_deinit();
    esp_bt_controller_mem_release(ESP_BT_MODE_BLE);
}
