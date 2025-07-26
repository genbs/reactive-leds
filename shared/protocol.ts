/**
 * This file defines the communication structure with the firmware.
 * The communication is done through byte packets.
 * Each packet consists of an ID, a packet type, and data formatted according to the type.
 * The packets are of variable length, but the first byte is always the packet ID,
 * and the second byte is the packet type.
 */
export type PacketID = number

// Packet types, defined by the firmware
export enum PacketType {
	/**
	 * send a ping to the device
	 * request: DeviceAddress, MessageID
	 * response: MessageID, MessageType(PING), 1 (true) or 0 (false)
	 */
	PING = 0,

	/**
	 * get the configuration of the device
	 * request: DeviceAddress, MessageID
	 * response: MessageID, MessageType(GET_CONFIG), pin, num_leds, brightness, port_h, port_l, hostname...
	 */
	GET_CONFIG = 1,

	/**
	 * set the configuration of the device
	 * request: DeviceAddress, MessageID, pin, num_leds, brightness, port_h, port_l, hostname...
	 * response: MessageID, MessageType(SET_CONFIG), 1 (true) or 0 (false)
	 */

	SET_CONFIG = 2,

	/**
	 * set the RGB LEDs of the device
	 * request: DeviceAddress, MessageID, pixel_index, r, g, b, b/w, pixel_index, r, g, b, b/w...
	 * response: None, this is an async request, no response needed
	 */
	SET_LEDS = 3,

	/**
	 * Clear all wi-Fi credentials stored in the device
	 */
	RESET_WIFI = 4,
}

export type Packet = Uint8Array // [PacketID, PacketType, ...number[]]

export type Color = [number, number, number, number] // [r, g, b, b/w]

// example of config packet: [MessageID, MessageType, PORT_H, PORT_L, ID, NUM_LEDS, BRIGHTNESS, HOSTNAME...]
export type Config = {
	hostname: string // like 'esp-1'
	port: number // default 4210
	pin: number // default 18
	num_leds: number // default 16
	brightness: number // default 255
}

export const availableConfigKeys: (keyof Config)[] = ["hostname", "pin", "num_leds", "port", "brightness"] as const

export type LEDs = Uint8Array // [pixel_index, r, g, b, b/w, pixel_index, r, g, b, b/w, ...] (5 bytes per LED)

// Used by the device to send the response status
export enum PacketStatus {
	OK = 1,
	ERROR = 0,
}

export type DeviceIP = string | [number, number, number, number]
export type DeviceAddress = Uint8Array // [number, number, number, number, number, number]

export const EMPTY_PACKET_ID = 0

// Label for the packet types
export const PacketTypeMap = {
	[PacketType.PING]: "PING",
	[PacketType.GET_CONFIG]: "GET_CONFIG",
	[PacketType.SET_CONFIG]: "SET_CONFIG",
	[PacketType.SET_LEDS]: "SET_LEDS",
	[PacketType.RESET_WIFI]: "RESET_WIFI",
}

// convert a buffer to a config object
export function bufferToConfig(buffer: Uint8Array): Config {
	return {
		pin: buffer[0],
		num_leds: buffer[1],
		brightness: buffer[2],
		port: (buffer[3] << 8) | buffer[4],
		hostname: decodeBuffer(buffer.slice(5)).substring(0, 32), // ensure hostname is at most 32 characters
	}
}

// convert a config object to a buffer, no validation
export function configToBuffer(config: Config, dest?: Uint8Array): Uint8Array {
	const pin = config.pin
	const num_leds = config.num_leds
	const brightness = config.brightness // 0-255
	const port = config.port
	const hostname = config.hostname.substring(0, 32)

	const packetLength = 1 + 1 + 1 + 2 + hostname.length // pin, num_leds, brightness, port_h, port_l, hostname

	let packet
	if (typeof dest !== "undefined") {
		// check if the destination buffer is large enough
		if (dest.length < packetLength) throw new Error("Destination buffer is too small")

		packet = dest
	} else {
		packet = new Uint8Array(packetLength)
	}

	packet[0] = pin
	packet[1] = num_leds
	packet[2] = brightness
	packet[3] = (port >> 8) & 0xff
	packet[4] = port & 0xff

	encodeBuffer(hostname, packet, 5)

	return packet
}

/**
 * Convert address (ip + port) to buffer, not validating input
 */
export function addressToBuffer(ip: DeviceIP, port: number, dest?: DeviceAddress): DeviceAddress {
	const buffer = dest || new Uint8Array(6) // 4 bytes for IP + 2 bytes for port

	if (typeof ip === "string") {
		const parts = ip.split(".")
		buffer[0] = +parts[0] // Il '+' converte la stringa in numero
		buffer[1] = +parts[1]
		buffer[2] = +parts[2]
		buffer[3] = +parts[3]
	} else {
		buffer.set(ip, 0)
	}

	buffer[4] = (port >> 8) & 0xff
	buffer[5] = port & 0xff

	return buffer
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Encode a string to a Uint8Array buffer.
 * If a destination buffer is provided, it will encode the string into that buffer starting at the specified position.
 * If no destination buffer is provided, it will return a new Uint8Array with the encoded string.
 *
 * NOTE: The encoded string will be null-terminated if the destination buffer is large enough and position is not specified.
 */
export function encodeBuffer(str: string, dest?: Uint8Array, position?: number): Uint8Array {
	if (typeof dest !== "undefined") {
		encoder.encodeInto(str, position ? dest.subarray(position | 0) : dest)

		// if length of the destination buffer is more than the encoded string, add \0 termination
		if (typeof position === "undefined" && dest.length > str.length) {
			dest[(position || 0) + str.length] = 0 // add null termination
		}

		return dest
	} else {
		return encoder.encode(str)
	}
}

export function decodeBuffer(buffer: Uint8Array): string {
	// check if the buffer has \0 termination
	const nullIndex = buffer.indexOf(0)
	if (nullIndex !== -1) buffer = buffer.subarray(0, nullIndex)

	return decoder.decode(buffer)
}
