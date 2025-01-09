#include "storage.h"

void storage_begin()
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    if (err == ESP_ERR_INVALID_STATE) {
        ESP_LOGI("STORAGE", "NVS Flash initialized");
    } else if (err != ESP_OK) {
        ESP_LOGE("STORAGE", "Error (%s) initializing NVS Flash", esp_err_to_name(err));
    }


    ESP_LOGI("STORAGE", "Storage initialized");
}

void storage_set(const char* namespace, const char* key, const char* value)
{
    nvs_handle_t my_handle;
    ESP_ERROR_CHECK(nvs_open(namespace, NVS_READWRITE, &my_handle));
    ESP_ERROR_CHECK(nvs_set_str(my_handle, key, value));
    ESP_ERROR_CHECK(nvs_commit(my_handle));
    nvs_close(my_handle);
}

void storage_get(const char* namespace, const char* key, char* value, size_t* length)
{
    nvs_handle_t my_handle;
    ESP_ERROR_CHECK(nvs_open(namespace, NVS_READONLY, &my_handle));
    ESP_ERROR_CHECK(nvs_get_str(my_handle, key, value, length));
    nvs_close(my_handle);
}

bool storage_has_key(const char* namespace, const char* key)
{
    nvs_handle_t my_handle;
    esp_err_t ret = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (ret != ESP_OK) {
        return false;
    }

    size_t required_size = 0;
    esp_err_t err = nvs_get_str(my_handle, key, NULL, &required_size);
    nvs_close(my_handle);

    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW("STORAGE", "nvs_get_str returned %s per key '%s'", esp_err_to_name(err), key);
    }

    return (err == ESP_OK);
}

void storage_log(const char* namespace) {
    nvs_iterator_t it;
    
    esp_err_t err = nvs_entry_find("nvs", namespace, NVS_TYPE_ANY, &it);

    if (err == ESP_ERR_NVS_NOT_FOUND) {
        printf("No entries found in namespace '%s'\n", namespace);
        return;
    } else if (err != ESP_OK) {
        printf("Error in nvs_entry_find: %s\n", esp_err_to_name(err));
        return;
    }
    
    while (err == ESP_OK) {
        nvs_entry_info_t info;
        nvs_entry_info(it, &info);

        printf("Found key='%s', type=%d\n", info.key, info.type);

        if (info.type == NVS_TYPE_STR) {
            nvs_handle_t my_handle;
            if (nvs_open(namespace, NVS_READONLY, &my_handle) == ESP_OK) {
                size_t required_size = 0;
                esp_err_t err2 = nvs_get_str(my_handle, info.key, NULL, &required_size);
                if (err2 == ESP_OK && required_size > 0) {
                    char *value = malloc(required_size);
                    if (value) {
                        err2 = nvs_get_str(my_handle, info.key, value, &required_size);
                        if (err2 == ESP_OK) {
                            printf("Value for key='%s': '%s'\n", info.key, value);
                        } else {
                            printf("Error in nvs_get_str: %s\n", esp_err_to_name(err2));
                        }
                        free(value);
                    }
                }
                nvs_close(my_handle);
            }
        }
        
        err = nvs_entry_next(&it);
    }

    nvs_release_iterator(it);

    if (err != ESP_ERR_NVS_NOT_FOUND && err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Errore in nvs_entry_next: %s", esp_err_to_name(err));
    }
}