import WebSocket from "ws"
import EventEmitter from "../../utils/EventEmitter"
import { log } from "../../utils/Log"

type WebSocketServiceEvents = {
	onClientConnect: (client: WebSocket) => void
	onClientDisconnect: (client: WebSocket) => void
	onMessage: (message: WebSocket.RawData, client: WebSocket) => void
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
				this.emit("onMessage", message, client)
			})
		})

		log(`WebSocket Server listening on port ${this.port}`)
	}

	/**
	 * Send message to specific client or all clients.
	 *
	 * @param data WebSocket.Data
	 * @param client optional
	 * @returns
	 */
	send(data: WebSocket.Data, client?: WebSocket) {
		if (client) return client.send(data)

		this.clients.forEach(client => {
			client.send(data)
		})
	}
}
