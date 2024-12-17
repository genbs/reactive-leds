import BonjourService from "@services/Bonjur"
import { EventEmitter, logger } from "@shared"

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
				this.add(device.address, port, device.host)
			}
		})

		logger.info("ESPService started")
	}

	public add(address: string, port: number, host?: string) {
		if (this.clients.has(address)) return this.clients.get(address)

		const client = new ESPClient(address, port, host)
		client.on("onConnect", () => this.emit("espConnect", client))
		client.on("onDisconnect", () => this.emit("espDisconnect", client))
		this.clients.set(address, client)
		return client
	}

	public get(id: ESPClient["id"]) {
		return this.clients.values().find(client => client.id === id)
	}

	async find(address: string, port?: number) {
		if (this.clients.has(address)) {
			const client = this.clients.get(address)!
			if (await client.ping()) return client
		}

		const openPort = await ESPService.findDeviceUDPPort(address, port, port)
		if (!openPort) {
			logger.debug(`No open port found for ${address}`)
			return
		}

		return this.add(address, openPort, address)
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
