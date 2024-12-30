#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID "a9ca1f56-8436-41d7-81dc-947facf48fe8"
#define CHARACTERISTIC_UUID "474c5e20-2f61-450c-a4d3-b51a3685ba5c"

char ssid[32];
char password[64];

class BLECallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *characteristic)
    {
        String value = String(characteristic->getValue().c_str());

        if (value.length() > 0)
        {
            sscanf(value.c_str(), "%[^,],%s", ssid, password);
            if (FS_write("/wifi", ssid, password))
            {
                DEBUG_PRINTLN("WiFi credentials stored.");
                ESP.restart();
            }
        }
    }
};

void bluetooth_begin()
{
    DEBUG_PRINTLN("Starting BLE");

    BLEDevice::init(config.hostname);
    BLEServer *server = BLEDevice::createServer();
    BLEService *service = server->createService(SERVICE_UUID);

    BLECharacteristic *characteristic = service->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_WRITE);

    characteristic->setCallbacks(new BLECallbacks());

    service->start();
    BLEAdvertising *advertising = BLEDevice::getAdvertising();
    advertising->start();

    DEBUG_PRINTLN("BLE Started");
}