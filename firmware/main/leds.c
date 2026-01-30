#include "leds.h"
#include "config.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_check.h"
#include "esp_log.h"
#include "driver/rmt_tx.h"
#include "driver/rmt_encoder.h"
#include <string.h>

#define LEDS_TAG "LEDS_SERVICE"
#define RMT_RESOLUTION_HZ 10000000 // 10MHz
#define TRANSFER_QUEUE_DEPTH 4
#define MEM_BLOCK_SYMBOLS 64

static size_t rmt_encode_led_strip(rmt_encoder_t *encoder, rmt_channel_handle_t channel, const void *primary_data, size_t data_size, rmt_encode_state_t *ret_state);
static esp_err_t rmt_del_led_strip_encoder(rmt_encoder_t *encoder);
static esp_err_t rmt_led_strip_encoder_reset(rmt_encoder_t *encoder);
esp_err_t rmt_new_led_strip_encoder(rmt_encoder_handle_t *ret_encoder); 

static uint8_t* s_led_buffer = NULL;
static rmt_channel_handle_t s_led_chan = NULL;
static rmt_encoder_handle_t s_led_encoder = NULL;
static rmt_transmit_config_t s_tx_config = {
    .loop_count = 0, //  no transfer loop
};


bool leds_begin()
{
    ESP_LOGI(LEDS_TAG, "Initializing RMT for LED strip");

    // Buffer initialization
    size_t buffer_size = config.num_leds * 4;
    s_led_buffer = malloc(buffer_size);
    if (!s_led_buffer) {
        ESP_LOGE(LEDS_TAG, "Failed to allocate memory for LED buffer");
        return false;
    }
    memset(s_led_buffer, 0, buffer_size);

    
    // Configure RMT (credits: https://github.com/espressif/esp-idf/blob/master/examples/peripherals/rmt/led_strip/main/led_strip_example_main.c)
    ESP_LOGV(LEDS_TAG, "Create RMT TX channel");
    rmt_tx_channel_config_t tx_chan_config = {
        .clk_src = RMT_CLK_SRC_DEFAULT,
        .gpio_num = config.pin,
        .mem_block_symbols = MEM_BLOCK_SYMBOLS,
        .resolution_hz = RMT_RESOLUTION_HZ,
        .trans_queue_depth = TRANSFER_QUEUE_DEPTH, 
    };

    ESP_ERROR_CHECK(rmt_new_tx_channel(&tx_chan_config, &s_led_chan));
    ESP_ERROR_CHECK(rmt_new_led_strip_encoder(&s_led_encoder));
    ESP_ERROR_CHECK(rmt_enable(s_led_chan));

    ESP_LOGI(LEDS_TAG, "LEDs driver installed successfully");
    return true;
}

void leds_end()
{
    if (s_led_chan) rmt_disable(s_led_chan);
    if (s_led_encoder) rmt_del_encoder(s_led_encoder);
    if (s_led_chan) rmt_del_channel(s_led_chan);
    if (s_led_buffer) free(s_led_buffer);
    
    s_led_chan = NULL;
    s_led_encoder = NULL;
    s_led_buffer = NULL;
    ESP_LOGI(LEDS_TAG, "LEDs driver de-initialized.");
}

void leds_update(uint8_t pixel_index, uint8_t r, uint8_t g, uint8_t b, uint8_t w)
{
    if (!s_led_buffer || pixel_index >= config.num_leds) {
        return;
    }

    // TODO: the order of colors might be different depending on the type of LED
    size_t index = pixel_index * 4;
    s_led_buffer[index] = w;
    s_led_buffer[index + 1] = r; 
    s_led_buffer[index + 2] = g; 
    s_led_buffer[index + 3] = b; 
}

void leds_clear()
{
    if (s_led_buffer) {
        memset(s_led_buffer, 0, config.num_leds * 4);
    }
}

void leds_show()
{
    if (!s_led_chan || !s_led_encoder || !s_led_buffer) {
        return;
    }

    ESP_ERROR_CHECK(rmt_transmit(s_led_chan, s_led_encoder, s_led_buffer, config.num_leds * 4, &s_tx_config));
    ESP_ERROR_CHECK(rmt_tx_wait_all_done(s_led_chan, portMAX_DELAY));
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Encoding functions 
// credits: https://github.com/espressif/esp-idf/tree/master/examples/peripherals/rmt/led_strip/main
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

typedef struct {
    rmt_encoder_t base;
    rmt_encoder_t *bytes_encoder;
    rmt_encoder_t *copy_encoder;
    int state;
    rmt_symbol_word_t reset_code;
} rmt_led_strip_encoder_t;


static size_t rmt_encode_led_strip(rmt_encoder_t *encoder, rmt_channel_handle_t channel, const void *primary_data, size_t data_size, rmt_encode_state_t *ret_state)
{
    rmt_led_strip_encoder_t *led_encoder = __containerof(encoder, rmt_led_strip_encoder_t, base);
    rmt_encoder_handle_t bytes_encoder = led_encoder->bytes_encoder;
    rmt_encoder_handle_t copy_encoder = led_encoder->copy_encoder;
    rmt_encode_state_t session_state = RMT_ENCODING_RESET;
    rmt_encode_state_t state = RMT_ENCODING_RESET;
    size_t encoded_symbols = 0;
    switch (led_encoder->state) {
    case 0: // send RGB data
        encoded_symbols += bytes_encoder->encode(bytes_encoder, channel, primary_data, data_size, &session_state);
        if (session_state & RMT_ENCODING_COMPLETE) {
            led_encoder->state = 1; // switch to next state when current encoding session finished
        }
        if (session_state & RMT_ENCODING_MEM_FULL) {
            state |= RMT_ENCODING_MEM_FULL;
            goto out; // yield if there's no free space for encoding artifacts
        }
    // fall-through
    case 1: // send reset code 
        encoded_symbols += copy_encoder->encode(copy_encoder, channel, &led_encoder->reset_code,
                                                sizeof(led_encoder->reset_code), &session_state);
        if (session_state & RMT_ENCODING_COMPLETE) {
            led_encoder->state = RMT_ENCODING_RESET; // back to the initial encoding session
            state |= RMT_ENCODING_COMPLETE;
        }
        if (session_state & RMT_ENCODING_MEM_FULL) {
            state |= RMT_ENCODING_MEM_FULL;
            goto out; // yield if there's no free space for encoding artifacts
        }
    }
out:
    *ret_state = state;
    return encoded_symbols;
}

static esp_err_t rmt_del_led_strip_encoder(rmt_encoder_t *encoder)
{
    rmt_led_strip_encoder_t *led_encoder = __containerof(encoder, rmt_led_strip_encoder_t, base);
    rmt_del_encoder(led_encoder->bytes_encoder);
    rmt_del_encoder(led_encoder->copy_encoder);
    free(led_encoder);
    return ESP_OK;
}

static esp_err_t rmt_led_strip_encoder_reset(rmt_encoder_t *encoder)
{
    rmt_led_strip_encoder_t *led_encoder = __containerof(encoder, rmt_led_strip_encoder_t, base);
    rmt_encoder_reset(led_encoder->bytes_encoder);
    rmt_encoder_reset(led_encoder->copy_encoder);
    led_encoder->state = RMT_ENCODING_RESET;
    return ESP_OK;
}

esp_err_t rmt_new_led_strip_encoder(rmt_encoder_handle_t *ret_encoder)
{
    esp_err_t ret = ESP_OK;
    rmt_led_strip_encoder_t *led_encoder = NULL;
    ESP_GOTO_ON_FALSE(ret_encoder, ESP_ERR_INVALID_ARG, err, LEDS_TAG, "invalid argument");

    led_encoder = rmt_alloc_encoder_mem(sizeof(rmt_led_strip_encoder_t));
    ESP_GOTO_ON_FALSE(led_encoder, ESP_ERR_NO_MEM, err, LEDS_TAG, "no mem for led strip encoder");
    
    led_encoder->base.encode = rmt_encode_led_strip;
    led_encoder->base.del = rmt_del_led_strip_encoder;
    led_encoder->base.reset = rmt_led_strip_encoder_reset;
    
    // different led strip might have its own timing requirements, following parameter is for WS2812
    rmt_bytes_encoder_config_t bytes_encoder_config = {
        .bit0 = {
            .level0 = 1, .duration0 = 0.3 * RMT_RESOLUTION_HZ / 1000000, // T0H
            .level1 = 0, .duration1 = 0.9 * RMT_RESOLUTION_HZ / 1000000, // T0L
        },
        .bit1 = {
            .level0 = 1, .duration0 = 0.9 * RMT_RESOLUTION_HZ / 1000000, // T1H
            .level1 = 0, .duration1 = 0.3 * RMT_RESOLUTION_HZ / 1000000, // T1L
        },
        .flags.msb_first = 1
    };
    ESP_GOTO_ON_ERROR(rmt_new_bytes_encoder(&bytes_encoder_config, &led_encoder->bytes_encoder), err, LEDS_TAG, "create bytes encoder failed");
    
    rmt_copy_encoder_config_t copy_encoder_config = {};
    ESP_GOTO_ON_ERROR(rmt_new_copy_encoder(&copy_encoder_config, &led_encoder->copy_encoder), err, LEDS_TAG, "create copy encoder failed");

    uint32_t reset_ticks = RMT_RESOLUTION_HZ / 1000000 * 50 / 2;
    led_encoder->reset_code = (rmt_symbol_word_t) {
        .level0 = 0, .duration0 = reset_ticks,
        .level1 = 0, .duration1 = reset_ticks,
    };

    *ret_encoder = &led_encoder->base;
    return ESP_OK;

err:
    if (led_encoder) {
        if (led_encoder->bytes_encoder) {
            rmt_del_encoder(led_encoder->bytes_encoder);
        }
        if (led_encoder->copy_encoder) {
            rmt_del_encoder(led_encoder->copy_encoder);
        }
        free(led_encoder);
    }
    return ret;
}
