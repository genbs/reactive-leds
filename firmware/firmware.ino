#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <DNSServer.h>

#define FORMAT_LITTLEFS_IF_FAILED true

#include "./wnet.h"
#include "./webserver.h"
#include "./websocket.h"

enum RunMode
{
	AP = 0,
	NORMAL = 1
};

enum MessageType
{
	GET_CONFIG = 0,
	SET_CONFIG = 1,
	SET_COLOR = 2,
	LOG = 3,
	RESET = 4
};

struct Config
{
	char wifi_ssid[32];
	char wifi_pwd[32];

	int id;	  // unique id or stripe index
	int port; // http and ws port

	int pixelType; // NEO_GRB + NEO_KHZ800 (5v stripe), NEO_WRGB + NEO_KHZ800 (27) (24v cob)
	int pin;	   // GPIO4 = 4

	int leds; // number of leds
	int brightness;
};

//////////////////////////

RunMode mode = RunMode::NORMAL;
DNSServer dnsServer;
Adafruit_NeoPixel *strip = nullptr;
WNet *net = nullptr;
WebServer *server = nullptr;
WebSocket *ws = nullptr;

Config *config = new Config();

//////////////////////////

#define LED_BUILTIN 2

void blink(int times)
{
	for (int i = 0; i < times; i++)
	{
		digitalWrite(LED_BUILTIN, HIGH);
		delay(250);
		digitalWrite(LED_BUILTIN, LOW);
		delay(250);
	}
};

void log(String message)
{
	Serial.println(message);
	if (ws != nullptr)
	{
		if (!message.startsWith("{"))
			message = "\"" + message + "\"";

		ws->sendAll(String("{\"message\": " + String(MessageType::LOG) + ", \"data\": " + message + " }").c_str());
	}
};

//////////////////////////

bool config_exists()
{
	return LittleFS.exists("/config.json");
};

bool load_config()
{
	File configFile = LittleFS.open("/config.json", "r");
	if (configFile)
	{
		StaticJsonDocument<256> doc;
		deserializeJson(doc, configFile);
		configFile.close();

		strcpy(config->wifi_ssid, doc["wifi_ssid"]);
		strcpy(config->wifi_pwd, doc["wifi_pwd"]);
		config->port = doc["port"];
		config->id = doc["id"];

		config->pin = doc["pin"];
		config->pixelType = doc["pixelType"];

		config->leds = doc["leds"];
		config->brightness = doc["brightness"];

		return true;
	}

	return false;
};

bool update_config()
{
	File configFile = LittleFS.open("/config.json", "w");

	if (configFile)
	{
		StaticJsonDocument<256> doc;
		doc["wifi_ssid"] = config->wifi_ssid;
		doc["wifi_pwd"] = config->wifi_pwd;
		doc["port"] = config->port;
		doc["id"] = config->id;

		doc["pin"] = config->pin;
		doc["pixelType"] = config->pixelType;

		doc["leds"] = config->leds;
		doc["brightness"] = config->brightness;

		serializeJson(doc, configFile);
		configFile.close();

		return true;
	}

	return false;
};

String config_to_json()
{
	StaticJsonDocument<256> doc;

	doc["id"] = config->id;
	doc["wifi_ssid"] = config->wifi_ssid;
	// doc["wifi_pwd"] = config->wifi_pwd; hide password from json
	doc["port"] = config->port;
	doc["pin"] = config->pin;
	doc["pixelType"] = config->pixelType;

	doc["leds"] = config->leds;
	doc["brightness"] = config->brightness;

	String json;
	serializeJson(doc, json);

	return json;
};

void remove_config()
{
	LittleFS.remove("/config.json");
};

//////////////////////////

void ap_page(AsyncWebServerRequest *request)
{
	String html = "<html><body><div style='display:flex;'><h1>LedStripe Configuration</h1>";
	html += "<form action='/save' method='POST'>";

	// wifi
	html += "SSID: <input required type='text' value='" + String(config->wifi_ssid) + "' name='wifi_ssid' /><br>";
	html += "Password: <input required type='password' value='" + String(config->wifi_pwd) + "' name='wifi_pwd' /><br>";

	html += "Id (identifier or stripe index): <input required type='number' value='" + String(config->id) + "' name='id' /><br>";
	html += "Pin (GPIO for stripe data): <input required type='number' value='" + String(config->pin) + "' name='pin' /><br>";
	html += "Port (http/ws): <input type='number' required value='" + String(config->port) + "' name='port' /><br>";

	html += "Number of LEDs: <input type='number' value='" + String(config->leds) + "'  name='leds' /><br>";

	// create select for pixelType
	html += "pixel Type: <select name='pixelType'>";
	int pixelTypes[] = {NEO_GRB + NEO_KHZ800, NEO_WRGB + NEO_KHZ800};
	String pixelTypesNames[] = {"NEO_GRB + NEO_KHZ800", "NEO_WRGB + NEO_KHZ800"};
	for (int i = 0; i < 2; i++)
	{
		html += "<option value='" + String(pixelTypes[i]) + "'";
		if (config->pixelType == pixelTypes[i])
		{
			html += " selected";
		}
		html += ">" + pixelTypesNames[i] + "</option>";
	}
	html += "</select><br>";

	html += "Brightness: <input type='number' max=\"255\" step=\"1\" min=\"0\" value='" + String(config->brightness) + "' name='brightness'/><br>";

	html += "<input type='submit' value='Save'>";
	html += "</form></div></body></html>";

	request->send(200, "text/html", html);
};

bool ap_save(AsyncWebServerRequest *request)
{
	if (request->hasArg("id") && request->hasArg("wifi_ssid") && request->hasArg("wifi_pwd") && request->hasArg("port") && request->hasArg("pin") && request->hasArg("leds") && request->hasArg("brightness") && request->hasArg("pixelType"))
	{
		if (request->arg("id").length() == 0 || request->arg("wifi_ssid").length() == 0 || request->arg("wifi_pwd").length() == 0 ||
			request->arg("port").length() == 0 || request->arg("pin").length() == 0 ||
			request->arg("leds").length() == 0 || request->arg("brightness").length() == 0 || request->arg("pixelType").length() == 0)
		{
			request->send(400, "text/html", "All fields are required.");
			return false;
		}

		strcpy(config->wifi_ssid, request->arg("wifi_ssid").c_str());
		strcpy(config->wifi_pwd, request->arg("wifi_pwd").c_str());
		config->id = request->arg("id").toInt();
		config->port = request->arg("port").toInt();
		config->pixelType = request->arg("pixelType").toInt();
		config->pin = request->arg("pin").toInt();
		config->leds = request->arg("leds").toInt();
		config->brightness = request->arg("brightness").toInt();

		if (update_config())
		{
			request->send(200, "text/html", "<h1>Configuration saved. Restarting...</h1>");
			return true;
		}
		else
		{
			request->send(500, "text/html", "Failed to save configuration.");
			return false;
		}
	}

	request->send(400, "text/html", "Configuration incomplete.");
	return false;
};

void ap_mode()
{
	blink(3);

	mode = RunMode::AP;
	log("Starting AP mode.");

	WNet::ap("LED-Stripe", "<REDACTED>");
	log("AP IP address: ");
	log(WNet::apIP().toString());

	dnsServer.start(53, "*", WNet::apIP());

	server = new WebServer(80);

	server->on("/", [](AsyncWebServerRequest *request)
			   { ap_page(request); });
	server->on("/save", [](AsyncWebServerRequest *request)
			   {
               if (ap_save(request))
               {
                 log("Configuration saved. Restarting...");
                 delay(2000);
                 ESP.restart();
               } else {
                  log("Configuration not saved.");
               } }, HTTP_POST);

	server->begin();
};

//////////////////////////

//////////////////////////

void reset()
{
	log("Configuration removed. Restarting...");
	LittleFS.remove("/config.json");
	ESP.restart();
};

//////////////////////////

void setPixelColorWithBrightness(int pixel, uint8_t red, uint8_t green, uint8_t blue, uint8_t brightness)
{
	float brightnessFactor = brightness / 255.0;
	uint8_t r = red * brightnessFactor;
	uint8_t g = green * brightnessFactor;
	uint8_t b = blue * brightnessFactor;

	strip->setPixelColor(pixel, strip->Color(r, g, b));
};

void handleWebSocketMessage(AsyncWebSocketClient *client, void *arg, uint8_t *data, size_t len)
{
	uint8_t messageType = data[0];

	switch (messageType)
	{
	case MessageType::GET_CONFIG:
	{
		client->text("{\"message\": " + String(messageType) + ", \"data\": " + config_to_json() + "}");
		break;
	}

	case MessageType::SET_CONFIG:
	{
		config->leds = data[1];
		config->brightness = data[2];
		config->pin = data[3];
		config->pixelType = data[4];

		if (update_config())
		{
			strip = new Adafruit_NeoPixel(config->leds, config->pin, config->pixelType);
			strip->begin();
			strip->show();
			strip->setBrightness(config->brightness);

			client->text("{\"message\": " + String(messageType) + ", \"data\": {\"status\": \"ok\"} }");
		}
		else
		{
			client->text("{\"message\": " + String(messageType) + ", \"data\": {\"status\": \"error\"} }");
		}
		break;
	}

	case MessageType::SET_COLOR:
	{
		int i = 0;
		for (i; (i * 5 + 4) <= len; i++)
		{
			uint8_t u = data[i * 5 + 1];
			uint8_t r = data[i * 5 + 1 + 1];
			uint8_t g = data[i * 5 + 2 + 1];
			uint8_t b = data[i * 5 + 3 + 1];
			uint8_t brightness = data[i * 5 + 4 + 1];
			setPixelColorWithBrightness(u, r, g, b, brightness);
		}

		strip->show();
		client->text("{\"message\": " + String(messageType) + " }");
		break;
	}

	case MessageType::RESET:
	{
		client->text("{\"message\": " + String(messageType) + " }");
		delay(2000);
		log("Receved RESET command by websocket client");
		reset();
		break;
	}
	}
};

void led_mode()
{
	blink(1);
	mode = RunMode::NORMAL;
	net = new WNet(config->wifi_ssid, config->wifi_pwd);
	server = new WebServer(config->port);
	ws = new WebSocket("/ws");

	strip = new Adafruit_NeoPixel(config->leds, config->pin, config->pixelType);

	strip->begin();
	strip->show();
	strip->setBrightness(config->brightness);

	log("Connecting to WIFI (" + String(config->wifi_ssid) + ")...");
	if (!net->connect())
	{
		return reset();
	}

	log("Connected.");
	log("MAC: " + net->mac());
	log("IP: " + net->ip());

	blink(5);

	ws->onConnect([](AsyncWebSocket *server, AsyncWebSocketClient *client)
				  { log("Client connected."); });
	ws->onMessage([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
				  { 
                if (type == WS_EVT_DATA) {
                  handleWebSocketMessage(client, arg, data, len);
              } });

	server->on("/", [](AsyncWebServerRequest *request)
			   { request->send(200, "application/json",
							   "{\"status\": \"ok\"}"); });

	server->on("/reset", [](AsyncWebServerRequest *request)
			   { 
              log("Receved RESET command by http.");
              reset(); });

	server->begin();
	ws->begin(server);
};

//////////////////////////

void setup()
{
	if (!LittleFS.begin(FORMAT_LITTLEFS_IF_FAILED))
	{
		Serial.println("LittleFS Mount Failed");
		return;
	}

	Serial.begin(115200);
	pinMode(LED_BUILTIN, OUTPUT);

	bool loaded = load_config();

	if (!loaded || config->wifi_ssid[0] == '\0')
	{
		if (config_exists())
		{
			log("Config file not valid.");
			remove_config();
		}
		else
		{
			log("Config file not found.");
		}

		ap_mode();
	}
	else
	{
		log("Config file:");
		log(config_to_json());

		led_mode();
	}
};

int retry = 5;
void loop()
{
	if (mode == RunMode::AP)
	{
		dnsServer.processNextRequest();
		retry = 5;
	}

	if (mode == RunMode::NORMAL)
	{
		if (!net->isConnected())
		{
			if (retry > 0)
			{
				log("Connection lost. Retrying...");
				if (net->connect())
				{
					log("Connected.");
					log("MAC: " + net->mac());
					log("IP: " + net->ip());
					blink(5);
				}
				else
				{
					retry--;
				}
			}
			else
			{
				log("Connection lost. Reset...");
				reset();
			}
		}
	}
};
