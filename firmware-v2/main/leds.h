#ifndef LEDS_H
#define LEDS_H

#include <stdint.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_err.h"
#include "esp_check.h"  
#include "esp_log.h"
#include "driver/rmt_tx.h"
#include "driver/rmt_encoder.h"

#include "config.h"

#define LEDS_TAG "LEDS_SERVICE"

#define RMT_TX_CHANNEL    0        // RMT channel for TX
#define RMT_CLK_DIV       2        // Clock divider for RMT
#define RMT_RESOLUTION_HZ 10000000 // 10MHz resolution, 1 tick = 0.1us (led strip needs a high resolution)

#define RMT_IDLE_LEVEL_LOW  0
#define RMT_IDLE_LEVEL_HIGH 1

typedef struct {
    rmt_encoder_t base;
    rmt_encoder_t *bytes_encoder;
    rmt_encoder_t *copy_encoder;
    int state;
    rmt_symbol_word_t reset_code;
} rmt_led_strip_encoder_t;

typedef struct {
    uint32_t resolution; /*!< Encoder resolution, in Hz */
} led_strip_encoder_config_t;

esp_err_t rmt_new_led_strip_encoder(const led_strip_encoder_config_t *config, rmt_encoder_handle_t *ret_encoder);

void leds_begin();
void leds_update(uint8_t pixel_index, uint8_t r, uint8_t g, uint8_t b, uint8_t w);
void leds_clear();
void leds_show();

#endif