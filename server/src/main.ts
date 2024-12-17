import StripeService from "@services/StripeService"
import WebSocketService from "@services/WebSocketService"
import { EWSRequestByteType, logger } from "@shared"

/////////////////

const stripeService = new StripeService()
const webSocketService = new WebSocketService(8080)

stripeService.on("onUpdate", () => {
	sendStripesToClients()

	//esp.blink()
})

webSocketService.on("onClientConnect", ws => {
	logger.info(`Client Connected`)
	sendStripesToClients()
})

webSocketService.on("onClientDisconnect", ws => {
	logger.info(`Client Disconnected`)
	sendStripesToClients()
})

webSocketService.on("onMessage", (request, ws) => {
	logger.debug("Received request", request)

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
				const stripe = stripeService.byID(request.id)
				logger.info("update_stripe", request.id, stripe)
				stripe && stripe.update(stripe)
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

const mock = false
if (mock) {
}

//bridge.ESPService.find("192.168.1.142", 4210)
