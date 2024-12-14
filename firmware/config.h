struct Config
{
    char hostname[32];
    char ap_password[32]; // hidden in the web interface
    unsigned int port;
    unsigned short id;
    unsigned short num_leds;
    unsigned short brightness;
};

Config config = {
    .hostname = "genbs_led",
    .ap_password = "genbs_led_xyz",
    .port = 4210, // from 4100 4300
    .id = 0,
    .num_leds = 16,
    .brightness = 255,
};

void config_print()
{
    Serial.println("Config:");
    Serial.println("hostname: " + String(config.hostname));
    Serial.println("ap_password: " + String(config.ap_password));
    Serial.println("port: " + String(config.port));
    Serial.println("id: " + String(config.id));
    Serial.println("num_leds: " + String(config.num_leds));
    Serial.println("brightness: " + String(config.brightness));
}

void config_begin()
{
    strcpy(config.hostname, FS_read("/config", "hostname", config.hostname).c_str());
    strcpy(config.ap_password, FS_read("/config", "ap_password", config.ap_password).c_str());
    config.port = FS_read_uint("/config", "port", config.port);
    config.id = FS_read_uint("/config", "id", config.id);
    config.num_leds = FS_read_uint("/config", "num_leds", config.num_leds);
    config.brightness = FS_read_uint("/config", "brightness", config.brightness);
}

bool config_store()
{
    return FS_write("/config", "hostname", config.hostname) &&
           FS_write("/config", "ap_password", config.ap_password) &&
           FS_write_uint("/config", "port", config.port) &&
           FS_write_uint("/config", "id", config.id) &&
           FS_write_uint("/config", "num_leds", config.num_leds) &&
           FS_write_uint("/config", "brightness", config.brightness);
}