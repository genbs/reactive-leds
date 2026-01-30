#ifndef STORAGE_H
#define STORAGE_H

#include <stdbool.h>
#include <stddef.h> 
#include "esp_err.h"  

void storage_begin();

esp_err_t storage_set(const char* namespace, const char* key, const char* value);
esp_err_t storage_get(const char* namespace, const char* key, char* value, size_t* length);
esp_err_t storage_delete(const char* namespace, const char* key);

bool storage_has_key(const char* namespace, const char* key);
void storage_log(const char* partition_name, const char* namespace);

#endif // STORAGE_H