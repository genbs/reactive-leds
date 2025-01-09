#ifndef STORAGE_H
#define STORAGE_H

#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "nvs_flash.h"
#include "esp_log.h"
#include "nvs.h"

#define STORAGE_TAG "STORAGE"

void storage_begin();
void storage_set(const char* namespace, const char* key, const char* value);
void storage_get(const char* namespace, const char* key, char* value, size_t* length);
bool storage_has_key(const char* namespace, const char* key);
void storage_log(const char* namespace);

#endif