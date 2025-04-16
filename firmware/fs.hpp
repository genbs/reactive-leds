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
        DEBUG_PRINTLN("Failed to create file: " + String(path));
        return false;
    }

    file.close();
    return true;
}

String FS_read(const char *path, const char *key, String defaultValue)
{
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        DEBUG_PRINTLN("File not found: " + String(path));
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

                if (value.isEmpty())
                    return defaultValue;

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
        DEBUG_PRINTLN("File not found: " + String(path));
        return;
    }

    String line;
    while (file.available())
    {
        line = file.readStringUntil('\n');
        DEBUG_PRINTLN(line);
    }

    file.close();
}

unsigned int FS_read_uint(const char *path, const char *key, unsigned int defaultValue = 0)
{
    return FS_read(path, key, String(defaultValue).c_str()).toInt();
}

bool FS_exist(const char *path, const char *key)
{
    return !FS_read(path, key, "").isEmpty();
}

bool FS_remove(const char *path, const char *key)
{
    String tempPath = String(path) + ".tmp";
    File tempFile = LittleFS.open(tempPath.c_str(), "w");
    if (!tempFile)
    {
        DEBUG_PRINTLN("Failed to create temporary file");
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

bool FS_write(const char *path, const char *key, String value)
{
    String tempPath = String(path) + ".tmp";
    File tempFile = LittleFS.open(tempPath.c_str(), "w");
    if (!tempFile)
    {
        DEBUG_PRINTLN("Failed to create temporary file");
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

bool FS_write_uint(const char *path, const char *key, unsigned int value)
{
    return FS_write(path, key, String(value).c_str());
}

void FS_begin()
{
#ifdef ESP8266
    if (!LittleFS.begin())
#else
    if (!LittleFS.begin(true))
#endif
    {
        DEBUG_PRINTLN("LittleFS Mount Failed");
    }

    FS_create("/config");
    FS_create("/wifi");
}
