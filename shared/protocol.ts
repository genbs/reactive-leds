/**
 * This file defines the communication structure with the firmware.
 * The communication is done through byte packets.
 * Each packet consists of an ID, a packet type, and data formatted according to the type.
 * The packets are of variable length, but the first byte is always the packet ID,
 * and the second byte is the packet type.
 */
export type PacketID = number

/**
 * The packet types, defined by the firmware
 */
export enum PacketType {
	PING = 0,
	GET_CONFIG = 1,
	SET_CONFIG = 2,
	SET_LEDS = 3,
	RESET_WIFI = 4,
	GET_VERSION = 5,
	GET_STATUS = 6,
}

export type Packet = Uint8Array // [PacketID, PacketType, ...number[]]

export type Color = [number, number, number, number] // [r, g, b, w]

/** Serialized as: [pin, num_leds, port_h, port_l, hostname...] */
export type Config = {
	hostname: string // like 'esp-1'
	port: number // default 4210
	pin: number // default 18
	num_leds: number // default 16
}

export const availableConfigKeys: (keyof Config)[] = ["hostname", "pin", "num_leds", "port"]

export type LEDs = Uint8Array // [pixel_index, r, g, b, b/w, pixel_index, r, g, b, b/w, ...] (5 bytes per LED)

/** Used by the device to send the response status */
export enum PacketStatus {
	OK = 1,
	ERROR = 0,
}

export type DeviceIP = string | [number, number, number, number]
export type DeviceAddress = Uint8Array // [number, number, number, number, number, number]

export const EMPTY_PACKET_ID = 0

/** Label for the packet types */
export const PacketTypeMap = {
	[PacketType.PING]: "PING",
	[PacketType.GET_CONFIG]: "GET_CONFIG",
	[PacketType.SET_CONFIG]: "SET_CONFIG",
	[PacketType.SET_LEDS]: "SET_LEDS",
	[PacketType.RESET_WIFI]: "RESET_WIFI",
	[PacketType.GET_VERSION]: "GET_VERSION",
	[PacketType.GET_STATUS]: "GET_STATUS",
}

/** Convert a buffer to a config object */
export function bufferToConfig(buffer: Uint8Array): Config {
	if (buffer.length < 4) {
		throw new Error(`Config buffer too short: ${buffer.length} bytes, need at least 4`)
	}

	return {
		pin: buffer[0],
		num_leds: buffer[1],
		port: (buffer[2] << 8) | buffer[3],
		hostname: decodeBuffer(buffer.slice(4)).substring(0, 32),
	}
}

/** Convert a config object to a buffer */
export function configToBuffer(config: Config, dest?: Uint8Array): Uint8Array {
	const pin = config.pin
	const num_leds = config.num_leds
	const port = config.port
	const hostname = config.hostname.substring(0, 32)

	const packetLength = 1 + 1 + 2 + hostname.length // pin, num_leds, port_h, port_l, hostname

	let packet
	if (typeof dest !== "undefined") {
		if (dest.length < packetLength) throw new Error("Destination buffer is too small")

		packet = dest
	} else {
		packet = new Uint8Array(packetLength)
	}

	packet[0] = pin
	packet[1] = num_leds
	packet[2] = (port >> 8) & 0xff
	packet[3] = port & 0xff

	if (packet.length < 4) {
		throw new Error(`Packet buffer too small: ${packet.length} bytes`)
	}

	encodeBuffer(hostname, packet, 4)

	return packet
}

/** Device status: uptime, free heap, WiFi RSSI. Serialized as: [uptime(4), heap(4), rssi(1)] */
export type Status = {
	uptime: number // seconds since boot
	heap: number // free heap bytes
	rssi: number // WiFi RSSI in dBm (signed)
}

/** Convert a status buffer to a Status object */
export function bufferToStatus(buffer: Uint8Array): Status {
	if (buffer.length < 9) {
		throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`)
	}

	const uptime =
		((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0
	const heap =
		((buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7]) >>> 0
	const rssi = buffer[8] << 24 >> 24 // sign-extend int8

	return { uptime, heap, rssi }
}

/** Convert address (ip + port) to buffer */
export function addressToBuffer(ip: DeviceIP, port: number, dest?: DeviceAddress): DeviceAddress {
	const buffer = dest || new Uint8Array(6) // 4 bytes for IP + 2 bytes for port

	if (typeof ip === "string") {
		const parts = ip.split(".")
		if (parts.length !== 4) {
			throw new Error(`Invalid IP address: "${ip}"`)
		}
		const octets = parts.map(Number)
		if (octets.some(o => isNaN(o) || o < 0 || o > 255)) {
			throw new Error(`Invalid IP address: "${ip}"`)
		}
		buffer[0] = octets[0]
		buffer[1] = octets[1]
		buffer[2] = octets[2]
		buffer[3] = octets[3]
	} else {
		if (ip.length < 4) {
			throw new Error(`IP array too short: ${ip.length} elements`)
		}
		buffer.set(ip.slice(0, 4), 0)
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
		const target = typeof position !== "undefined" ? dest.subarray(position) : dest
		encoder.encodeInto(str, target)

		if (typeof position === "undefined" && dest.length > str.length) {
			dest[str.length] = 0
		}

		return dest
	} else {
		return encoder.encode(str)
	}
}

/** Decode a Uint8Array buffer to a string, stopping at the first null byte */
export function decodeBuffer(buffer: Uint8Array): string {
	const nullIndex = buffer.indexOf(0)
	if (nullIndex !== -1) buffer = buffer.subarray(0, nullIndex)

	return decoder.decode(buffer)
}
