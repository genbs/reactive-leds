import {
	bufferToConfig,
	bufferToStatus,
	Config,
	configToBuffer,
	decodeBuffer,
	EMPTY_PACKET_ID,
	Packet,
	PacketID,
	PacketStatus,
	PacketType,
	PacketTypeMap,
	Status,
} from "@reactive-leds/shared"
import dgram from "dgram"
import { DEBUG } from "./utils"

class Protocol {
	static PING_TIMEOUT = 1000
	static GET_CONFIG_TIMEOUT = 3000
	static SET_CONFIG_TIMEOUT = 3000
	static GET_VERSION_TIMEOUT = 1000
	static GET_STATUS_TIMEOUT = 2000

	private socket?: dgram.Socket
	private requestID: PacketID = 1
	private pendingRequests = new Map<
		number,
		{
			resolve: (data: Packet | null) => void
			type: PacketType
			timeout: NodeJS.Timeout
			startTime: number
		}
	>()

	private ensureSocket() {
		if (!this.socket) {
			this.socket = dgram.createSocket({
				type: "udp4",
				reuseAddr: true,
			})
			this.socket.on("error", (err) => console.error("[Socket Error]:", err))
			this.socket.on("message", (msg: Packet) => this.handleMessage(msg))
			this.socket.bind()
		}
	}

	private handleMessage(msg: Packet) {
		const requestID = msg[0]
		const requestType = msg[1]
		const pending = this.pendingRequests.get(requestID)

		if (pending && pending.type === requestType) {
			clearTimeout(pending.timeout)
			this.pendingRequests.delete(requestID)

			if (DEBUG) console.log(
				`[Request:${requestID}] Received ${PacketTypeMap[requestType]} in ${performance.now() - pending.startTime}ms`,
				msg
			)
			pending.resolve(msg)
		}
	}

	/**
	 * Send Ping message to device.
	 * First byte is message id, second byte is message type.
	 *
	 * @param ip
	 * @param port
	 * @returns (Promise) true if response received, false otherwise
	 */
	async ping(ip: string, port: number): Promise<boolean> {
		return (await this.sendSync(ip, port, PacketType.PING, null, Protocol.PING_TIMEOUT)) !== null
	}

	/**
	 * Get device configuration.
	 * First byte is message id, second byte is message type.
	 * Response is [reqId, GET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns (Promise) null if no response, otherwise {pin, num_leds, port, hostname}
	 */
	async getConfig(ip: string, port: number): Promise<Config | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_CONFIG, null, Protocol.GET_CONFIG_TIMEOUT)
		if (!response) return null

		return bufferToConfig(response.slice(2))
	}

	/**
	 * Set device configuration.
	 *
	 * @param ip
	 * @param port
	 * @param config
	 * @returns [MessageID, MessageType, Status (boolean)]
	 */
	async setConfig(ip: string, port: number, config: Config): Promise<boolean> {
		const configBuffer = configToBuffer(config)

		const response = await this.sendSync(
			ip,
			port,
			PacketType.SET_CONFIG,
			configBuffer,
			Protocol.SET_CONFIG_TIMEOUT
		)

		return response !== null && response.length >= 3 && response[2] === PacketStatus.OK
	}

	/**
	 * Turn on the leds based on the index and the specified color.
	 * Resolves when the kernel has handed the packet to the network stack,
	 * so callers can `await` to ensure the packet leaves before process exit.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param data [led_index, r, g, b, brightness / whiteness, led_index, r, g, b, brightness / whiteness, ...]
	 */
	setLEDs(ip: string, port: number, data: Uint8Array): Promise<void> {
		return this.send(ip, port, PacketType.SET_LEDS, data)
	}

	/**
	 * Resets all the Wi-Fi credentials of the device.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns
	 */
	resetWifi(ip: string, port: number): Promise<boolean> {
		return this.sendSync(ip, port, PacketType.RESET_WIFI, null, Protocol.SET_CONFIG_TIMEOUT).then(
			response => response !== null && response.length >= 3 && response[2] === PacketStatus.OK
		)
	}

	/**
	 * Get the firmware version string from the device.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns version string, or null if no response (offline or firmware too old to support GET_VERSION)
	 */
	async getVersion(ip: string, port: number): Promise<string | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_VERSION, null, Protocol.GET_VERSION_TIMEOUT)
		if (!response || response.length < 2) return null
		return decodeBuffer(response.slice(2))
	}

	/**
	 * Get device status: uptime, free heap, WiFi RSSI.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns (Promise) null if no response, otherwise {uptime, heap, rssi}
	 */
	async getStatus(ip: string, port: number): Promise<Status | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_STATUS, null, Protocol.GET_STATUS_TIMEOUT)
		if (!response || response.length < 11) return null

		return bufferToStatus(response.slice(2))
	}

	/**
	 * send UDP message to device, no response expected.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param data any
	 */
	private send(ip: string, port: number, type: PacketType, data: Uint8Array): Promise<void> {
		this.ensureSocket()

		const message = new Uint8Array(1 + 1 + data.length)
		message[0] = EMPTY_PACKET_ID
		message[1] = type
		message.set(data, 2)

		if (DEBUG) console.log(`[Request (not sync)] Sending ${PacketTypeMap[type]} to ${ip}:${port}`, data)

		// Promisify dgram.send so callers can await. Without the callback returning
		// control to the event loop, a short-lived CLI command would call
		// process.exit() before the kernel actually transmits the packet.
		return new Promise(resolve => {
			this.socket!.send(message, 0, message.length, port, ip, err => {
				if (err && DEBUG) console.error(err)
				resolve()
			})
		})
	}

	/**
	 * Send UDP message to device and wait for response.
	 * After timeout, resolve with null.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param type PacketType
	 * @param data any
	 * @param timeoutDuration milliseconds to wait for response
	 * @returns
	 */
	private sendSync(
		ip: string,
		port: number,
		type: PacketType,
		data: Uint8Array | null = null,
		timeoutDuration: number
	): Promise<Packet | null> {
		this.ensureSocket()

		// Cycle requestID through 1..255 (0 is reserved for fire-and-forget SET_LEDS).
		// 255 in-flight slots is plenty for typical CLI use (sync requests are rare —
		// PING / GET_CONFIG / SET_CONFIG / RESET_WIFI, with 1s timeouts). If the CLI is
		// proxying many concurrent sync requests through `ws`, a high enough rate could
		// theoretically collide on IDs before the previous timeout elapses; in practice
		// this requires >255 sync requests/second, which no realistic client produces.
		this.requestID = (this.requestID % 255) + 1
		const requestID = this.requestID

		const message = new Uint8Array(1 + 1 + (data ? data.length : 0))
		message[0] = requestID
		message[1] = type
		if (data) message.set(data, 2)

		if (DEBUG) console.log(`[Request:${requestID}] Sending ${PacketTypeMap[type]} to ${ip}:${port}`, data)

		return new Promise((resolve) => {
			const startTime = performance.now()
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestID)
				if (DEBUG) console.log(
					`[Request:${requestID}] Timeout for ${PacketTypeMap[type]} after ${performance.now() - startTime}ms`
				)
				resolve(null)
			}, timeoutDuration)

			this.pendingRequests.set(requestID, { resolve, type, timeout, startTime })

			this.socket!.send(message, 0, message.length, port, ip, err => {
				if (err) {
					clearTimeout(timeout)
					this.pendingRequests.delete(requestID)
					if (DEBUG) console.error(`[Request:${requestID}] Error sending ${PacketTypeMap[type]}:`, err)
					resolve(null)
				}
			})
		})
	}
}

const proto = new Protocol()

export { Protocol }

export default proto
