const WS_RECONNECTION_TIMEOUT = 5000
const WS_RECONNECTION_MAX_RETRIES = 5

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
		this.log("Connecting to", this.settings.url)

		if (this.socket) {
			this.log("Warning: already connected, closing existing connection")
			this.socket.close()
		}

		const onOpen = (e: Event) => {
			this.log("Connection established", e)

			this.connected = true
			this.retries = 0

			this.settings.onConnectionChange?.(true)
		}

		const onMessage = (e: MessageEvent) => {
			if (e.data.length <= 0) return

			const data = new Uint8Array(e.data)
			this.log("Received", data)

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
		this.log("Gracefully closing")
		this.connected = false
		this.socket?.close()
	}

	public send(payload) {
		if (!this.socket) {
			this.log("Error: not connected, can't send message")
			return
		}

		this.log("Sending", payload)

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
		this.log("Connection closed", e)

		this.settings.onConnectionChange?.(false)

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
