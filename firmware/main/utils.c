#include "utils.h"
#include "wifi.h"
#include <stdio.h>
#include <string.h>

char* mask_wifi_password(const char *password) {
    static char masked_password[WIFI_PASS_MAX_LEN + 1];
    
    if (password == NULL) {
        snprintf(masked_password, sizeof(masked_password), "[empty]");
        return masked_password;
    }

    size_t pass_len = strlen(password);

    if (pass_len <= 4) {
        snprintf(masked_password, sizeof(masked_password), "********");
    } else {
        // show first 3 chars, last char and mask the rest
        snprintf(masked_password, sizeof(masked_password), "%.3s...%c", 
                 password,                
                 password[pass_len - 1]); 
    }
    
    return masked_password;
}
