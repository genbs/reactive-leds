#include <DNSServer.h>
#ifdef ESP8266
#include <ESPAsyncTCP.h>
#else
#include <AsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>

DNSServer dnsServer;
AsyncWebServer webServer(80);

void handle_ap_config(AsyncWebServerRequest *request)
{
    request->send(200, "text/html", R"rawliteral(
        <html>
            <form action="/save" method="POST">
                SSID: <input type="text" name="ssid"><br>
                Password: <input type="password" name="password"><br>
                Hostname: <input type="text" name="hostname" value="genbs_led"><br>
                <input type="submit" value="Salva">
            </form>
        </html>
    )rawliteral");
}

void handle_ap_save(AsyncWebServerRequest *request)
{
    if (request->hasParam("ssid", true) && request->hasParam("password", true) && request->hasParam("hostname", true))
    {
        String ssid = request->getParam("ssid", true)->value();
        String password = request->getParam("password", true)->value();

        if (FS_write("/wifi", ssid.c_str(), password.c_str()))
        {
            String hostname = request->getParam("hostname", true)->value();
            strncpy(config.hostname, hostname.c_str(), sizeof(config.hostname) - 1);
            config.hostname[sizeof(config.hostname) - 1] = '\0';

            if (config_store())
            {
                Serial.println("Configuration saved successfully.");
                Serial.println("Restarting in 2 seconds.");
                delay(2000);
                ESP.restart();
                return;
            }
        }

        Serial.println("Failed to save configuration.");
        request->send(500, "text/plain", "Internal Server Error");
    }
    else
    {
        request->send(400, "text/plain", "Bad Request");
    }
}

void WiFiConnectAP()
{
    WiFi.disconnect();
    delay(100);

    Serial.println("");
    Serial.println("Starting AP mode");

    WiFi.mode(WIFI_AP);
    while (!WiFi.softAP(config.hostname, config.ap_password))
    {
        Serial.println(".");
        delay(100);
    }

    WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));

    Serial.println("");
    Serial.print("Started:\t");
    Serial.println(config.hostname);
    Serial.print("IP address:\t");
    Serial.println(WiFi.softAPIP());
}

void APModeStart()
{
    WiFiConnectAP();

    dnsServer.start(53, "*", WiFi.softAPIP());

    webServer.on("/", HTTP_GET, handle_ap_config);
    webServer.on("/save", HTTP_POST, handle_ap_save);
    webServer.onNotFound([](AsyncWebServerRequest *request)
                         { request->redirect("http://192.168.4.1"); });

    webServer.begin();
}