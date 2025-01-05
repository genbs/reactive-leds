#include "wifi.h"

static int retry_num = 0;
static bool connected = false;
static char ip_address_str[16] = "0.0.0.0"; 
static char mac_address_str[18] = "00:00:00:00:00:00";

static void event_handler(void* arg, esp_event_base_t event_base,
    int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
        return;
    }

    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (retry_num < MAX_RETRY) {
            esp_wifi_connect();
            retry_num++;
            ESP_LOGI(WIFI_TAG, "Retry to connect to the AP");
        } else {
            ESP_LOGI(WIFI_TAG, "Failed to connect to the AP");
            connected = false;
            snprintf(ip_address_str, sizeof(ip_address_str), "0.0.0.0");
        }
        ESP_LOGI(WIFI_TAG, "Connect to the AP fail");

        return;
    }
        
    if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP){
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        
        snprintf(ip_address_str, sizeof(ip_address_str), IPSTR, IP2STR(&event->ip_info.ip));
        ESP_LOGI(WIFI_TAG, "Got IP: %s", ip_address_str);
        
        connected = true;
        retry_num = 0;

        return;
    }
}

void wifi_init_sta()
{
    ESP_LOGI(WIFI_TAG, "init.");

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg)); 
}

void wifi_connect(const char WIFI_SSID[], const char WIFI_PASS[])
{
    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    esp_event_handler_instance_register(WIFI_EVENT,
                                        ESP_EVENT_ANY_ID,
                                        &event_handler,
                                        NULL,
                                        &instance_any_id);
    esp_event_handler_instance_register(IP_EVENT,
                                        IP_EVENT_STA_GOT_IP,
                                        &event_handler,
                                        NULL,
                                        &instance_got_ip);

    wifi_config_t wifi_config = {0}; 

    strcpy((char *)wifi_config.sta.ssid, (char *)WIFI_SSID);
    strcpy((char *)wifi_config.sta.password, (char *)WIFI_PASS);
    wifi_config.sta.scan_method = WIFI_ALL_CHANNEL_SCAN;
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = true;
    wifi_config.sta.pmf_cfg.required = false;
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    uint8_t mac[6];
    esp_wifi_get_mac(ESP_IF_WIFI_STA, mac);
    snprintf(mac_address_str, sizeof(mac_address_str), "%02x:%02x:%02x:%02x:%02x:%02x", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    ESP_LOGI(WIFI_TAG, "wifi_init_ap finished.");
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