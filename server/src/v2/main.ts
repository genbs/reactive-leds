import proto from "@protocol"
import { EWSRequestByteType, TNetClient } from "@shared"
import BonjourService, { TBonjourClient } from "./Bonjur"
import ConfigService from "./Config"
import NetService from "./Net"
import { Stripe } from "./Stripe"
import WebSocketService from "./WebSocket"

async function main() {
	const stripes: Stripe[] = []
	const config = new ConfigService()

	const bonjour = new BonjourService()
	const netService = new NetService()
	const wss = new WebSocketService(4200)

	// Load from config
	const stripesConfig = config.get().stripes

	for (const stripe of stripesConfig) {
		const newStripe = new Stripe(stripe)

		if (await newStripe.connect()) {
			stripes.push(newStripe)
		}
	}
	console.log(`Loaded ${stripes.length} from config`)

	// utility functions
	function findStripe(ipOrId: string | number) {
		return stripes.find(stripe => stripe.address === ipOrId || stripe.id === ipOrId)
	}

	async function addStripeIfNotExist(device: TNetClient | TBonjourClient) {
		const stripe = findStripe(device.address)
		if (stripe || ("vendor" in device && !device.vendor.toLocaleLowerCase().includes("espressif"))) return false

		const port = await findDeviceUDPPort(device.address)
		if (!port) {
			console.log(`No open port found for ${device.address}`)
			return false
		}
		console.log(`Find new device on network: ${device.address}, try to connect`)
		const newStripe = new Stripe({
			address: device.address,
			port,
			hostname: device.hostname,
		})
		if (await newStripe.connect()) {
			console.log(`Connected to ${device.address}`)
			addStripe(newStripe)
			return true
		} else {
			console.log(`Can't connect to ${device.address}`)
		}
	}

	function addStripe(stripe: Stripe) {
		stripes.push(stripe)

		config.update({
			stripes: stripes.map(s => s.toObject()),
		})

		wss.send({
			event: "get_config",
			data: config.get(),
		})
	}

	function deleteStripe(stripe: Stripe) {
		stripes.splice(stripes.indexOf(stripe), 1)

		config.update({
			stripes: stripes.map(s => s.toObject()),
		})

		wss.send({
			event: "get_config",
			data: config.get(),
		})
	}

	function isArray(value: any): value is Uint8Array {
		return value instanceof Uint8Array
	}

	// Find device on network and try to connect
	bonjour.on("deviceUp", async device => {
		console.log("deviceUp", device)

		addStripeIfNotExist(device)
	})

	netService.on("clients", async clients => {
		console.log("clients", clients)

		for (const client of clients) {
			addStripeIfNotExist(client)
		}
		// send devices finded on network for manual connect
		wss.send({
			event: "get_clients",
			data: clients,
		})
	})

	// when client connect, send stripes and netclient to client
	wss.on("onClientConnect", ws => {
		console.log("Client Connected")
	})

	// handle client messages
	wss.on("onMessage", async (request, ws) => {
		if (isArray(request)) {
			const messageType = request[0]
			switch (messageType) {
				case EWSRequestByteType.SetLEDs: {
					const stripe = findStripe(request[1])
					stripe && stripe.setLEDs(request.slice(2))
					break
				}
				case EWSRequestByteType.Blink: {
					const stripe = findStripe(request[1])
					if (stripe) stripe.blink()
					break
				}
			}
		} else {
			switch (request.type) {
				case "get_clients":
					wss.send({
						event: "get_clients",
						data: netService.getClients(),
					})
					break
				case "get_config":
					wss.send({
						event: "get_config",
						data: config.get(),
					})
					break
				case "set_config": {
					const newConfig = request.data
					config.update(newConfig)

					if (newConfig.stripes) {
						newConfig.stripes.forEach(newStripe => {
							const stripe = findStripe(newStripe.id)
							if (stripe) stripe.update(stripe)
						})
					}

					wss.send({
						event: "get_config",
						data: config.get(),
					})

					break
				}
				case "update_stripe": {
					const stripe = findStripe(request.ip)
					if (stripe) stripe.update(request.data)
					break
				}
				case "connect": {
					const netClient = netService.getClients().find(client => client.address === request.ip)
					if (netClient) addStripeIfNotExist(netClient)

					break
				}
				case "delete_stripe": {
					console.log("delete_stripe", request.ip)
					const stripe = findStripe(request.ip)
					if (stripe) deleteStripe(stripe)

					break
				}
			}
		}
	})

	netService.start()
	wss.start()
}

main()

const PORT_START = 4200
const PORT_END = 4220
async function findDeviceUDPPort(
	address: string,
	startPort: number = PORT_START,
	endPort: number = PORT_END
): Promise<number> {
	for (let port = startPort; port <= endPort; port++) if (await proto.ping(address, port)) return port

	return 0
}
