#ifndef ENV_H
#include "env.h"
#endif

#ifdef ESP8266
#ifndef ASYNCTCP_H_
#include <ESPAsyncTCP.h>
#endif
#else
#ifndef ASYNCTCP_H_
#include <AsyncTCP.h>
#endif
#endif

#ifndef _ESPAsyncWebServer_H_
#include <ESPAsyncWebServer.h>
#endif
class WebServer
{
private:
    AsyncWebServer server;

public:
    WebServer(int port) : server(port)
    {
    }

    void begin()
    {
        server.begin();
    }

    void on(const char *uri, ArRequestHandlerFunction onRequest, WebRequestMethodComposite method = HTTP_GET)
    {
        server.on(uri, method, onRequest);
    }

    void addHandler(AsyncWebHandler *ws)
    {
        server.addHandler(ws);
    }
};
