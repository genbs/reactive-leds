enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 2,
    SET_LEDS = 3,
    BLINK = 4, // Find LED strip and blink it by config id
};

WiFiUDP udp;

bool protocol_begin();
void protocol_loop();

void update_leds();
void protocol_ping(uint8_t message_id);
void protocol_get_config(uint8_t message_id);
void protocol_set_config(uint8_t message_id, uint8_t *packet, size_t packet_len);
void protocol_set_leds(uint8_t message_id, uint8_t *packet, size_t packet_len);
void protocol_blink(uint8_t message_id, uint8_t *packet, size_t packet_len);