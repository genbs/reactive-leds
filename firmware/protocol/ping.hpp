void protocol_ping(uint8_t message_id)
{
    udp.beginPacket(udp.remoteIP(), udp.remotePort());
    udp.write(message_id);
    udp.write(PING);
    udp.endPacket();

    DEBUG_PRINTLN("PING");
}
