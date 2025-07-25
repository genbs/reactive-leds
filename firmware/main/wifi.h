#ifndef WIFI_H
#define WIFI_H

#include <stdbool.h>
#include "esp_wifi.h"

#define WIFI_SSID_MAX_LEN 32
#define WIFI_PASS_MAX_LEN 32

void wifi_init_sta();
void wifi_connect(const char *ssid, const char *password);
void wifi_disconnect();
void wifi_stop();
void wifi_disable_sleep();

bool wifi_connected();
char *wifi_ip();
char *wifi_mac();
wifi_ap_record_t* wifi_scan(int *num_networks);

#endif // WIFI_H