import ESPService from "@services/ESPService"
import { ESPClient } from "@services/ESPService/ESPClient"
import WebSocketService from "@services/WebSocketService"

import { EventEmitter, TWSRequest } from "@shared"
import WebSocket from "ws"

type BridgeEvents = {
	espConnect: (client: ESPClient) => void
	espDisconnect: (client: ESPClient) => void
	clientConnect: (client: WebSocket) => void
	clientDisconnect: (client: WebSocket) => void
	clientRequest: (request: TWSRequest, client: WebSocket) => void
}

/**
 * Comunication between the web client and the ESP devices.
 */
class Bridge extends EventEmitter<BridgeEvents> {
	public ESPService: ESPService
	public WebSocketService: WebSocketService

	constructor(wsPort: number) {
		super()

		this.ESPService = new ESPService()
		this.WebSocketService = new WebSocketService(wsPort)
	}

	/**
	 * Start the services.
	 */
	start() {
		this.ESPService.on("espConnect", esp => {
			this.emit("espConnect", esp)
		})

		this.ESPService.on("espDisconnect", esp => {
			this.emit("espDisconnect", esp)
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

		this.ESPService.start()
		this.WebSocketService.start()
	}

	sendStripesToClients() {
		this.WebSocketService.send({
			event: "get_stripe",
			data: [...this.ESPService.clients.values()].map(client => client.toObject()),
		})
	}
}

export default Bridge
