#ifdef ESP8266
#include <ESP8266mDNS.h>
#else
#include <ESPmDNS.h>
#endif

IPAddress multicast(224, 0, 0, 251); // Indirizzo mDNS
unsigned int port = 5353;

void InitMDNS(String hostname)
{
    if (!MDNS.begin(hostname.c_str()))
    {
        Serial.println("Error starting mDNS with hostname: " + hostname);
        return;
    }

    Serial.print("mDNS responder started, hostname: ");
    Serial.println(hostname);

    MDNS.addService("http", "tcp", 80);
}