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

class WebSocket
{
private:
    AsyncWebSocket ws;
    // Save callbacks for onConnect, onDisconnect, onMessage
    std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client)> onConnectCallback;
    std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client)> onDisconnectCallback;
    std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)> onMessageCallback;

    void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
    {
        switch (type)
        {
        case WS_EVT_CONNECT:
            if (onConnectCallback)
            {
                onConnectCallback(server, client);
            }
            break;
        case WS_EVT_DISCONNECT:
            if (onDisconnectCallback)
            {
                onDisconnectCallback(server, client);
            }
            break;
        case WS_EVT_DATA:
            if (onMessageCallback)
            {
                onMessageCallback(server, client, type, arg, data, len);
            }
            break;
        default:
            break;
        }
    }

public:
    WebSocket(const char *path) : ws(path)
    {
        ws.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
                   { this->onEvent(server, client, type, arg, data, len); });
    }

    void begin(WebServer *server)
    {
        server->addHandler(&ws);
    }

    void onConnect(std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client)> _onConnect)
    {
        onConnectCallback = _onConnect;
    }

    void onDisconnect(std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client)> _onDisconnect)
    {
        onDisconnectCallback = _onDisconnect;
    }

    void onMessage(std::function<void(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)> _onMessage)
    {
        onMessageCallback = _onMessage;
    }

    void send(AsyncWebSocketClient *client, const char *message)
    {
        client->text(message);
    }

    void sendAll(const char *message)
    {
        ws.textAll(message);
    }
};
