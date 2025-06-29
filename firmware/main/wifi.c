#include "wifi.h"

static int retry_num = 0;
static bool connected = false;
static char ip_address_str[16] = "0.0.0.0"; 
static char mac_address_str[18] = "00:00:00:00:00:00";


static void event_handler(void* arg, esp_event_base_t event_base,
    int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT) {
        switch (event_id) {
            case WIFI_EVENT_STA_START:
                ESP_LOGV(WIFI_TAG, "WIFI_EVENT_STA_START => connecting...");
                esp_wifi_connect();
                break;

            case WIFI_EVENT_STA_DISCONNECTED: 
                wifi_event_sta_disconnected_t *disconn = (wifi_event_sta_disconnected_t *) event_data;
                ESP_LOGW(WIFI_TAG, "WIFI_EVENT_STA_DISCONNECTED => reason=%d", disconn->reason);

                if (retry_num < MAX_RETRY) {
                    retry_num++;
                    ESP_LOGV(WIFI_TAG, "Retrying to connect... Attempt #%d/%d",
                    retry_num, MAX_RETRY);
                    esp_wifi_connect();
                } else {
                    ESP_LOGE(WIFI_TAG, "Failed to connect after %d attempts", MAX_RETRY);
                    connected = false;

                    // clear IP address
                    snprintf(ip_address_str, sizeof(ip_address_str), "0.0.0.0");
                }
                break;

            default:
                ESP_LOGV(WIFI_TAG, "Unhandled WIFI_EVENT (%d)", (int)event_id);
                break;
        }
    } else if (event_base == IP_EVENT) {
        switch (event_id) {
            case IP_EVENT_STA_GOT_IP: {
                ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;

                // Store IP address
                snprintf(ip_address_str, sizeof(ip_address_str), IPSTR, IP2STR(&event->ip_info.ip));
                ESP_LOGV(WIFI_TAG, "IP_EVENT_STA_GOT_IP => %s", ip_address_str);

                connected = true;
                retry_num = 0;
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

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, &instance_any_id);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, &instance_got_ip);

    wifi_config_t wifi_config = {0}; 
    strcpy((char *)wifi_config.sta.ssid, (char *)WIFI_SSID);
    strcpy((char *)wifi_config.sta.password, (char *)WIFI_PASS);
    wifi_config.sta.scan_method = WIFI_ALL_CHANNEL_SCAN;
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = true;
    wifi_config.sta.pmf_cfg.required = false;
    
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    uint8_t mac[6];
    esp_wifi_get_mac(ESP_IF_WIFI_STA, mac);

    // store MAC address
    snprintf(mac_address_str, sizeof(mac_address_str), "%02x:%02x:%02x:%02x:%02x:%02x", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    ESP_ERROR_CHECK(esp_wifi_connect());
}

bool wifi_connected()
{
    return connected;
}

char* wifi_ip()
{
    return ip_address_str;
}

char* wifi_mac()
{
    return mac_address_str;
}

void wifi_disconnect()
{
    ESP_LOGI(WIFI_TAG, "Disconnecting from WiFi network");
    ESP_ERROR_CHECK(esp_wifi_disconnect());
}

void wifi_stop() {
    ESP_LOGI(WIFI_TAG, "Stopping WiFi");
    ESP_ERROR_CHECK(esp_wifi_stop());
    ESP_ERROR_CHECK(esp_wifi_deinit());
}

// Scan all available networks
// returns an array of wifi_ap_record_t and set num_networks to the number of networks found
wifi_ap_record_t* wifi_scan(int *num_networks) {
    ESP_LOGI(WIFI_TAG, "Starting WiFi scan");
    ESP_ERROR_CHECK(esp_wifi_start());

    // Start scan
    wifi_scan_config_t scan_config = {
        .ssid = NULL,
        .bssid = NULL,
        .channel = 0,
        .show_hidden = true
    };
    ESP_ERROR_CHECK(esp_wifi_scan_start(&scan_config, true));  

    uint16_t ap_num = MAX_AP_SCAN;
    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_num(&ap_num));
    wifi_ap_record_t *ap_records = (wifi_ap_record_t *)malloc(ap_num * sizeof(wifi_ap_record_t));
    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_records(&ap_num, ap_records));

    // ESP_ERROR_CHECK(esp_wifi_stop());
    // ESP_ERROR_CHECK(esp_wifi_deinit());

    *num_networks = ap_num;
    ESP_LOGI(WIFI_TAG, "WiFi scan complete, found %d networks", ap_num);
    
    return ap_records;
}

char* mask_wifi_password(const char *password) {
    static char masked_password[WIFI_PASS_MAX_LEN + 1]; 
    size_t pass_len = strlen(password);

    if (pass_len <= 4) {
        snprintf(masked_password, sizeof(masked_password), "********");
    } else {
        snprintf(masked_password, sizeof(masked_password), "%.3s...%c", 
                 password, password[pass_len - 1]);
    }
    
    return masked_password;
}