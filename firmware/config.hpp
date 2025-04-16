#define HOSTNAME "esp32device-3"

struct Config
{
    char hostname[32];
    char password[32]; // hidden in the web interface, use for AP / OTA
    uint16_t port;
    unsigned short id;
    unsigned short num_leds; // max 60
    unsigned short brightness;
};

#ifdef ESP8266
Config config = {
    HOSTNAME,
    "<REDACTED>",
    4210,
    0,
    16,
    255};
#else
Config config = {
    .hostname = HOSTNAME,
    .password = "<REDACTED>",
    .port = 4210, // from 4100 4300
    .id = 0,
    .num_leds = 16,
    .brightness = 255,
};
#endif

void config_print()
{
    DEBUG_PRINTLN("Config:");
    DEBUG_PRINTLN("hostname: " + String(config.hostname));
    DEBUG_PRINTLN("password: " + String(config.password));
    DEBUG_PRINTLN("port: " + String(config.port));
    DEBUG_PRINTLN("id: " + String(config.id));
    DEBUG_PRINTLN("num_leds: " + String(config.num_leds));
    DEBUG_PRINTLN("brightness: " + String(config.brightness));
}

void config_begin()
{
    strcpy(config.hostname, FS_read("/config", "hostname", config.hostname).c_str());
    strcpy(config.password, FS_read("/config", "password", config.password).c_str());
    config.port = FS_read_uint("/config", "port", config.port);
    config.id = FS_read_uint("/config", "id", config.id);
    config.num_leds = FS_read_uint("/config", "num_leds", config.num_leds);
    config.brightness = FS_read_uint("/config", "brightness", config.brightness);

    config_print();
}

bool config_store()
{
    return FS_write("/config", "hostname", config.hostname) &&
           FS_write("/config", "password", config.password) &&
           FS_write_uint("/config", "port", config.port) &&
           FS_write_uint("/config", "id", config.id) &&
           FS_write_uint("/config", "num_leds", config.num_leds) &&
           FS_write_uint("/config", "brightness", config.brightness);
}