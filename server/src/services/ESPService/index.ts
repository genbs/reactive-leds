import BonjourService from "@services/Bonjur"
import { EventEmitter, logger, TESP } from "@shared"

import { ESPClient } from "./ESPClient"

import proto from "@protocol"

type ESPServiceEvents = {
	espConnect: (client: ESPClient) => void
	espDisconnect: (client: ESPClient) => void
}

const PORT_START = 4200
const PORT_END = 4220

export default class ESPService extends EventEmitter<ESPServiceEvents> {
	public clients = new Map<ESPClient["address"], ESPClient>()
	private bonjourService: BonjourService = new BonjourService()

	/**
	 * Find ESP devices.
	 * Scan all device on the network and check if they have open UDP ports,
	 * if they do, do a handshake to get the device configuration.
	 */
	start() {
		this.bonjourService.on("deviceUp", async device => {
			if (this.clients.has(device.address)) return

			const port = await ESPService.findDeviceUDPPort(device.address)
			if (port) {
				this.add({
					address: device.address,
					port,
					hostname: device.name,
				})
			}
		})

		logger.info("ESPService started")
	}

	public add(esp: Partial<TESP> & { address: TESP["address"] }) {
		if (this.clients.has(esp.address)) return this.clients.get(esp.address)

		const client = new ESPClient(esp)
		client.on("onConnect", () => this.emit("espConnect", client))
		client.on("onDisconnect", () => this.emit("espDisconnect", client))
		this.clients.set(esp.address, client)

		return client
	}

	async connect(address: string, port?: number) {
		if (this.clients.has(address)) {
			const client = this.clients.get(address)!
			if (await client.ping()) return client
		}

		const openPort = await ESPService.findDeviceUDPPort(address, port, port)
		if (!openPort) {
			logger.debug(`No open port found for ${address}`)
			return
		}

		return this.add({
			address,
			port: openPort,
			hostname: address,
		})
	}

	static async findDeviceUDPPort(
		address: string,
		startPort: number = PORT_START,
		endPort: number = PORT_END
	): Promise<number> {
		for (let port = startPort; port <= endPort; port++) if (await proto.ping(address, port)) return port

		return 0
	}
}
