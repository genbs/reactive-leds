#ifndef ENV_H
#include "env.h"
#endif

#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

class WNet
{
private:
    char *ssid;
    const char *pwd;

public:
    /**
     * @param _ssid The SSID of the network
     * @param _pwd The password of the network
     */
    WNet(char *_ssid, const char *_pwd) : ssid(_ssid), pwd(_pwd)
    {
    }

    bool connect()
    {
        WiFi.begin(ssid, pwd);
        unsigned long current_time = millis();
        while (WiFi.status() != WL_CONNECTED)
        {
            Serial.print(".");
            delay(100);
            if (millis() - current_time > 10000)
            {
                Serial.println("Connection failed");
                return false;
            }
        }
        return true;
    }

    bool isConnected()
    {
        return WiFi.status() == WL_CONNECTED;
    }

    void disconnect()
    {
        WiFi.disconnect();
    }

    String mac()
    {
        return WiFi.macAddress();
    }

    String ip()
    {
        return WiFi.localIP().toString();
    }

    static void ap(const char *ssid, const char *pwd)
    {
        WiFi.softAP(ssid, pwd);
    }

    static IPAddress apIP()
    {
        return WiFi.softAPIP();
    }
};