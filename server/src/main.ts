import NetService from "@services/Net"
import StripeService from "@services/StripeService"
import WebSocketService from "@services/WebSocketService"
import { EWSRequestByteType, logger } from "@shared"

/////////////////

async function main() {
	const netService = new NetService()
	const stripeService = new StripeService()
	const webSocketService = new WebSocketService(8080)

	netService.on("clients", clients => {
		webSocketService.send({
			event: "get_clients",
			data: clients,
		})
	})

	stripeService.on("onUpdate", () => {
		webSocketService.send({
			event: "get_stripes",
			data: stripeService.stripes.map(stripe => stripe.toJSON()),
		})
		stripeService.save()
	})

	webSocketService.on("onClientConnect", ws => {
		logger.debug(`Client Connected`)
		webSocketService.send({
			event: "get_stripes",
			data: stripeService.stripes.map(stripe => stripe.toJSON()),
		})
	})

	webSocketService.on("onClientDisconnect", ws => {
		logger.debug(`Client Disconnected`)
		webSocketService.send({
			event: "get_stripes",
			data: stripeService.stripes.map(stripe => stripe.toJSON()),
		})
	})

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
				case "get_stripes":
					webSocketService.send({
						event: "get_stripes",
						data: stripeService.stripes.map(stripe => stripe.toJSON()),
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
