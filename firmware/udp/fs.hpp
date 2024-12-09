#include <LittleFS.h>

bool FS_create(const char *path)
{
    if (LittleFS.exists(path))
    {
        return true;
    }

    File file = LittleFS.open(path, "w");
    if (!file)
    {
        Serial.println("Failed to create file: " + String(path));
        return false;
    }

    file.close();
    return true;
}

String FS_read(const char *path, const char *key, const String &defaultValue = "")
{
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        Serial.println("File not found: " + String(path));
        return defaultValue;
    }

    String line;
    while (file.available())
    {
        line = file.readStringUntil('\n');
        int delimiterIndex = line.indexOf('=');
        if (delimiterIndex > 0)
        {
            String currentKey = line.substring(0, delimiterIndex);
            if (currentKey == String(key))
            {
                file.close();
                String value = line.substring(delimiterIndex + 1);
                value.trim();
                return value;
            }
        }
    }

    file.close();
    return defaultValue;
}

void FS_print(const char *path)
{
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        Serial.println("File not found: " + String(path));
        return;
    }

    String line;
    while (file.available())
    {
        line = file.readStringUntil('\n');
        Serial.println(line);
    }

    file.close();
}

bool FS_exist(const char *path, const char *key)
{
    return !FS_read(path, key).isEmpty();
}

bool FS_remove(const char *path, const char *key)
{
    String tempPath = String(path) + ".tmp";
    File tempFile = LittleFS.open(tempPath.c_str(), "w");
    if (!tempFile)
    {
        Serial.println("Failed to create temporary file");
        return false;
    }

    File originalFile = LittleFS.open(path, "r");

    String line;
    bool found = false;

    if (originalFile)
    {
        while (originalFile.available())
        {
            line = originalFile.readStringUntil('\n');
            int delimiterIndex = line.indexOf('=');
            if (delimiterIndex > 0)
            {
                String currentKey = line.substring(0, delimiterIndex);
                if (currentKey == String(key))
                {
                    found = true;
                }
                else
                {
                    tempFile.println(line);
                }
            }
            else
            {
                tempFile.println(line);
            }
        }
        originalFile.close();
    }

    tempFile.close();

    if (found)
    {
        LittleFS.remove(path);
        LittleFS.rename(tempPath.c_str(), path);
        return true;
    }
    else
    {
        LittleFS.remove(tempPath.c_str());
        return false;
    }
}

bool FS_write(const char *path, const char *key, const char *value)
{
    String tempPath = String(path) + ".tmp";
    File tempFile = LittleFS.open(tempPath.c_str(), "w");
    if (!tempFile)
    {
        Serial.println("Failed to create temporary file");
        return false;
    }

    File originalFile = LittleFS.open(path, "r");

    String line;
    bool found = false;

    if (originalFile)
    {
        while (originalFile.available())
        {
            line = originalFile.readStringUntil('\n');
            int delimiterIndex = line.indexOf('=');
            if (delimiterIndex > 0)
            {
                String currentKey = line.substring(0, delimiterIndex);
                if (currentKey == String(key))
                {
                    found = true;
                    tempFile.println(String(key) + "=" + String(value));
                }
                else
                {
                    tempFile.println(line);
                }
            }
            else
            {
                tempFile.println(line);
            }
        }
        originalFile.close();
    }

    if (!found)
    {
        tempFile.println(String(key) + "=" + String(value));
    }

    tempFile.close();

    LittleFS.remove(path);
    LittleFS.rename(tempPath.c_str(), path);

    return true;
}

void FS_begin()
{
#ifdef ESP8266
    if (!LittleFS.begin())
#else
    if (!LittleFS.begin(true))
#endif
    {
        Serial.println("LittleFS Mount Failed");
    }

    FS_create("/config");
    FS_create("/wifi");
}
