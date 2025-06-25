# gydra-led

### Send udp message using netcat

```bash
// send [1,4] to
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210
```

Print result in hex

```bash
# ping
echo -n -e '\x01\x01' | nc -u -w1 192.168.x.x 4210 | hexdump -C

# set led 1 to red
echo -n -e '\x01\x03\x01\xFF\x00\x00\x00' | nc -u -w1 192.168.x.x 4210 | hexdump -C
```

or

```bash
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210 | xxd -p
```

### Show host on network

```bash
dns-sd -B _http._tcp local # mdns
nmap -sn 192.168.1.0/24 # arp

```

### Arduino Conf

per l'esp32s3 selezionare

- PSRAM: OPI PSRAM
- Partition Scheme: 8MB

### Problems

Problems:

#### AsyncWebServer is no longer working, crashing with ESP32-S3 WROOM

```
assert failed: tcp_alloc /IDF/components/lwip/lwip/src/core/tcp.c:1851 (Required to lock TCPIP core functionality!)
```

resolved with install 3.0.7 version of ESP32 core:
https://forum.arduino.cc/t/asyncwebserver-is-no-longer-working-crashing-with-esp32-s3-wroom/1334021/5
