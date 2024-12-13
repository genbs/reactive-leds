# gydra-led

### Send udp message using netcat

```bash
// send [1,4] to
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210
```

Print result in hex

```bash
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210 | hexdump -C
```

or

```bash
echo -n -e '\x01\x04' | nc -u -w1 192.168.x.x 4210 | xxd -p
```
