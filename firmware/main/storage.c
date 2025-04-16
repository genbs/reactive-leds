// Storage management functions
// use NVS to store key-value pairs
// it's used to store device configuration and wifi credentials for known networks
#include "storage.h"

// Initialize NVS Flash
void storage_begin()
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGI(STORAGE_TAG, "Erasing NVS flash due to no free pages/new version found");
        err = nvs_flash_erase();

        if (err != ESP_OK) {
            ESP_LOGE(STORAGE_TAG, "Error erasing NVS flash: %s", esp_err_to_name(err));
            return;
        }

        err = nvs_flash_init();
    }
    
    if (err == ESP_ERR_INVALID_STATE) {
        ESP_LOGI(STORAGE_TAG, "NVS flash already initialized");
    } else if (err != ESP_OK) {
        ESP_LOGE(STORAGE_TAG, "Error initializing NVS flash: %s", esp_err_to_name(err));
        return;
    }
    
    ESP_LOGI(STORAGE_TAG, "Storage initialized");
}

// Set a key-value pair in the NVS Flash
void storage_set(const char* namespace, const char* key, const char* value)
{
    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    strncpy(truncated_key, key, NVS_KEY_NAME_MAX_SIZE - 1);
    truncated_key[NVS_KEY_NAME_MAX_SIZE - 1] = '\0';

    nvs_handle_t my_handle;
    ESP_ERROR_CHECK(nvs_open(namespace, NVS_READWRITE, &my_handle));
    ESP_ERROR_CHECK(nvs_set_str(my_handle, truncated_key, value));
    ESP_ERROR_CHECK(nvs_commit(my_handle));
    nvs_close(my_handle);
}

// Get a value from the NVS Flash
void storage_get(const char* namespace, const char* key, char* value, size_t* length)
{
    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    strncpy(truncated_key, key, NVS_KEY_NAME_MAX_SIZE - 1);
    truncated_key[NVS_KEY_NAME_MAX_SIZE - 1] = '\0';

    nvs_handle_t my_handle;
    ESP_ERROR_CHECK(nvs_open(namespace, NVS_READONLY, &my_handle));
    ESP_ERROR_CHECK(nvs_get_str(my_handle, truncated_key, value, length));
    nvs_close(my_handle);
}

// Check if a key exists in the NVS Flash
bool storage_has_key(const char* namespace, const char* key)
{
    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    strncpy(truncated_key, key, NVS_KEY_NAME_MAX_SIZE - 1);
    truncated_key[NVS_KEY_NAME_MAX_SIZE - 1] = '\0';

    nvs_handle_t my_handle;
    esp_err_t ret = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (ret != ESP_OK) {
        return false;
    }

    size_t required_size = 0;
    esp_err_t err = nvs_get_str(my_handle, truncated_key, NULL, &required_size);
    nvs_close(my_handle);

    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(STORAGE_TAG, "nvs_get_str returned %s per key '%s'", esp_err_to_name(err), key);
    }

    return (err == ESP_OK);
}

// Delete a key-value pair from the NVS Flash
void storage_delete(const char* namespace, const char* key)
{
    char truncated_key[NVS_KEY_NAME_MAX_SIZE];
    strncpy(truncated_key, key, NVS_KEY_NAME_MAX_SIZE - 1);
    truncated_key[NVS_KEY_NAME_MAX_SIZE - 1] = '\0';

    nvs_handle_t my_handle;
    ESP_ERROR_CHECK(nvs_open(namespace, NVS_READWRITE, &my_handle));
    ESP_ERROR_CHECK(nvs_erase_key(my_handle, truncated_key));
    ESP_ERROR_CHECK(nvs_commit(my_handle));
    nvs_close(my_handle);
}

// Utility functions, print all key-value pairs in the NVS Flash
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

    nvs_handle_t my_handle;
    err = nvs_open(namespace, NVS_READONLY, &my_handle);
    if (err != ESP_OK) {
        printf("Error opening namespace '%s': %s\n", namespace, esp_err_to_name(err));
        nvs_release_iterator(it);
        return;
    }

    while (true) {
        nvs_entry_info_t info;
        nvs_entry_info(it, &info);
        printf("Found key='%s', type=%d\n", info.key, info.type);

        if (info.type == NVS_TYPE_STR) {
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
                } else {
                    printf("Memory allocation error for key='%s'\n", info.key);
                }
            } else if (err2 != ESP_ERR_NVS_NOT_FOUND) {
                printf("Error getting size for key='%s': %s\n", info.key, esp_err_to_name(err2));
            }
        }

        err = nvs_entry_next(&it);
        if (err == ESP_ERR_NVS_NOT_FOUND) {
            break;
        } else if (err != ESP_OK) {
            printf("Error in nvs_entry_next: %s\n", esp_err_to_name(err));
            break;
        }
    }

    nvs_close(my_handle);
    nvs_release_iterator(it);
}
