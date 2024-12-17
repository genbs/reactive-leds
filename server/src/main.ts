import { EWSRequestByteType, logger } from "@shared"
import Bridge from "./bridge"

/////////////////

const bridge = new Bridge(8080)

logger.info("Starting bridge...")

bridge.on("stripeUpdate", stripe => {
	bridge.sendStripesToClients()

	//esp.blink()
})

bridge.on("clientConnect", ws => {
	logger.info(`Client Connected`)
	bridge.sendStripesToClients()
})

bridge.on("clientDisconnect", ws => {
	logger.info(`Client Disconnected`)
	bridge.sendStripesToClients()
})

bridge.on("clientRequest", async request => {
	logger.debug("Received request", request)

	if (isArray(request)) {
		const messageType = request[0]

		switch (messageType) {
			case EWSRequestByteType.SetLEDs: {
				const stripe = bridge.stripeService.byID(request[1])
				stripe && stripe.updateLEDs(request.slice(2))
				break
			}
			case EWSRequestByteType.Blink: {
				const stripe = bridge.stripeService.byID(request[1])
				if (stripe) stripe.device.blink()

				break
			}
		}
	} else {
		switch (request.type) {
			case "get_stripe":
				bridge.sendStripesToClients()
				break
			case "update_stripe":
				const stripe = bridge.stripeService.byID(request.id)
				logger.info("update_stripe", request.id, stripe)
				stripe && stripe.update(stripe)
				break
			case "find":
				logger.info("find", request.ip)
				bridge.stripeService.espService.find(request.ip)
				break
		}
	}
})

function isArray(value: any): value is Uint8Array {
	return value instanceof Uint8Array
}

bridge.start()

const mock = false
if (mock) {
}

//bridge.ESPService.find("192.168.1.142", 4210)
