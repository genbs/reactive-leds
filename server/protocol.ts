import {
	bufferToConfig,
	Config,
	configToBuffer,
	EMPTY_PACKET_ID,
	logger,
	Packet,
	PacketID,
	PacketStatus,
	PacketType,
	PacketTypeMap,
} from "@leds/shared"
import dgram from "dgram"

class Protocol {
	static PING_TIMEOUT = 1000
	static GET_CONFIG_TIMEOUT = 1000
	static SET_CONFIG_TIMEOUT = 1000

	private socket: dgram.Socket
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

	private configBuffer: Uint8Array | null = null

	/**
	 * Create UDP socket to communicate with devices.
	 */
	constructor() {
		this.socket = dgram.createSocket({
			type: "udp4",
			reuseAddr: true,
		})

		this.socket.on("message", (msg: Packet) => this.handleMessage(msg))
	}

	private handleMessage(msg: Packet) {
		const requestID = msg[0]
		const requestType = msg[1]
		const pending = this.pendingRequests.get(requestID)

		if (pending && pending.type === requestType) {
			clearTimeout(pending.timeout)
			this.pendingRequests.delete(requestID)

			logger.debug(
				`\x1b[32m[Request:${requestID}] Received ${PacketTypeMap[requestType]} in ${
					performance.now() - pending.startTime
				}ms\x1b[0m`,
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
	 * Response is [requestID, PacketType.GET_CONFIG, port, id, num_leds, hostname], each byte is a number, except hostname.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns (Promise) null if no response, otherwise {port, id, num_leds, hostname}
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
		const packetLength = 1 + 1 + 1 + 2 + config.hostname.length
		if (!this.configBuffer || this.configBuffer.length < packetLength) this.configBuffer = configToBuffer(config)

		const response = await this.sendSync(
			ip,
			port,
			PacketType.SET_CONFIG,
			this.configBuffer,
			Protocol.SET_CONFIG_TIMEOUT
		)

		return response !== null && response.length >= 2 && response[2] === PacketStatus.OK
	}

	/**
	 * Turn on the leds based on the index and the specified color.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param data [led_index, r, g, b, brightness / whiteness, led_index, r, g, b, brightness / whiteness, ...]
	 * @returns
	 */
	setLEDs(ip: string, port: number, data: Uint8Array) {
		return this.send(ip, port, PacketType.SET_LEDS, data)
	}

	/**
	 * send UDP message to device, no response expected.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param data any
	 */
	private send(ip: string, port: number, type: PacketType, data: Uint8Array) {
		const message = new Uint8Array(1 + 1 + data.length)
		message[0] = EMPTY_PACKET_ID
		message[1] = type
		message.set(data, 2)

		logger.debug(`\x1b[90m[Request (not sync)] Sending ${PacketTypeMap[type]} to ${ip}:${port}\x1b[0m`, data)

		this.socket.send(message, 0, message.length, port, ip, err => err && logger.error(err))
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
		// from 1 to 255 with modulo (0 is reserved for empty message)
		this.requestID = (this.requestID % 255) + 1
		const requestID = this.requestID

		const message = new Uint8Array(1 + 1 + (data ? data.length : 0))
		message[0] = requestID
		message[1] = type
		if (data) message.set(data, 2)

		logger.debug(`\x1b[90m[Request:${requestID}] Sending ${PacketTypeMap[type]} to ${ip}:${port}\x1b[0m`, data)

		return new Promise(resolve => {
			const startTime = performance.now()
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestID)
				logger.debug(
					`\x1b[33m[Request:${requestID}] Timeout for ${PacketTypeMap[type]} after ${
						performance.now() - startTime
					}ms\x1b[0m`
				)
				resolve(null)
			}, timeoutDuration)

			this.pendingRequests.set(requestID, { resolve, type, timeout, startTime })

			this.socket.send(message, 0, message.length, port, ip, err => {
				if (err) {
					clearTimeout(timeout)
					this.pendingRequests.delete(requestID)
					logger.error(err)
					resolve(null)
				}
			})
		})
	}
}

const proto = new Protocol()

export { Protocol }
export default proto
