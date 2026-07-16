import {
	bufferToConfig,
	bufferToDeviceInfo,
	bufferToStatus,
	Config,
	configToBuffer,
	DEFAULT_SYNC_TIMEOUT,
	DeviceInfo,
	EMPTY_PACKET_ID,
	Packet,
	PacketID,
	PacketStatus,
	PacketType,
	PacketTypeMap,
	Status,
	validateLEDs,
} from "@reactive-leds/shared"
import dgram from "dgram"
import { debug } from "./utils"

class Protocol {
	// Sync requests are called infrequently and require a response from the device.
	static SYNC_RETRIES = 3

	private socket?: dgram.Socket
	private requestID: PacketID = 1
	private pendingRequests = new Map<
		number,
		{
			resolve: (data: Packet | null) => void
			type: PacketType
			ip: string
			port: number
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
			this.socket.on("message", (msg: Packet, rinfo) => this.handleMessage(msg, rinfo))
			this.socket.bind()
		}
	}

	private handleMessage(msg: Packet, rinfo: dgram.RemoteInfo) {
		const requestID = msg[0]
		const requestType = msg[1]
		const pending = this.pendingRequests.get(requestID)

		if (pending && pending.type === requestType && pending.ip === rinfo.address && pending.port === rinfo.port) {
			clearTimeout(pending.timeout)
			this.pendingRequests.delete(requestID)

			debug(
				`Request:${requestID}`,
				`Received ${PacketTypeMap[requestType]} in ${performance.now() - pending.startTime}ms`,
				msg
			)
			pending.resolve(msg)
		}
	}

	private nextRequestID(): PacketID | null {
		for (let i = 0; i < 255; i++) {
			this.requestID = (this.requestID % 255) + 1
			if (!this.pendingRequests.has(this.requestID)) return this.requestID
		}
		return null
	}

	/**
	 * Send Ping message to device.
	 * First byte is message id, second byte is message type.
	 *
	 * @returns (Promise) true if response received, false otherwise
	 */
	async ping(ip: string, port: number): Promise<boolean> {
		return (await this.sendSync(ip, port, PacketType.PING)) !== null
	}

	/**
	 * Get device configuration.
	 * First byte is message id, second byte is message type.
	 * Response is [reqId, GET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
	 *
	 * @returns (Promise) null if no response, otherwise {pin, num_leds, port, hostname}
	 */
	async getConfig(ip: string, port: number): Promise<Config | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_CONFIG)
		if (!response || response.length < 6) return null

		return bufferToConfig(response.slice(2))
	}

	/**
	 * Set device configuration.
	 *
	 * @returns [MessageID, MessageType, Status (boolean)]
	 */
	async setConfig(ip: string, port: number, config: Config): Promise<boolean> {
		const configBuffer = configToBuffer(config)

		const response = await this.sendSync(
			ip,
			port,
			PacketType.SET_CONFIG,
			configBuffer,
			1
		)

		return response !== null && response.length >= 3 && response[2] === PacketStatus.OK
	}

	/**
	 * Update contiguous LEDs starting at the specified index.
	 * Resolves when the kernel has handed the packet to the network stack,
	 * so callers can `await` to ensure the packet leaves before process exit.
	 *
	 * @param leds [r, g, b, brightness / whiteness, ...]
	 */
	setLEDs(ip: string, port: number, leds: Uint8Array, startIndex = 0, packetId: PacketID = EMPTY_PACKET_ID): Promise<boolean> {
		validateLEDs(leds, startIndex)
		return this.send(ip, port, PacketType.SET_LEDS, leds, packetId, startIndex)
	}

	/**
	 * Resets all the Wi-Fi credentials of the device.
	 *
	 * @returns
	 */
	resetWifi(ip: string, port: number): Promise<boolean> {
		// retries=1: not idempotent — the device reboots after clearing credentials.
		return this.sendSync(ip, port, PacketType.RESET_WIFI, null, 1).then(
			response => response !== null && response.length >= 3 && response[2] === PacketStatus.OK
		)
	}

	/**
	 * Get device identity/info.
	 *
	 * @returns device info, or null if no response
	 */
	async getInfo(ip: string, port: number): Promise<DeviceInfo | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_INFO)
		if (!response || response.length < 16) return null
		try {
			return bufferToDeviceInfo(response.subarray(2))
		} catch {
			return null
		}
	}

	/**
	 * Get device status: uptime, heap, WiFi RSSI and optional metrics.
	 *
	 * @returns (Promise) null if no response, otherwise the parsed device status
	 */
	async getStatus(ip: string, port: number): Promise<Status | null> {
		const response = await this.sendSync(ip, port, PacketType.GET_STATUS)
		if (!response || response.length < 11) return null

		return bufferToStatus(response.subarray(2))
	}

	/**
	 * send UDP message to device, no response expected.
	 *
	 * @param data any
	 */
	private send(ip: string, port: number, type: PacketType, data: Uint8Array, packetID: PacketID, dataPrefix?: number): Promise<boolean> {
		this.ensureSocket()

		const message = new Uint8Array(2 + data.length + (dataPrefix === undefined ? 0 : 1))
		message[0] = packetID
		message[1] = type
		if (dataPrefix !== undefined) message[2] = dataPrefix
		message.set(data, dataPrefix === undefined ? 2 : 3)

		debug("Request (not sync)", `Sending ${PacketTypeMap[type]} to ${ip}:${port}`, data)

		// Promisify dgram.send so callers can await. Without the callback returning
		// control to the event loop, a short-lived CLI command would call
		// process.exit() before the kernel actually transmits the packet.
		return new Promise(resolve => {
			this.socket!.send(message, 0, message.length, port, ip, err => {
				if (err) debug("Request (not sync)", err)
				resolve(!err)
			})
		})
	}

	/**
	 * Send UDP message to device and wait for response, retrying on failure.
	 * A failed attempt (timeout or send error) is retried up to `retries` times.
	 * Resolves null when all attempts fail.
	 *
	 * @param type PacketType
	 * @param data any
	 * @param retries total attempts (use 1 for non-idempotent requests)
	 */
	private async sendSync(
		ip: string,
		port: number,
		type: PacketType,
		data: Uint8Array | null = null,
		retries: number = Protocol.SYNC_RETRIES
	): Promise<Packet | null> {
		for (let attempt = 0; attempt < retries; attempt++) {
			const response = await this.sendSyncOnce(ip, port, type, data, DEFAULT_SYNC_TIMEOUT)
			if (response !== null) return response
		}
		return null
	}

	/**
	 * Single send attempt: send UDP message and wait for response.
	 * After timeout (or send error), resolve with null.
	 */
	private sendSyncOnce(
		ip: string,
		port: number,
		type: PacketType,
		data: Uint8Array | null = null,
		timeoutDuration: number
	): Promise<Packet | null> {
		this.ensureSocket()

		const requestID = this.nextRequestID()
		if (requestID === null) return Promise.resolve(null)

		const message = new Uint8Array(1 + 1 + (data ? data.length : 0))
		message[0] = requestID
		message[1] = type
		if (data) message.set(data, 2)

		debug(`Request:${requestID}`, `Sending ${PacketTypeMap[type]} to ${ip}:${port}`, data)

		return new Promise((resolve) => {
			const startTime = performance.now()
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestID)
				debug(
					`Request:${requestID}`,
					`Timeout for ${PacketTypeMap[type]} after ${performance.now() - startTime}ms`
				)
				resolve(null)
			}, timeoutDuration)

			this.pendingRequests.set(requestID, { resolve, type, ip, port, timeout, startTime })

			this.socket!.send(message, 0, message.length, port, ip, err => {
				if (err) {
					clearTimeout(timeout)
					if (this.pendingRequests.get(requestID)?.timeout === timeout)
						this.pendingRequests.delete(requestID)
					debug(`Request:${requestID}`, `Error sending ${PacketTypeMap[type]}:`, err)
					resolve(null)
				}
			})
		})
	}
}

const proto = new Protocol()

export { Protocol }

export default proto
