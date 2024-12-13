const WS_RECONNECTION_TIMEOUT = 5000
const WS_RECONNECTION_MAX_RETRIES = 5

export interface WSSettings {
	url: string // WebSocket URL
	debug: boolean // Enable debug logs
	autoConnect: boolean // Automatically connect on instantiation
	shouldReconnect: boolean | (() => boolean) // Reconnect on close
	onConnect?: () => void // Callback on connection
	onDisconnect?: () => void // Callback on disconnection
}

const defaultSettings: Partial<WSSettings> = {
	debug: false,
	autoConnect: true,
	shouldReconnect: true,
}

class WS<TSignal = unknown, TCommand extends object = any> {
	private retries = 0
	public settings: WSSettings
	public connected: boolean
	private socket!: WebSocket | null
	private events = [] as ((data: TSignal) => void)[]

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

		function onOpen(e: Event) {
			this.log("Connection established", e)
			if (this.settings.onConnect) this.settings.onConnect()
			this.connected = true
			this.retries = 0
		}

		function onMessage(e: MessageEvent) {
			if (typeof e.data !== "string" || e.data.length === 0) return

			//const data = JSON.parse(e.data)
			const data = e.data
			this.log("Received", e.data.length, data)

			this.events.forEach(cb => {
				const result = cb(data)
				if (typeof result === "boolean" && result === false) this.events.splice(this.events.indexOf(cb), 1)
			})
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

	public send(data: TCommand) {
		this.log("Sending", data)

		if (!this.socket) {
			this.log("Error: not connected, can't send message")
			return
		}

		this.socket.send(JSON.stringify(data))
	}

	// Event listeners

	/**
	 * NOTE: If the callback returns false, it will be removed from the listeners (util for once listeners).
	 *
	 * @param callback
	 * @returns
	 */
	public onMessage(callback: (args: TSignal) => void | false) {
		this.events.push(callback)

		return () => {
			this.events = this.events.filter(cb => cb !== callback)
		}
	}

	/**
	 * When the connection is closed, it will attempt to reconnect if the shouldReconnect setting is true.
	 *
	 * @param e
	 * @returns
	 */
	private onSocketClose(e: CloseEvent) {
		this.log("Connection closed", e)

		if (this.settings.onDisconnect) this.settings.onDisconnect()

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
	private log(...args: (string | object | number)[]) {
		if (!this.settings.debug) return

		console.log("[WS]", ...args)
	}
}

export default WS
