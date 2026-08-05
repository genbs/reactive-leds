#include "serial_provisioning.h"
#include "credentials.h"
#include "wifi.h"

#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>
#include "esp_log.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define SERIAL_TAG "SERIAL_PROVISIONING"
#define SERIAL_TASK_STACK_SIZE 3072

static const uint8_t s_magic[] = {'R', 'L', 'E', 'D', 'S'};
static uint8_t s_frame[sizeof(s_magic) + 2 + WIFI_SSID_MAX_LEN - 1 + WIFI_PASS_MAX_LEN - 1];
static size_t s_frame_len = 0;
static size_t s_expected_len = 0;

static void reset_frame()
{
    s_frame_len = 0;
    s_expected_len = 0;
}

static bool consume_byte(uint8_t value)
{
    if (s_frame_len < sizeof(s_magic)) {
        if (value == s_magic[s_frame_len]) {
            s_frame[s_frame_len++] = value;
        } else {
            reset_frame();
            if (value == s_magic[0]) s_frame[s_frame_len++] = value;
        }
        return false;
    }

    s_frame[s_frame_len++] = value;
    if (s_frame_len == sizeof(s_magic) + 2) {
        size_t ssid_len = s_frame[sizeof(s_magic)];
        size_t pass_len = s_frame[sizeof(s_magic) + 1];
        s_expected_len = sizeof(s_magic) + 2 + ssid_len + pass_len;
        if (ssid_len == 0 || ssid_len >= WIFI_SSID_MAX_LEN || pass_len >= WIFI_PASS_MAX_LEN || s_expected_len > sizeof(s_frame)) {
            printf("RLEDS:ERROR\n");
            fflush(stdout);
            reset_frame();
            return false;
        }
    }

    if (!s_expected_len || s_frame_len < s_expected_len) return false;

    bool stored = credentials_store(s_frame + sizeof(s_magic), s_frame_len - sizeof(s_magic));
    printf(stored ? "RLEDS:OK\n" : "RLEDS:ERROR\n");
    fflush(stdout);
    reset_frame();
    return stored;
}

static void serial_provisioning_task(void *param)
{
    ESP_LOGI(SERIAL_TAG, "Waiting for USB/serial credentials");
    uint8_t value;
    while (true) {
        if (read(STDIN_FILENO, &value, 1) == 1) {
            if (consume_byte(value)) {
                vTaskDelay(pdMS_TO_TICKS(500));
                esp_restart();
            }
            continue;
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

bool serial_provisioning_begin()
{
    return xTaskCreate(serial_provisioning_task, "serial_provisioning", SERIAL_TASK_STACK_SIZE, NULL, 1, NULL) == pdPASS;
}
