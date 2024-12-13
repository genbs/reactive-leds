enum MessageType
{
    PING = 0,
    HANDSHAKE = 1,
    GET_CONFIG = 2,
    SET_CONFIG = 3,
    SET_COLORS = 4,
};

void udp_begin();
void udp_read();
void protocol_ping();
void protocol_handshake();
void protocol_get_config();
void protocol_set_config(byte *packet, int len);
void protocol_set_colors(byte *packet, int len);
void update_strip();