IPAddress multicast(224, 0, 0, 251); // Indirizzo mDNS
unsigned int port = 5353;

void InitMDNS()
{
    if (!MDNS.begin(hostname))
    {
        Serial.println("Error starting mDNS");
        return;
    }

    Serial.print("mDNS responder started, hostname: ");
    Serial.println(hostname);

    MDNS.addService("http", "tcp", 80);
}