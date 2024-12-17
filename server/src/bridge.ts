import StripeService from "@services/StripeService"
import Stripe from "@services/StripeService/Stripe"
import WebSocketService from "@services/WebSocketService"

import { EventEmitter, TWSRequest } from "@shared"
import WebSocket from "ws"

type BridgeEvents = {
	stripeUpdate: (stripe: Stripe) => void
	clientConnect: (client: WebSocket) => void
	clientDisconnect: (client: WebSocket) => void
	clientRequest: (request: TWSRequest, client: WebSocket) => void
}

/**
 * Comunication between the web client and the ESP devices.
 */
class Bridge extends EventEmitter<BridgeEvents> {
	public stripeService: StripeService
	public WebSocketService: WebSocketService

	constructor(wsPort: number) {
		super()

		this.stripeService = new StripeService()
		this.WebSocketService = new WebSocketService(wsPort)
	}

	/**
	 * Start the services.
	 */
	start() {
		this.stripeService.on("onUpdate", stripe => {
			this.emit("stripeUpdate", stripe)
		})

		this.WebSocketService.on("onClientConnect", ws => {
			this.emit("clientConnect", ws)
		})

		this.WebSocketService.on("onClientDisconnect", ws => {
			this.emit("clientDisconnect", ws)
		})

		this.WebSocketService.on("onMessage", (message, ws) => {
			this.emit("clientRequest", message, ws)
		})

		this.stripeService.start()
		this.WebSocketService.start()
	}

	sendStripesToClients() {
		this.WebSocketService.send({
			event: "get_stripe",
			data: this.stripeService.stripes.map(stripe => stripe.toJSON()),
		})
	}
}

export default Bridge
