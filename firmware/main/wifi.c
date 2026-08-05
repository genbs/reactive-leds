#include "wifi.h"
#include "utils.h"
#include "config.h" 
#include <string.h>
#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_log.h"

#define WIFI_TAG "WIFI_SERVICE"
#define MAX_RETRY 10

static bool s_connected = false;
static char s_ip_address_str[16] = "0.0.0.0"; 
static char s_mac_address_str[18] = "00:00:00:00:00:00";
static uint8_t s_ip_address[WIFI_IP_LEN] = {0};
static uint8_t s_mac_address[WIFI_MAC_LEN] = {0};
static bool s_wifi_started = false;
static bool s_handlers_registered = false;
// Link-health debug counters, exposed via GET_STATUS.
static uint32_t s_beacon_timeouts = 0;
static uint32_t s_disconnects = 0;
static esp_event_handler_instance_t s_instance_any_id;
static esp_event_handler_instance_t s_instance_got_ip;

static void wifi_start_once(void)
{
    if (!s_wifi_started) {
        ESP_ERROR_CHECK(esp_wifi_start());
        s_wifi_started = true;
    }
}


static void event_handler(void* arg, esp_event_base_t event_base,
    int32_t event_id, void* event_data)
{
    // Connection retry counter, scoped to this handler (only consumer).
    static int s_retry_num = 0;

    if (event_base == WIFI_EVENT) {
        switch (event_id) {
            case WIFI_EVENT_STA_START:
                ESP_LOGV(WIFI_TAG, "WIFI_EVENT_STA_START => connecting...");
                esp_wifi_connect();
                break;

            case WIFI_EVENT_STA_BEACON_TIMEOUT:
                // AP beacons stopped arriving: correlates with air-side stalls.
                // LOGD (off by default): logging here would itself add jitter.
                s_beacon_timeouts++;
                ESP_LOGD(WIFI_TAG, "WIFI_EVENT_STA_BEACON_TIMEOUT (#%" PRIu32 ")", s_beacon_timeouts);
                break;

            case WIFI_EVENT_STA_DISCONNECTED: {
                wifi_event_sta_disconnected_t *disconn = (wifi_event_sta_disconnected_t *) event_data;
                s_disconnects++;
                ESP_LOGW(WIFI_TAG, "WIFI_EVENT_STA_DISCONNECTED => reason=%d", disconn->reason);

                if (s_retry_num < MAX_RETRY) {
                    s_retry_num++;
                    ESP_LOGV(WIFI_TAG, "Retrying to connect... Attempt #%d/%d",
                    s_retry_num, MAX_RETRY);
                    esp_wifi_connect();
	                } else {
	                    ESP_LOGE(WIFI_TAG, "Failed to connect after %d attempts", MAX_RETRY);
	                    s_connected = false;

	                    // clear IP address
	                    snprintf(s_ip_address_str, sizeof(s_ip_address_str), "0.0.0.0");
	                    memset(s_ip_address, 0, sizeof(s_ip_address));
	                }
                break;
            }

            default:
                ESP_LOGV(WIFI_TAG, "Unhandled WIFI_EVENT (%d)", (int)event_id);
                break;
        }
    } else if (event_base == IP_EVENT) {
        switch (event_id) {
            case IP_EVENT_STA_GOT_IP: {
                ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;

	                // Store IP address
	                snprintf(s_ip_address_str, sizeof(s_ip_address_str), IPSTR, IP2STR(&event->ip_info.ip));
	                s_ip_address[0] = esp_ip4_addr1_16(&event->ip_info.ip);
	                s_ip_address[1] = esp_ip4_addr2_16(&event->ip_info.ip);
	                s_ip_address[2] = esp_ip4_addr3_16(&event->ip_info.ip);
	                s_ip_address[3] = esp_ip4_addr4_16(&event->ip_info.ip);
	                ESP_LOGV(WIFI_TAG, "IP_EVENT_STA_GOT_IP => %s", s_ip_address_str);

                s_connected = true;
                s_retry_num = 0;
                break;
            }

            default:
                ESP_LOGV(WIFI_TAG, "Unhandled IP_EVENT (%" PRId32 ")", event_id);
                break;
        }
    }
}

// wifi in perfomance mode
void wifi_disable_sleep() 
{
    ESP_LOGV(WIFI_TAG, "Disabling WiFi sleep");
    ESP_ERROR_CHECK(esp_wifi_set_ps(WIFI_PS_NONE));
}

void wifi_init_sta() 
{
    ESP_LOGV(WIFI_TAG, "Starting WiFi Station");

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_t *netif = esp_netif_create_default_wifi_sta();

    if (netif != NULL) {
        const char *hostname = config.hostname;
        esp_err_t err = esp_netif_set_hostname(netif, hostname);
        if (err == ESP_OK) {
            ESP_LOGV(WIFI_TAG, "Hostname set to %s", hostname);
        } else {
            ESP_LOGE(WIFI_TAG, "Failed to set hostname: %s", esp_err_to_name(err));
        }
    }

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg)); 
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
}

void wifi_connect(const char WIFI_SSID[], const char WIFI_PASS[])
{   
    ESP_LOGV(WIFI_TAG, "Connecting to WiFi network: %s-%s", WIFI_SSID, mask_wifi_password(WIFI_PASS));

    if (!s_handlers_registered) {
        esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, &s_instance_any_id);
        esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, &s_instance_got_ip);
        s_handlers_registered = true;
    }

    wifi_config_t wifi_config = {0}; 
    strncpy((char *)wifi_config.sta.ssid, (char *)WIFI_SSID, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char *)wifi_config.sta.password, (char *)WIFI_PASS, sizeof(wifi_config.sta.password) - 1);
    wifi_config.sta.scan_method = WIFI_FAST_SCAN;
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = true;
    wifi_config.sta.pmf_cfg.required = false;
    // Disable 802.11k/v roaming on this stationary device: the periodic
    // background channel scans they trigger briefly interrupt UDP reception.
    wifi_config.sta.rm_enabled = 0;
    wifi_config.sta.btm_enabled = 0;
    
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
    wifi_start_once();

    esp_wifi_get_mac(ESP_IF_WIFI_STA, s_mac_address);

    // store MAC address
    snprintf(s_mac_address_str, sizeof(s_mac_address_str), "%02x:%02x:%02x:%02x:%02x:%02x", s_mac_address[0], s_mac_address[1], s_mac_address[2], s_mac_address[3], s_mac_address[4], s_mac_address[5]);

    ESP_ERROR_CHECK(esp_wifi_connect());
}

bool wifi_connected(){ return s_connected; }
char* wifi_ip(){ return s_ip_address_str; }
char* wifi_mac(){ return s_mac_address_str; }
void wifi_ip_bytes(uint8_t out[WIFI_IP_LEN]) { memcpy(out, s_ip_address, WIFI_IP_LEN); }
void wifi_mac_bytes(uint8_t out[WIFI_MAC_LEN]) { memcpy(out, s_mac_address, WIFI_MAC_LEN); }
uint32_t wifi_beacon_timeouts() { return s_beacon_timeouts; }
uint32_t wifi_disconnects() { return s_disconnects; }

void wifi_disconnect()
{
    ESP_LOGI(WIFI_TAG, "Disconnecting from WiFi network");
    ESP_ERROR_CHECK(esp_wifi_disconnect());
}

void wifi_stop() {
    ESP_LOGI(WIFI_TAG, "Stopping WiFi");
    ESP_ERROR_CHECK(esp_wifi_stop());
    ESP_ERROR_CHECK(esp_wifi_deinit());
    s_wifi_started = false;
    if (s_handlers_registered) {
        esp_event_handler_instance_unregister(WIFI_EVENT, ESP_EVENT_ANY_ID, s_instance_any_id);
        esp_event_handler_instance_unregister(IP_EVENT, IP_EVENT_STA_GOT_IP, s_instance_got_ip);
        s_handlers_registered = false;
    }
}

// Scan all available networks
// returns an array of wifi_ap_record_t and set num_networks to the number of networks found
wifi_ap_record_t* wifi_scan(int *num_networks) {
    ESP_LOGI(WIFI_TAG, "Starting WiFi scan");
    wifi_start_once();

    // Start scan
    wifi_scan_config_t scan_config = {
        .ssid = NULL,
        .bssid = NULL,
        .channel = 0,
        .show_hidden = true
    };
    ESP_ERROR_CHECK(esp_wifi_scan_start(&scan_config, true));

    // Return every visible AP — capping risks excluding the user's saved network
    // when it isn't among the strongest (common in crowded RF environments).
    uint16_t ap_num = 0;
    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_num(&ap_num));
    wifi_ap_record_t *ap_records = (wifi_ap_record_t *)malloc(ap_num * sizeof(wifi_ap_record_t));
    if (!ap_records) {
        ESP_LOGE(WIFI_TAG, "Failed to allocate memory for scan results");
        *num_networks = 0;
        return NULL;
    }
    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_records(&ap_num, ap_records));

    *num_networks = ap_num;
    ESP_LOGI(WIFI_TAG, "WiFi scan complete, found %d networks", ap_num);
    
    return ap_records;
}
