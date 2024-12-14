import { EventEmitter } from "@shared"
import Bonjour, { RemoteService } from "bonjour"

export type BonjourClient = {
	name: string
	address: string
	host: string
}

type BonjourServiceEvents = {
	deviceUp: (device: BonjourClient) => void
	deviceDown: (device: BonjourClient) => void
}

export default class BonjourService extends EventEmitter<BonjourServiceEvents> {
	private devices = new Map<string, BonjourClient>()

	constructor() {
		super()

		const browser = Bonjour().find({ type: "http" })

		browser.on("up", service => {
			const device = this.serviceToClient(service)
			if (!device || this.devices.has(device.address)) return

			this.devices.set(device.address, device)
			this.emit("deviceUp", device)
		})

		browser.on("down", service => {
			const device = this.serviceToClient(service)
			if (!device || !this.devices.has(device.address)) return

			this.devices.delete(device.address)
			this.emit("deviceDown", device)
		})

		browser.start()
	}

	on<K extends keyof BonjourServiceEvents>(event: K, listener: BonjourServiceEvents[K]): () => void {
		if (event === "deviceUp") for (const device of this.devices.values()) listener(device)

		return super.on(event, listener)
	}

	findByAddress(address: string): BonjourClient | void {
		return this.devices.get(address)
	}

	findByHostname(hostname: string): BonjourClient | void {
		return [...this.devices.values()].find(device => device.host === hostname)
	}

	private serviceToClient(service: RemoteService): BonjourClient | void {
		if (!service.host || !service.addresses || !service.addresses[0]) return

		return {
			name: service.name || service.host,
			host: service.host,
			address: service.addresses[0],
		}
	}
}
