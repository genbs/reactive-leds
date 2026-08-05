#ifndef WIFI_H
#define WIFI_H

#include <stdbool.h>
#include "esp_wifi.h"

#define WIFI_SSID_MAX_LEN 33
#define WIFI_PASS_MAX_LEN 64
#define WIFI_IP_LEN 4
#define WIFI_MAC_LEN 6

void wifi_init_sta();
void wifi_connect(const char *ssid, const char *password);
void wifi_disconnect();
void wifi_stop();
void wifi_disable_sleep();

bool wifi_connected();
char *wifi_ip();
char *wifi_mac();
void wifi_ip_bytes(uint8_t out[WIFI_IP_LEN]);
void wifi_mac_bytes(uint8_t out[WIFI_MAC_LEN]);

// Link-health debug counters (since boot), exposed via GET_STATUS.
uint32_t wifi_beacon_timeouts();
uint32_t wifi_disconnects();

/**
 * Scan visible Wi-Fi access points.
 *
 * Returns a heap-allocated array of records and writes the count into
 * *num_networks. The caller is responsible for free()-ing the returned array.
 * Returns NULL only if the underlying malloc failed.
 */
wifi_ap_record_t* wifi_scan(int *num_networks);

#endif // WIFI_H
