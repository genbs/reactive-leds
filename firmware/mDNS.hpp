#ifdef ESP8266
#include <ESP8266mDNS.h>
#else
#include <ESPmDNS.h>
#endif

void InitMDNS()
{
    if (!MDNS.begin(config.hostname))
    {
        DEBUG_PRINT("Error starting mDNS with hostname: ");
        DEBUG_PRINTLN(config.hostname);
        return;
    }

    DEBUG_PRINT("mDNS responder started, hostname: ");
    DEBUG_PRINTLN(config.hostname);

    MDNS.addService("http", "tcp", 80);
}