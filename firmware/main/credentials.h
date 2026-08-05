#ifndef CREDENTIALS_H
#define CREDENTIALS_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

bool credentials_store(const uint8_t *value, size_t len);

#endif // CREDENTIALS_H
