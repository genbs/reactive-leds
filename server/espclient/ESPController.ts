import dgram from "dgram"
import EventEmitter from "../EventEmitter"
import { log } from "../log"
import { hostnameByIP } from "../utils"
import { ESPClient } from "./ESPClient"
import MDNSService, { MDNSClient } from "./mdns"
import { handshake, ping } from "./protocol"

type ESPControllerEvents = {
	espConnect: (client: ESPClient) => void
	espDisconnect: (client: ESPClient) => void
}

export default class ESPController extends EventEmitter<ESPControllerEvents> {
	private clients = new Map<ESPClient["address"], ESPClient>()
	private mdnsClientsWaiting: MDNSClient["address"][] = []
	private udpServer: dgram.Socket
	private activeClientInterval: NodeJS.Timeout

	start() {
		this.startMDNSdeamon()

		this.udpServer = dgram.createSocket("udp4")

		this.udpServer.bind(3999)

		log(`UDP Server listening on port ${3999}`)

		this.startActiveClientInterval()
	}

	startActiveClientInterval() {
		clearInterval(this.activeClientInterval)
		this.activeClientInterval = setInterval(() => this.checkActiveClients(), 100)
	}

	async checkActiveClients() {
		clearInterval(this.activeClientInterval)
		for (const client of this.clients.values()) {
			const online = await ping(client.address, client.config.port)
			if (!online) {
				this.onESPDisconnect(client)
			}
		}
		this.activeClientInterval = setInterval(() => this.checkActiveClients(), 100)
	}

	onESPConnect(client: ESPClient) {
		this.clients.set(client.address, client)
		this.startActiveClientInterval()
		this.emit("espConnect", client)
	}

	onESPDisconnect(client: ESPClient) {
		this.clients.delete(client.address)
		this.startActiveClientInterval()
		this.emit("espDisconnect", client)
	}

	async find(address: string, port?: number): Promise<ESPClient | null> {
		const config = await handshake(address, port ? port : 4100, port ? undefined : 4300)

		if (!config) return null

		const resolved = await hostnameByIP(address)
		let host = resolved || config.hostname + ".local"
		console.log(resolved)
		return {
			name: config.hostname,
			address: address,
			host,
			config,
		}
	}

	private startMDNSdeamon() {
		const mdnsService = new MDNSService()

		mdnsService.on("deviceUp", device => {
			if (this.mdnsClientsWaiting.includes(device.address)) return

			this.mdnsClientsWaiting.push(device.address)
			if (this.clients.has(device.address)) return

			handshake(device.address, 4100, 4300).then(espConfig => {
				this.mdnsClientsWaiting = this.mdnsClientsWaiting.filter(addr => addr !== device.address)

				if (!espConfig) return

				const esp = { ...device, config: espConfig }

				this.onESPConnect(esp)
			})
		})

		mdnsService.on("deviceDown", device => {
			if (this.clients.has(device.address)) {
				const esp = this.clients.get(device.address)!
				this.onESPDisconnect(esp)
			}
		})

		mdnsService.start()
		log("MDNS deamon started")
	}
}

/*
// Costruzione del pacchetto
		const packet = Buffer.alloc(5 + client.host.length + 1)

		// Message type: SET_CONFIG (1)
		packet[0] = 2

		// Device ID
		//packet[1] = client.config.id
		packet[1] = 1

		// Numero di LED
		packet[2] = client.config.num_leds

		// Porta (2 byte)
		packet.writeUInt16BE(client.config.port, 3)

		client.name = `genbs_led_${client.config.id}`
		// Hostname (stringa terminata da null)
		Buffer.from(client.name).copy(packet, 5)
		packet[5 + client.name.length] = 0 // Null terminator

		// Invia il pacchetto
		this.udpServer.send(packet, 0, packet.length, client.config.port, client.address, err => {
			if (err) {
				console.error("Errore durante l'invio del pacchetto:", err)
			} else {
				log("SET_CONFIG inviato con successo a", client.config.port, client.address)
			}
		})
*/
