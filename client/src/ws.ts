import { logger } from "@shared"

// Delay after closing the connection before trying to reconnect is 2 seconds * 30 retries = 60 seconds
const WS_RECONNECTION_TIMEOUT = 2000
const WS_RECONNECTION_MAX_RETRIES = 30

export interface WSSettings {
	url: string // WebSocket URL
	debug: boolean // Enable debug logs
	autoConnect: boolean // Automatically connect on instantiation
	shouldReconnect: boolean | (() => boolean) // Reconnect on close

	onConnectionChange?: (connected: boolean) => void
	onMessage?: (args: any) => void | false
}

const defaultSettings: Partial<WSSettings> = {
	debug: false,
	autoConnect: true,
	shouldReconnect: true,
}

export default class WS {
	private retries = 0
	public settings: WSSettings
	public connected: boolean
	private socket!: WebSocket | null

	constructor(settings: Partial<WSSettings> = {}) {
		this.settings = { ...defaultSettings, ...settings } as WSSettings

		if (this.settings.autoConnect) this.connect()
		else this.socket = null

		this.connected = false
	}

	/**
	 * Connects to the WebSocket server.
	 */
	public connect() {
		logger.info("Connecting to", this.settings.url)

		if (this.socket) {
			logger.warn("Warning: already connected, closing existing connection")
			this.socket.close()
		}

		const onOpen = (e: Event) => {
			logger.info("Connection established", e)

			this.connected = true
			this.retries = 0

			this.settings.onConnectionChange?.(true)
		}

		const onMessage = (e: MessageEvent) => {
			if (e.data.length <= 0) return

			const data = new Uint8Array(e.data)
			logger.debug("Received", data)

			this.settings.onMessage?.(data)
		}

		this.socket = new WebSocket(this.settings.url)
		this.socket.binaryType = "arraybuffer"
		this.socket.addEventListener("open", onOpen)
		this.socket.addEventListener("message", onMessage)
		this.socket.addEventListener("close", e => {
			this.onSocketClose(e)

			this.socket?.removeEventListener("open", onOpen)
			this.socket?.removeEventListener("message", onMessage)
		})
	}

	public close() {
		logger.info("Gracefully closing")
		this.connected = false
		this.socket?.close()
	}

	public send(payload) {
		if (!this.socket) {
			logger.warn("Error: not connected, can't send message")
			return
		}

		logger.debug("Sending", payload)

		this.socket.send(payload)
	}

	// Event listeners

	/**
	 * When the connection is closed, it will attempt to reconnect if the shouldReconnect setting is true.
	 *
	 * @param e
	 * @returns
	 */
	private onSocketClose(e: CloseEvent) {
		logger.info("Connection closed", e)

		this.settings.onConnectionChange?.(false)

		const shouldReconnect =
			typeof this.settings.shouldReconnect === "function"
				? this.settings.shouldReconnect()
				: this.settings.shouldReconnect

		if (shouldReconnect) {
			if (this.retries >= WS_RECONNECTION_MAX_RETRIES) {
				logger.info("Max retries reached, not reconnecting")
				return
			}

			logger.info(`Reconnecting in ${WS_RECONNECTION_TIMEOUT / 1000}s...`)
			this.retries++
			setTimeout(() => this.connect(), WS_RECONNECTION_TIMEOUT)
		}
	}
}
