#ifdef ESP8266
#include <ESP8266mDNS.h>
#else
#include <ESPmDNS.h>
#endif

void InitMDNS()
{
    if (!MDNS.begin(config.hostname))
    {
        Serial.print("Error starting mDNS with hostname: ");
        Serial.println(config.hostname);
        return;
    }

    Serial.print("mDNS responder started, hostname: ");
    Serial.println(config.hostname);

    MDNS.addService("http", "tcp", 80);
}