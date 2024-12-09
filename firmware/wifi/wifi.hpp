#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

#include "ap.hpp"

bool WiFiConnect(const char *ssid, const char *password)
{
    Serial.println("Connecting to WiFi network: " + String(ssid));
    WiFi.begin(ssid, password);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(100);
        Serial.print('.');

        if (millis() > start + 10000)
        {
            Serial.println("Connection failed");
            return false;
        }
    }

    Serial.println("");
    Serial.print("Connected:\t");
    Serial.println(ssid);
    Serial.print("IP address:\t");
    Serial.println(WiFi.localIP());

    return true;
}

bool WiFiAutoConnect()
{
    WiFi.mode(WIFI_STA);

    Serial.println("Scan Wi-Fi networks...");

    int numNetworks = WiFi.scanNetworks();
    if (numNetworks == 0)
    {
        Serial.println("No networks found");
        return false;
    }
    else
    {
        for (int i = 0; i < numNetworks; i++)
        {
            String ssid = WiFi.SSID(i);
            Serial.println("SSID: " + ssid + " RSSI: " + String(WiFi.RSSI(i)) + " dBm");
            String password = FS_read("/wifi", ssid.c_str(), "");
            if (!password.isEmpty())
            {
                if (WiFiConnect(ssid.c_str(), password.c_str()))
                {
                    return true;
                }
                else
                {
                    Serial.println("Failed to connect to network: " + ssid);
                    FS_remove("/wifi", ssid.c_str());
                }
            }
        }
    }

    Serial.println("No saved networks found");

    return false;
}
