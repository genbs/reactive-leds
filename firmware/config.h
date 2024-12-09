struct Config
{
    String hostname;
    String ap_password;
    unsigned int port;

    unsigned short id;
    unsigned short num_leds;
};

Config config = {
    .hostname = "genbs_led",
    .ap_password = "genbs_led_xyz",
    .port = 4210,
    .id = 0,
    .num_leds = 16,
};

void config_print()
{
    Serial.println("Config:");
    Serial.println("hostname: " + config.hostname);
    Serial.println("ap_password: " + config.ap_password);
    Serial.println("port: " + String(config.port));
    Serial.println("id: " + String(config.id));
    Serial.println("num_leds: " + String(config.num_leds));
}

void config_begin()
{
    config.hostname = FS_read("/config", "hostname", config.hostname);
    config.ap_password = FS_read("/config", "ap_password", config.ap_password);
    config.port = FS_read_uint("/config", "port", config.port);
    config.id = FS_read_uint("/config", "id", config.id);
    config.num_leds = FS_read_uint("/config", "num_leds", config.num_leds);
}

bool config_store()
{
    return FS_write("/config", "hostname", config.hostname) &&
           FS_write("/config", "ap_password", config.ap_password) &&
           FS_write_uint("/config", "port", config.port) &&
           FS_write_uint("/config", "id", config.id) &&
           FS_write_uint("/config", "num_leds", config.num_leds);
}