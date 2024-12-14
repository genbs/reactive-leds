import { EventEmitter, logger, TWSRequest, TWSResponse } from "@shared"
import WebSocket from "ws"

type WebSocketServiceEvents = {
	onClientConnect: (client: WebSocket) => void
	onClientDisconnect: (client: WebSocket) => void
	onMessage: (message: TWSRequest, client: WebSocket) => void
}

export default class WebSocketService extends EventEmitter<WebSocketServiceEvents> {
	private server: WebSocket.Server
	public clients = new Set<WebSocket>()

	private port: number

	constructor(port: number) {
		super()

		this.port = port
	}

	/**
	 * Listen on port for WebSocket connections.
	 * @param
	 */
	start() {
		this.server = new WebSocket.Server({ port: this.port })

		this.server.on("connection", client => {
			this.clients.add(client)
			this.emit("onClientConnect", client)

			client.on("close", () => {
				this.clients.delete(client)
				this.emit("onClientDisconnect", client)
			})

			client.on("message", message => {
				if (typeof message === "string") {
					message = JSON.parse(message)
				}
				this.emit("onMessage", message as unknown as TWSRequest, client)
			})
		})

		logger.info(`WebSocket Server listening on port ${this.port}`)
	}

	/**
	 * Send message to specific client or all clients.
	 *
	 * @param data WebSocket.Data
	 * @param client optional
	 * @returns
	 */
	send(data: TWSResponse, client?: WebSocket) {
		logger.debug("[WebSocketService] Sending message", data)
		const message: string | Uint8Array = data instanceof Uint8Array ? data : JSON.stringify(data)

		if (client) return client.send(message)

		this.clients.forEach(client => {
			client.send(message)
		})
	}
}
