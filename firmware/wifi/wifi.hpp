#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

#define WIFI_CONNECT_TIMEOUT 20000

bool WiFiConnect(const char *ssid, const char *password)
{
    DEBUG_PRINTLN("Connecting to WiFi network: " + String(ssid));
    WiFi.begin(ssid, password);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(100);
        DEBUG_PRINT('.');

        if (millis() > start + WIFI_CONNECT_TIMEOUT)
        {
            DEBUG_PRINTLN("WiFi Connection failed");
            return false;
        }
    }

    DEBUG_PRINTF("\nConnected to network: %s\n", ssid);
    DEBUG_PRINTLN(ssid);
    DEBUG_PRINT("IP address:\t");
    DEBUG_PRINTLN(WiFi.localIP());
    DEBUG_PRINT("MAC address:\t");
    DEBUG_PRINTLN(WiFi.macAddress());

    WiFi.setSleep(false); // "performance" mode

    return true;
}

bool WiFiAutoConnect()
{
    WiFi.mode(WIFI_STA);

    DEBUG_PRINTLN("Scan Wi-Fi networks...");

    int numNetworks = WiFi.scanNetworks();
    if (numNetworks == 0)
    {
        DEBUG_PRINTLN("No networks found");
        return false;
    }
    else
    {
        for (int i = 0; i < numNetworks; i++)
        {
            String ssid = WiFi.SSID(i);
            DEBUG_PRINTLN("SSID: " + ssid + " RSSI: " + String(WiFi.RSSI(i)) + " dBm");
            String password = FS_read("/wifi", ssid.c_str(), "");
            if (!password.isEmpty())
            {
                if (WiFiConnect(ssid.c_str(), password.c_str()))
                {
                    return true;
                }
                else
                {
                    DEBUG_PRINTLN("Failed to connect to network: " + ssid);
                    FS_remove("/wifi", ssid.c_str());
                }
            }
        }
    }

    DEBUG_PRINTLN("No saved networks found");

    return false;
}
