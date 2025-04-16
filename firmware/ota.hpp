// #ifdef ESP32
// #include "SPIFFS.h"
// #elif defined(ESP8266)
// #include <FS.h>
// #endif
#include <ArduinoOTA.h>

void OTA_begin()
{
    ArduinoOTA.setHostname(config.hostname);
    ArduinoOTA.setPassword(config.password);

    if (ArduinoOTA.getCommand() == U_FLASH)
    {
        DEBUG_PRINTLN("Start updating sketch");
    }

    ArduinoOTA.onEnd([]()
                     { DEBUG_PRINTLN("\nUpdate Complete"); });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total)
                          { DEBUG_PRINTF("Progress: %u%%\r", (progress * 100) / total); });

    ArduinoOTA.onError([](ota_error_t error)
                       {
        DEBUG_PRINTF("Error[%u]: ", error);
        
        if (error == OTA_AUTH_ERROR) DEBUG_PRINTLN("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) DEBUG_PRINTLN("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) DEBUG_PRINTLN("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) DEBUG_PRINTLN("Receive Failed");
        else if (error == OTA_END_ERROR) DEBUG_PRINTLN("End Failed"); });

    ArduinoOTA.begin();

    DEBUG_PRINTLN("OTA Ready");
}

void OTA_loop()
{
    ArduinoOTA.handle();
}
