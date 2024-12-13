import { MDNSClient } from "./mdns"

export type ESPClientConfig = {
	port: number // udp port
	id: number // device id
	num_leds: number // number of leds
	hostname: string
}

export type ESPClient = MDNSClient & {
	config: ESPClientConfig
}
