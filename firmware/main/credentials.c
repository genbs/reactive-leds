#include "credentials.h"
#include "storage.h"
#include "utils.h"
#include "wifi.h"

#include <string.h>
#include "esp_log.h"

#define CREDENTIALS_TAG "CREDENTIALS"

bool credentials_store(const uint8_t *value, size_t len)
{
    if (len < 2) {
        ESP_LOGW(CREDENTIALS_TAG, "Credentials payload too short");
        return false;
    }

    size_t ssid_len = value[0];
    size_t pass_len = value[1];
    if (ssid_len == 0 || ssid_len >= WIFI_SSID_MAX_LEN || pass_len >= WIFI_PASS_MAX_LEN || len != 2 + ssid_len + pass_len) {
        ESP_LOGW(CREDENTIALS_TAG, "Invalid credentials length: ssid_len=%d, pass_len=%d", ssid_len, pass_len);
        return false;
    }

    const uint8_t *ssid_value = value + 2;
    const uint8_t *pass_value = ssid_value + ssid_len;
    if (memchr(ssid_value, '\0', ssid_len) || memchr(pass_value, '\0', pass_len)) {
        ESP_LOGW(CREDENTIALS_TAG, "Credentials contain a null byte");
        return false;
    }

    char ssid[WIFI_SSID_MAX_LEN];
    char password[WIFI_PASS_MAX_LEN];
    memcpy(ssid, ssid_value, ssid_len);
    memcpy(password, pass_value, pass_len);
    ssid[ssid_len] = '\0';
    password[pass_len] = '\0';

    ESP_LOGI(CREDENTIALS_TAG, "Received credentials: SSID='%s', PWD='%s'", ssid, mask_wifi_password(password));
    return storage_set("wifi", ssid, password) == ESP_OK;
}
