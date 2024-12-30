import StripeService from "@services/StripeService"
import WebSocketService from "@services/WebSocketService"
import { EWSRequestByteType, logger } from "@shared"

/////////////////

const stripeService = new StripeService()
const webSocketService = new WebSocketService(8080)

stripeService.on("onUpdate", () => {
	sendStripesToClients()

	stripeService.save()
})

webSocketService.on("onClientConnect", ws => {
	logger.debug(`Client Connected`)
	sendStripesToClients()
})

webSocketService.on("onClientDisconnect", ws => {
	logger.debug(`Client Disconnected`)
	sendStripesToClients()
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
			case "get_stripe":
				sendStripesToClients()
				break
			case "update_stripe":
				const stripe = stripeService.byIP(request.ip)
				if (stripe) {
					stripe.update(request.data)
				}
				break
			case "find":
				logger.info("find", request.ip)
				stripeService.espService.find(request.ip)
				break
		}
	}
})

function isArray(value: any): value is Uint8Array {
	return value instanceof Uint8Array
}

stripeService.start()
webSocketService.start()

function sendStripesToClients() {
	webSocketService.send({
		event: "get_stripe",
		data: stripeService.stripes.map(stripe => stripe.toJSON()),
	})
}
