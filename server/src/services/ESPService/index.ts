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
				this.createClient(device.address, port, device.name, device.host)
			}
		})

		this.bonjourService.on("deviceDown", device => {
			if (!this.clients.has(device.address)) return

			const esp = this.clients.get(device.address)!
			this.onESPDisconnect(esp)
		})

		logger.info("ESPService started")
	}

	// used for mock
	add(client: ESPClient) {
		this.onESPConnect(client)
	}

	private onESPConnect(client: ESPClient) {
		console.log("espCLientCOnnect")
		//if (!this.clients.has(client.address)) {
		this.clients.set(client.address, client)
		//this.addressIDMap.set(client.address, client.id)

		this.emit("espConnect", client)
		//}
	}

	private onESPDisconnect(client: ESPClient) {
		if (this.clients.has(client.address)) {
			//this.clients.delete(client.address) // prevent removing client from map for reconnection
			this.emit("espDisconnect", client)
		} else {
			client.destroy()
		}
	}

	private createClient(address: string, port: number, name?: string, host?: string) {
		const client = new ESPClient(address, port, name, host)
		client.on("onConnect", () => this.onESPConnect(client))
		client.on("onDisconnect", () => this.onESPDisconnect(client))
		return client
	}

	public get(id: ESPClient["id"]) {
		// TBD, da cambiare
		return [...this.clients.values()].find(client => client.id === id)
	}

	static async findDeviceUDPPort(
		address: string,
		startPort: number = PORT_START,
		endPort: number = PORT_END
	): Promise<number> {
		for (let port = startPort; port <= endPort; port++) {
			if (await proto.ping(address, port)) {
				return port
			}
		}

		return 0
	}

	async find(address: string, port?: number) {
		// const device = this.bonjourService.findByAddress(address)
		// console.log(`ESPService: device ${address}, not found`)
		// if (!device) return null

		if (this.clients.has(address)) {
			return this.clients.get(address)
		}

		const openPort = await ESPService.findDeviceUDPPort(address, port, port)
		if (!openPort) return

		return this.createClient(address, openPort, address, address)
	}
}
