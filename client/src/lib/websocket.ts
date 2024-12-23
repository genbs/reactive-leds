import { EventEmitter, EWSPayloadType, TWSRequest, TWSResponse } from "@shared"

const WS_RECONNECTION_TIMEOUT = 5000
const WS_RECONNECTION_MAX_RETRIES = 5

type WSEvents<T> = {
	connectionChange?: (connected: boolean) => void
	message?: (args: T) => void | false
}

export interface WSSettings {
	url: string // WebSocket URL
	debug: boolean // Enable debug logs
	autoConnect: boolean // Automatically connect on instantiation
	shouldReconnect: boolean | (() => boolean) // Reconnect on close
}

const defaultSettings: Partial<WSSettings> = {
	debug: false,
	autoConnect: true,
	shouldReconnect: true,
}

export default class WS extends EventEmitter<WSEvents<TWSResponse>> {
	private retries = 0
	public settings: WSSettings
	public connected: boolean
	private socket!: WebSocket | null

	constructor(settings: Partial<WSSettings> = {}) {
		super()

		this.settings = { ...defaultSettings, ...settings } as WSSettings

		if (this.settings.autoConnect) this.connect()
		else this.socket = null

		this.connected = false
	}

	/**
	 * Connects to the WebSocket server.
	 */
	public connect() {
		this.log("Connecting to", this.settings.url)

		if (this.socket) {
			this.log("Warning: already connected, closing existing connection")
			this.socket.close()
		}

		const onOpen = (e: Event) => {
			this.log("Connection established", e)

			this.connected = true
			this.retries = 0

			this.emit("connectionChange", true)
		}

		const onMessage = (e: MessageEvent) => {
			if (e.data.length <= 0) return

			const data = e.data
			this.log("Received", e.data.length, data)

			this.emit("message", data)
		}

		this.socket = new WebSocket(this.settings.url)
		this.socket.addEventListener("open", onOpen)
		this.socket.addEventListener("message", onMessage)
		this.socket.addEventListener("close", e => {
			this.onSocketClose(e)

			this.socket?.removeEventListener("open", onOpen)
			this.socket?.removeEventListener("message", onMessage)
		})
	}

	public close() {
		this.log("Gracefully closing")
		this.connected = false
		this.socket?.close()
	}

	public send(payload: TWSRequest) {
		if (!this.socket) {
			this.log("Error: not connected, can't send message")
			return
		}

		this.log("Sending", payload)
		const isBinary = payload instanceof Uint8Array
		const payloadArray = isBinary ? new Uint8Array(payload) : new TextEncoder().encode(JSON.stringify(payload))

		const message = new Uint8Array(1 + payloadArray.length)
		message[0] = isBinary ? EWSPayloadType.Binary : EWSPayloadType.JSON
		message.set(payloadArray, 1)

		this.socket.send(message)
	}

	// Event listeners

	/**
	 * When the connection is closed, it will attempt to reconnect if the shouldReconnect setting is true.
	 *
	 * @param e
	 * @returns
	 */
	private onSocketClose(e: CloseEvent) {
		this.log("Connection closed", e)

		this.emit("connectionChange", false)

		const shouldReconnect =
			typeof this.settings.shouldReconnect === "function"
				? this.settings.shouldReconnect()
				: this.settings.shouldReconnect

		if (shouldReconnect) {
			if (this.retries >= WS_RECONNECTION_MAX_RETRIES) {
				this.log("Max retries reached, not reconnecting")
				return
			}

			this.log(`Reconnecting in ${WS_RECONNECTION_TIMEOUT / 1000}s...`)
			this.retries++
			setTimeout(() => this.connect(), WS_RECONNECTION_TIMEOUT)
		}
	}

	// Logging
	// TODO: replace with a proper logger or global logger with global debug flag
	private log(...args: any[]) {
		if (!this.settings.debug) return

		console.log("[WS]", ...args)
	}
}
