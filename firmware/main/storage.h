#ifndef STORAGE_H
#define STORAGE_H

#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "mbedtls/md5.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include "nvs.h"

#define STORAGE_TAG "STORAGE_SERVICE"

void storage_begin(); // Initialize NVS Flash
void storage_set(const char* namespace, const char* key, const char* value); // Set a key-value pair in the NVS Flash
void storage_get(const char* namespace, const char* key, char* value, size_t* length); // Get a value from the NVS Flash
bool storage_has_key(const char* namespace, const char* key); // Check if a key exists in the NVS Flash
void storage_log(const char* namespace); // Utility function to print all key-value pairs in the NVS Flash
void storage_delete(const char* namespace, const char* key); // Delete a key-value pair from the NVS Flash

#endif