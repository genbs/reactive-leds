import ConfigService from "@services/Config"
import NetService from "@services/Net"
import StripeService from "@services/StripeService"
import WebSocketService from "@services/WebSocketService"
import { EWSRequestByteType, logger } from "@shared"

/////////////////

async function main() {
	const config = new ConfigService()
	const netService = new NetService()
	const stripeService = new StripeService(config)
	const webSocketService = new WebSocketService(8080)

	// send devices finded on network and send to client
	netService.on("clients", clients => {
		webSocketService.send({
			event: "get_clients",
			data: clients,
		})
	})

	// when stripe is updated, send to client
	stripeService.on("onUpdate", () => {
		// config was updated before starting onUpdate event

		webSocketService.send({
			event: "get_config",
			data: config.get(),
		})
	})

	// when client connect, send stripes and netclient to client
	webSocketService.on("onClientConnect", ws => {
		logger.debug(`Client Connected`)

		webSocketService.send({
			event: "get_config",
			data: config.get(),
		})
		webSocketService.send({
			event: "get_clients",
			data: netService.getClients(),
		})
	})

	webSocketService.on("onClientDisconnect", ws => {
		logger.debug(`Client Disconnected`)
	})

	// manage messages from client
	webSocketService.on("onMessage", (request, ws) => {
		if (isArray(request)) {
			const messageType = request[0]
			switch (messageType) {
				case EWSRequestByteType.SetLEDs: {
					const stripe = stripeService.byID(request[1])
					stripe && stripe.updateLEDs(request.slice(2))
					break
				}
				case EWSRequestByteType.Blink: {
					const stripe = stripeService.byID(request[1])
					if (stripe) stripe.device.blink()
					break
				}
			}
		} else {
			switch (request.type) {
				case "get_clients":
					webSocketService.send({
						event: "get_clients",
						data: netService.getClients(),
					})
				case "get_config":
					webSocketService.send({
						event: "get_config",
						data: config.get(),
					})
					break
				case "update_stripe":
					const stripe = stripeService.byIP(request.ip)
					if (stripe) {
						stripe.update(request.data)
					}
					break
				case "connect":
					logger.info("connect", request.ip)
					stripeService.espService.connect(request.ip)
					break
				case "delete_stripe":
					logger.info("delete_stripe", request.ip)
					stripeService.delete(request.ip)
					break
			}
		}
	})

	stripeService.start()
	webSocketService.start()
	netService.start()
}

main()

function isArray(value: any): value is Uint8Array {
	return value instanceof Uint8Array
}
