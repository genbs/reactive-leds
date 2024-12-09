import mdns from "mdns"
import { MDNSClient } from "./stripeClient"
const browser = mdns.createBrowser(mdns.tcp("http"))

function start(
	onDeviceUp: (device: MDNSClient) => void,
	onDeviceDown: (device: MDNSClient) => void,
	onError?: (error: Error) => void
) {
	onError && browser.on("error", onError)

	browser.on("serviceUp", service => {
		const device: MDNSClient = {
			name: service.name || service.host,
			host: service.host,
			address: service.addresses[0],
			port: service.port,
		}

		onDeviceUp(device)
	})
	browser.on("serviceDown", service => {
		const device: MDNSClient = {
			name: service.name || service.host,
			host: service.host,
			address: service.addresses[0],
			port: service.port,
		}

		onDeviceDown(device)
	})

	browser.start()

	console.log("Netfinder started")
}

export default { start }
