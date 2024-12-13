import BonjourService, { BonjourClient } from "@services/Bonjur"
import EventEmitter from "@utils/EventEmitter"

import { ESPClient } from "./ESPClient"

import proto from "@protocol"
import { log } from "@utils/Log"

type ESPServiceEvents = {
	espConnect: (client: ESPClient) => void
	espDisconnect: (client: ESPClient) => void
}

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

			if (await ESPService.findDeviceUDPPort(device.address, 4200, 4300)) {
				this.createClient(device)
			}
		})

		this.bonjourService.on("deviceDown", device => {
			if (!this.clients.has(device.address)) return

			const esp = this.clients.get(device.address)!
			this.onESPDisconnect(esp)
		})

		log("ESPService started")
	}

	private onESPConnect(client: ESPClient) {
		if (!this.clients.has(client.address)) {
			this.clients.set(client.address, client)
			this.emit("espConnect", client)
		}
	}

	private onESPDisconnect(client: ESPClient) {
		if (this.clients.has(client.address)) {
			//this.clients.delete(client.address) // prevent removing client from map for reconnection
			this.emit("espDisconnect", client)
		} else {
			client.destroy()
		}
	}

	private createClient(device: BonjourClient) {
		const client = new ESPClient(device.name, device.address, device.host)
		client.on("onConnect", () => this.onESPConnect(client))
		client.on("onDisconnect", () => this.onESPDisconnect(client))
		return client
	}

	static async findDeviceUDPPort(address: string, startPort: number, endPort: number): Promise<boolean> {
		for (let port = startPort; port <= endPort; port++) if (await proto.ping(address, port)) return true

		return false
	}

	// async find(address: string, port?: number) {
	// 	const device = this.mdnsService.findByAddress(address)
	// 	if (!device) return null

	// 	if (this.clients.has(address)) {
	// 		return this.clients.get(address)
	// 	}

	// 	const config = await ESPService.findDeviceUDPPort(address, port || 4200, port || 4300)
	// 	if (!config) return null

	// 	return this.createClient(device, config)
	// }
}
