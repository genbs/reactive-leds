#include <WiFiUdp.h>

WiFiUDP udp;

enum MessageType
{
    HANDSHAKE = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_COLORS = 23,
};

void udp_begin()
{
    udp.begin(config.port);
}

void handleColorUpdate(byte *packet, int len)
{
    for (int i = 0; i < config.num_leds; i++)
    {
        uint8_t u = packet[i * 5 + 1];
        uint8_t r = packet[i * 5 + 2];
        uint8_t g = packet[i * 5 + 3];
        uint8_t b = packet[i * 5 + 4];
        float w = packet[i * 5 + 5];
        float br = w / 255.0;

        strip.setPixelColor(u, r * br, g * br, b * br);
    }
    strip.show();
}

void udp_read()
{
    int packetSize = udp.parsePacket();
    if (packetSize)
    {
        byte packet[255];
        int len = udp.read(packet, sizeof(packet));

        if (len > 0)
        {
            uint8_t message_type = packet[0];

            switch (message_type)
            {
            case HANDSHAKE:
                // send handshake
                Serial.println("Handshake");

                config_print();
                udp.beginPacket(udp.remoteIP(), udp.remotePort());
                udp.write(0);
                udp.write((config.port >> 8) & 0xFF); 
                udp.write(config.port & 0xFF);
                udp.write(config.id);
                udp.write(config.num_leds);

                udp.endPacket();

                break;
            case GET_CONFIG:
                // send config

                /*
                 const char *message = "Hello, UDP!";
                udp.beginPacket(udpAddress, udpPort);  // Inizia il pacchetto verso il destinatario
                udp.write(message);  // Scrivi il messaggio nel pacchetto
                udp.endPacket();  // Invia il pacchetto
                delay(1000);  // Invio del messaggio ogni secondo
                */
                break;

            case SET_CONFIG:
                Serial.println("SET_CONFIG");
                // Handle SET_CONFIG here
                break;

            case SET_COLORS:
                // Serial.println("SET_COLORS");
                handleColorUpdate(packet, len);
                break;

            default:
                Serial.println("Unknown message type");
                break;
            }
        }
    }
}
