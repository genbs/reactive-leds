#include "storage.h"

#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "nvs_flash.h"
#include "esp_log.h"
#include "nvs.h"

#define STORAGE_TAG "STORAGE_SERVICE"

/**
 * Truncate the key to fit the maximum NVS key length.
 */
static void get_truncated_key(char* dest, const char* src) {
    strncpy(dest, src, NVS_KEY_NAME_MAX_SIZE - 1);
    dest[NVS_KEY_NAME_MAX_SIZE - 1] = '\0';
}

static bool is_key_long(const char* key) {
    return strlen(key) > (NVS_KEY_NAME_MAX_SIZE - 1);
}

static uint32_t fnv1a_hash32(const char* data) {
    uint32_t hash = 2166136261u;
    for (const unsigned char* p = (const unsigned char*)data; *p != '\0'; ++p) {
        hash ^= (uint32_t)(*p);
        hash *= 16777619u;
    }
    return hash;
}

static void get_hashed_key(char* dest, const char* src) {
    uint32_t hash = fnv1a_hash32(src);
    snprintf(dest, NVS_KEY_NAME_MAX_SIZE, "h_%08x", (unsigned)hash);
}

/**
 * Initialize the NVS storage.
 */
void storage_begin()
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(STORAGE_TAG, "NVS partition contains errors. Erasing and re-initializing.");
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err); 
    ESP_LOGI(STORAGE_TAG, "Storage initialized successfully.");
}

/**
 * Set a value in the NVS storage.
 * The value is truncated to fit the maximum key length.
 */
esp_err_t storage_set(const char* namespace, const char* key, const char* value)
{
    nvs_handle_t my_handle;
    esp_err_t err;

    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    get_truncated_key(truncated_key, key);
    char hashed_key[NVS_KEY_NAME_MAX_SIZE];
    const char* final_key = truncated_key;
    if (is_key_long(key)) {
        get_hashed_key(hashed_key, key);
        final_key = hashed_key;
    }

    err = nvs_open(namespace, NVS_READWRITE, &my_handle);
    if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Failed to open NVS namespace '%s': %s", namespace, esp_err_to_name(err));
        return err;
    }

    err = nvs_set_str(my_handle, final_key, value);
    if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Failed to set key '%s': %s", key, esp_err_to_name(err));
    } else {
        err = nvs_commit(my_handle);
        if (err != ESP_OK) {
            ESP_LOGE(STORAGE_TAG, "Failed to commit NVS: %s", esp_err_to_name(err));
        }
    }

    nvs_close(my_handle);
    return err;
}

/**
 * Get a value from the NVS storage.
 * The value is stored in the provided buffer, which must be large enough.
 */
esp_err_t storage_get(const char* namespace, const char* key, char* value, size_t* length)
{
    nvs_handle_t my_handle;
    esp_err_t err;

    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    get_truncated_key(truncated_key, key);
    char hashed_key[NVS_KEY_NAME_MAX_SIZE];
    bool long_key = is_key_long(key);
    if (long_key) {
        get_hashed_key(hashed_key, key);
    }

    err = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Failed to open NVS namespace '%s': %s", namespace, esp_err_to_name(err));
        return err;
    }

    if (long_key) {
        err = nvs_get_str(my_handle, hashed_key, value, length);
        if (err == ESP_ERR_NVS_NOT_FOUND) {
            err = nvs_get_str(my_handle, truncated_key, value, length);
        }
    } else {
        err = nvs_get_str(my_handle, truncated_key, value, length);
    }

    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(STORAGE_TAG, "Failed to get key '%s': %s", key, esp_err_to_name(err));
    }
    
    nvs_close(my_handle);
    return err;
}

/**
 * Check if a key exists in the NVS storage.
 */
bool storage_has_key(const char* namespace, const char* key)
{
    nvs_handle_t my_handle;
    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    get_truncated_key(truncated_key, key);
    char hashed_key[NVS_KEY_NAME_MAX_SIZE];
    bool long_key = is_key_long(key);
    if (long_key) {
        get_hashed_key(hashed_key, key);
    }

    esp_err_t err = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (err != ESP_OK) {
        return false;
    }

    size_t required_size = 0;
    if (long_key) {
        err = nvs_get_str(my_handle, hashed_key, NULL, &required_size);
        if (err == ESP_ERR_NVS_NOT_FOUND) {
            err = nvs_get_str(my_handle, truncated_key, NULL, &required_size);
        }
    } else {
        err = nvs_get_str(my_handle, truncated_key, NULL, &required_size);
    }
    nvs_close(my_handle);

    return (err == ESP_OK);
}

/**
 * Deletes a key-value pair from the NVS storage.
 */
esp_err_t storage_delete(const char* namespace, const char* key)
{
    nvs_handle_t my_handle;
    esp_err_t err;

    err = nvs_open(namespace, NVS_READWRITE, &my_handle);
    if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Failed to open NVS namespace '%s': %s", namespace, esp_err_to_name(err));
        return err;
    }

    if (key != NULL) {
        ESP_LOGI(STORAGE_TAG, "Erasing key '%s' from namespace '%s'...", key, namespace);

        char truncated_key[NVS_KEY_NAME_MAX_SIZE];
        get_truncated_key(truncated_key, key);
        char hashed_key[NVS_KEY_NAME_MAX_SIZE];
        bool long_key = is_key_long(key);
        bool deleted = false;

        if (long_key) {
            get_hashed_key(hashed_key, key);
            err = nvs_erase_key(my_handle, hashed_key);
            if (err == ESP_OK) {
                deleted = true;
            } else if (err != ESP_ERR_NVS_NOT_FOUND) {
                ESP_LOGE(STORAGE_TAG, "Erase operation failed: %s", esp_err_to_name(err));
                nvs_close(my_handle);
                return err;
            }
        }

        err = nvs_erase_key(my_handle, truncated_key);
        if (err == ESP_OK) {
            deleted = true;
        } else if (err != ESP_ERR_NVS_NOT_FOUND) {
            ESP_LOGE(STORAGE_TAG, "Erase operation failed: %s", esp_err_to_name(err));
            nvs_close(my_handle);
            return err;
        }

        if (!deleted) {
            err = ESP_ERR_NVS_NOT_FOUND;
        } else {
            err = ESP_OK;
        }
    } else {
        ESP_LOGI(STORAGE_TAG, "Erasing all keys from namespace '%s'...", namespace);
        err = nvs_erase_all(my_handle);
    }

    if (err == ESP_OK) {
        err = nvs_commit(my_handle);
        if (err != ESP_OK) {
             ESP_LOGE(STORAGE_TAG, "NVS commit failed: %s", esp_err_to_name(err));
        }
    } else if (err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGE(STORAGE_TAG, "Erase operation failed: %s", esp_err_to_name(err));
    }
    
    nvs_close(my_handle);
    return err;
}

/**
 * Printf a list of all keys in a given namespace.
 * Useful for debugging and checking stored values.
 */
void storage_log(const char* partition_name, const char* namespace) 
{
    ESP_LOGI(STORAGE_TAG, "--- Listing NVS keys for partition '%s', namespace '%s' ---", partition_name, namespace);

    nvs_iterator_t it;
    esp_err_t err = nvs_entry_find(partition_name, namespace, NVS_TYPE_ANY, &it);
    if (err != ESP_OK) {
        ESP_LOGI(STORAGE_TAG, "nvs_entry_find failed: %s", esp_err_to_name(err));
        return;
    }

    nvs_handle_t my_handle;
    err = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Failed to open namespace '%s': %s", namespace, esp_err_to_name(err));
        nvs_release_iterator(it); 
        return;
    }

    do {
        nvs_entry_info_t info;
        nvs_entry_info(it, &info);
        
        if (info.type == NVS_TYPE_STR) {
            size_t len;
            // Log only length to avoid leaking sensitive values
            if (nvs_get_str(my_handle, info.key, NULL, &len) == ESP_OK) {
                ESP_LOGI(STORAGE_TAG, "Key: '%s', Type: STR, Len: %u", info.key, (unsigned)len);
            }
        } else {
            ESP_LOGI(STORAGE_TAG, "Key: '%s', Type: 0x%02X", info.key, info.type);
        }
    } while (nvs_entry_next(&it));

    nvs_close(my_handle);
    nvs_release_iterator(it);
    ESP_LOGI(STORAGE_TAG, "--- End of NVS list ---");
}
