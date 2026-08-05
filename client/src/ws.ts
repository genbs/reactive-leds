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
	private retryTimer: ReturnType<typeof setTimeout> | null = null
	public settings: WSSettings
	public connected: boolean
	private socket!: WebSocket | null
	private socketURL: string | null = null

	constructor(settings: Partial<WSSettings> = {}) {
		this.settings = { ...defaultSettings, ...settings } as WSSettings

		if (this.settings.autoConnect) this.connect()
		else this.socket = null

		this.connected = false
	}

	/**
	 * Connects to the WebSocket server.
	 * Reuses an open connection to the same URL. A different URL replaces it.
	 */
	public connect() {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer)
			this.retryTimer = null
			this.retries = 0
		}

		this.settings.debug && console.log("[WS] Connecting to", this.settings.url)

		if (
			this.socket &&
			this.connected &&
			this.socket.readyState === WebSocket.OPEN &&
			this.socketURL === this.settings.url
		) {
			this.settings.debug && console.log("[WS] Already connected to", this.settings.url)
			this.settings.onConnectionChange?.(true)
			return
		}

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
			if (e.data.byteLength <= 0) return

			const data = new Uint8Array(e.data)
			this.settings.debug && console.log("[WS] Received", data)

			this.settings.onMessage?.(data)
		}

		let socket: WebSocket
		try {
			socket = new WebSocket(this.settings.url)
		} catch {
			this.settings.onConnectionChange?.(false)
			return
		}

		this.socket = socket
		this.socketURL = this.settings.url
		socket.binaryType = "arraybuffer"
		socket.addEventListener("open", onOpen)
		socket.addEventListener("message", onMessage)
		socket.addEventListener("close", e => {
			socket.removeEventListener("open", onOpen)
			socket.removeEventListener("message", onMessage)

			// A replaced socket (connect() called while connected) fires its own
			// close later; only the current socket may reset state and reconnect.
			if (this.socket === socket) this.onSocketClose(e)
		})
	}

	public close() {
		this.settings.debug && console.log("[WS] Closing connection")

		if (this.retryTimer)
			clearTimeout(this.retryTimer)

		this.retryTimer = null
		this.retries = 0
		this.connected = false
		this.socket?.close()
	}

	public send(payload: string | Blob | BufferSource) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
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
		this.socketURL = null
		// Always notify, even if the connection never opened: a pending Connect
		// request in the worker is resolved by this event — without it, a failed
		// first connect would leave begin() hanging forever. Duplicate `false`
		// events during reconnect retries are deduped client-side (proxy.ts).
		this.settings.onConnectionChange?.(false)
		this.connected = false

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
			this.retryTimer = setTimeout(() => {
				this.retryTimer = null
				this.connect()
			}, WS_RECONNECTION_TIMEOUT)
		}
	}
}
