#include <AsyncUDP.h>

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    BLINK = 4, // Find LED strip and blink it by config id
};

struct PacketSender
{
    IPAddress ip;
    uint16_t port;
};

PacketSender *sender = new PacketSender();
AsyncUDP udp;
uint8_t udp_response[128];

bool protocol_begin();
void protocol_loop();

void update_leds();
void protocol_process_packet(AsyncUDPPacket packet);
void protocol_ping(AsyncUDPPacket *packet);
void protocol_get_config(AsyncUDPPacket *packet);
void protocol_set_config(AsyncUDPPacket *packet);
void protocol_set_leds(AsyncUDPPacket *packet);
void protocol_blink(AsyncUDPPacket *packet);