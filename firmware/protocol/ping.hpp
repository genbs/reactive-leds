void protocol_ping(AsyncUDPPacket *packet)
{
    uint8_t *data = packet->data();
    size_t len = packet->length();

    udp_response[0] = data[0];
    udp_response[1] = PING;

    packet->write(udp_response, 2);

    DEBUG_PRINTLN("PING");
}
