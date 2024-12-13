import mdns from "mdns"
import EventEmitter from "../EventEmitter"

export type MDNSClient = {
	name: string
	address: string
	host: string
}

type MDNSServiceEvents = {
	deviceUp: (device: MDNSClient) => void
	deviceDown: (device: MDNSClient) => void
}

export default class MDNSService extends EventEmitter<MDNSServiceEvents> {
	constructor() {
		super()

		this.start()
	}

	start() {
		const browser = mdns.createBrowser(mdns.tcp("http"))

		browser.on("error", console.log)
		browser.on("serviceUp", service => {
			const device = this.serviceToClient(service)
			if (device) this.emit("deviceUp", device)
		})
		browser.on("serviceDown", service => {
			const device = this.serviceToClient(service)
			if (device) this.emit("deviceDown", device)
		})

		browser.start()
	}

	private serviceToClient(service: mdns.Service): MDNSClient | void {
		if (!service.host || !service.addresses || !service.addresses[0]) return

		return {
			name: service.name || service.host,
			host: service.host,
			address: service.addresses[0],
		}
	}
}
