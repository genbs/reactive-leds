enum ProtocolMessageType
{
    PING = 0,
    GET_CONFIG = 1,
    SET_CONFIG = 1,
    SET_LEDS = 3,
};

void udp_begin();
void udp_read();
void protocol_ping(uint8_t message_id);
void protocol_handshake(uint8_t message_id);
void protocol_get_config(uint8_t message_id);
void protocol_set_config(uint8_t message_id, byte *packet, int len);
void protocol_set_leds(uint8_t message_id, byte *packet, int len);
void update_strip();