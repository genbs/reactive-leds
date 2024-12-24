#define BLINK_DELAY 1000
#define BLINK_COUNT 3

enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    BLINK = 4, // Find LED strip and blink it by config id
};

void udp_begin();
void udp_read();

void update_leds();
void protocol_ping(uint8_t message_id);
void protocol_get_config(uint8_t message_id);
void protocol_set_config(uint8_t message_id, byte *packet, int len);
void protocol_set_leds(uint8_t message_id, byte *packet, int len);
void protocol_blink(uint8_t message_id, byte *packet, int len);

// void update_strip();