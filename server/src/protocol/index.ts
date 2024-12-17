import dgram from "dgram"

import { logger } from "@shared"
import {
	Color,
	EMPTY_MESSAGE_ID,
	MessageTypeString,
	ProtocolBoardConfig,
	ProtocolMessageType,
	ProtocolRequestID,
	ProtocolResponse,
} from "./types"

class Protocol {
	static PING_TIMEOUT = 300
	static GET_CONFIG_TIMEOUT = 500
	static SET_CONFIG_TIMEOUT = 200

	private socket: dgram.Socket
	private requestID: ProtocolRequestID = 1

	/**
	 * Create UDP socket to communicate with devices.
	 */
	constructor() {
		this.socket = dgram.createSocket("udp4")
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
		return (await this.sendSync(ip, port, ProtocolMessageType.PING, null, Protocol.PING_TIMEOUT)) !== null
	}

	/**
	 * Get device configuration.
	 * First byte is message id, second byte is message type.
	 * Response is [requestID, ProtocolMessageType.GET_CONFIG, port, id, num_leds, hostname], each byte is a number, except hostname.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @returns (Promise) null if no response, otherwise {port, id, num_leds, hostname}
	 */
	async getConfig(ip: string, port: number): Promise<ProtocolBoardConfig | null> {
		const response = await this.sendSync(ip, port, ProtocolMessageType.GET_CONFIG, null, Protocol.GET_CONFIG_TIMEOUT)
		if (!response) return null

		const data = response.slice(2)

		return {
			port: (data[0] << 8) | data[1],
			id: data[2],
			num_leds: data[3],
			brightness: data[4],
			hostname: String.fromCharCode(...data.slice(5)).replace(/\0/g, ""),
		}
	}

	/**
	 * Set device configuration.
	 *
	 * @param ip
	 * @param port
	 * @param config
	 * @returns [MessageID, MessageType, Status (boolean)]
	 */
	async setConfig(ip: string, port: number, config: ProtocolBoardConfig): Promise<boolean> {
		const response = await this.sendSync(
			ip,
			port,
			ProtocolMessageType.SET_CONFIG,
			[
				(config.port >> 8) & 0xff,
				config.port & 0xff,
				config.id,
				config.num_leds,
				config.brightness,
				...bufferFromString(config.hostname),
			],
			Protocol.SET_CONFIG_TIMEOUT
		)

		return response && response.length >= 2 && response[2] === 1
	}

	/**
	 * Turn on the leds based on the index and the specified color.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param data [led_index, r, g, b, brightness / whiteness, led_index, r, g, b, brightness / whiteness, ...]
	 * @returns
	 */
	async setLEDs(ip: string, port: number, data: Uint8Array) {
		return this.send(ip, port, ProtocolMessageType.SET_LEDS, data)
	}

	/**
	 * Blink the number of leds based on the id in the configuration.
	 * You can set a base color and a blink color, the number and the delay between the blinks.
	 *
	 * @param ip
	 * @param port
	 * @param baseColor
	 * @param blinkColor
	 * @param count
	 * @param delay
	 * @returns
	 */
	async blink(
		ip: string,
		port: number,
		baseColor: Color = [10, 10, 10, 10],
		blinkColor: Color = [255, 255, 255, 255],
		count: number = 3,
		delay: number = 1000
	) {
		const data = new Uint8Array([
			baseColor[0],
			baseColor[1],
			baseColor[2],
			baseColor[3],
			blinkColor[0],
			blinkColor[1],
			blinkColor[2],
			blinkColor[3],
			count,
			delay >> 8,
			delay & 0xff,
		])

		return this.send(ip, port, ProtocolMessageType.BLINK, data)
	}

	/**
	 * send UDP message to device, no response expected.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param type ProtocolMessageType
	 * @param data any
	 */
	private send(ip: string, port: number, type: ProtocolMessageType, data: number[] | Uint8Array) {
		const message = new Uint8Array([EMPTY_MESSAGE_ID, type, ...data])

		logger.debug(`Sending ${type} ${MessageTypeString[type]} to ${ip}:${port}`, message)

		this.socket.send(message, 0, message.length, port, ip, err => err && console.error(err))
	}

	/**
	 * Send UDP message to device and wait for response.
	 * After timeout, resolve with null.
	 *
	 * @param ip device ip
	 * @param port device port
	 * @param type ProtocolMessageType
	 * @param data any
	 * @param timeout milliseconds to wait for response
	 * @returns
	 */
	private sendSync(
		ip: string,
		port: number,
		type: ProtocolMessageType,
		data: number[] | Uint8Array | null = null,
		timeout: number
	): Promise<ProtocolResponse | null> {
		// from 1 to 255 with modulo (0 is reserved for empty message)
		this.requestID = (this.requestID % 255) + 1

		logger.debug(`[Request:${this.requestID}] Sending ${MessageTypeString[type]} to ${ip}:${port}`, data)
		const requestID = this.requestID
		const message = new Uint8Array([requestID, type, ...(data || [])])
		let closeTimeout: NodeJS.Timeout

		return new Promise(resolve => {
			let active = true

			const startTime = performance.now()
			const close = data => {
				if (!active) return

				logger.debug(
					`[Request:${requestID}] Received ${MessageTypeString[type]} from ${ip}:${port} in ${
						performance.now() - startTime
					}ms`,
					data
				)
				active = false
				clearTimeout(closeTimeout)
				this.socket.off("message", onMessage)

				resolve(data)
			}

			const onMessage = (msg: Buffer) =>
				msg[0] === requestID && msg[1] === type && close(msg as unknown as ProtocolResponse)

			closeTimeout = setTimeout(() => close(null), timeout)
			this.socket.on("message", onMessage)

			this.socket.send(message, 0, message.length, port, ip, err => err && close(null))
		})
	}
}

const proto = new Protocol()

export default proto

function bufferFromString(str: string): Uint8Array {
	const buffer = new Uint8Array(str.length)
	for (let i = 0; i < str.length; i++) {
		buffer[i] = str.charCodeAt(i)
	}
	return buffer
}
