#ifndef WIFI_H
#define WIFI_H

#include <string.h>

#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_log.h"

#define MAX_RETRY 10
#define WIFI_TAG "WIFI"

void wifi_init_sta();
void wifi_connect(const char *WIFI_SSID, const char *WIFI_PASS);
bool wifi_connected();
char *wifi_ip();
char *wifi_mac();

#endif