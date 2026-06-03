// Connects to a WebSocket server and handles messages and reconnections. Used by the daemon worker to communicate with the server.

// Delay after closing the connection before trying to reconnect is 2 seconds * 5 retries = 10 seconds
const WS_RECONNECTION_TIMEOUT = 2000
const WS_RECONNECTION_MAX_RETRIES = 5

export interface WSSettings {
	debug?: boolean
	url: string // WebSocket URL
	autoConnect: boolean // Automatically connect on instantiation
	shouldReconnect: boolean | (() => boolean) // Reconnect on close

	onConnectionChange?: (connected: boolean) => void
	onMessage?: (args: any) => void | false
}

const defaultSettings: Partial<WSSettings> = {
	autoConnect: true, // Automatically connect on instantiation
	shouldReconnect: true, // Automatically reconnect on close
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
	 * If already connected, it will close the existing connection and create a new one.
	 */
	public connect() {
		this.settings.debug && console.log("[WS] Connecting to", this.settings.url)

		if (this.socket) {
			this.settings.debug && console.log("[WS] Warning: already connected, closing existing connection")
			this.socket.close()
		}

		const onOpen = (e: Event) => {
			this.settings.debug && console.log("[WS] Connection established", e)

			this.connected = true
			this.retries = 0

			this.settings.onConnectionChange?.(true)
		}

		const onMessage = (e: MessageEvent) => {
			if (e.data.length <= 0) return

			const data = new Uint8Array(e.data)
			this.settings.debug && console.log("[WS] Received", data)

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
		this.settings.debug && console.log("[WS] Closing connection")

		this.connected = false
		this.socket?.close()
	}

	public send(payload: string | Blob | BufferSource) {
		if (!this.socket) {
			this.settings.debug && console.log("[WS] Send error, not connected, can't send message")
			return
		}

		this.settings.debug && console.log("[WS] Sending", payload)
		this.socket.send(payload)
	}

	// Event listeners

	/** When the connection is closed, it will attempt to reconnect if the shouldReconnect setting is true. */
	private onSocketClose(e: CloseEvent | Event) {
		this.settings.debug && console.log("[WS] Connection closed", e)

		this.socket = null
		if (this.connected) {
			this.settings.onConnectionChange?.(false)
			this.connected = false
		}

		const shouldReconnect =
			typeof this.settings.shouldReconnect === "function"
				? this.settings.shouldReconnect()
				: this.settings.shouldReconnect

		if (shouldReconnect) {
			if (this.retries >= WS_RECONNECTION_MAX_RETRIES) {
				this.settings.debug && console.log("[WS] Max retries reached, not reconnecting")
				return
			}

			this.settings.debug && console.log(`[WS] Reconnecting in ${WS_RECONNECTION_TIMEOUT / 1000}s...`)
			this.retries++
			setTimeout(() => this.connect(), WS_RECONNECTION_TIMEOUT)
		}
	}
}
