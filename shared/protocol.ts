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

/** A bare IP, as dotted string or 4 octets. `address` is reserved for the combined ip+port form. */
export type IP = string | [number, number, number, number]
/** The wire form of an address (ip + port): [ip(4), port_h, port_l] */
export type AddressBuffer = Uint8Array

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
		hostname: decodeBuffer(buffer.subarray(4)).substring(0, 32),
	}
}

/** Convert a config object to a buffer */
export function configToBuffer(config: Config): Uint8Array {
	const hostname = config.hostname.substring(0, 32)
	const packet = new Uint8Array(4 + hostname.length)
	packet[0] = config.pin
	packet[1] = config.num_leds
	packet[2] = (config.port >> 8) & 0xff
	packet[3] = config.port & 0xff
	encodeBuffer(hostname, packet, 4)
	return packet
}

/** Device status. Serialized as: [uptime(4), heap(4), rssi(1), mac?(6)] */
export type Status = {
	uptime: number // seconds since boot
	heap: number // free heap bytes
	rssi: number // WiFi RSSI in dBm (signed)
	mac?: string // WiFi STA MAC, e.g. "AA:BB:CC:DD:EE:FF"
}

/** Convert a status buffer to a Status object */
export function bufferToStatus(buffer: Uint8Array): Status {
	if (buffer.length < 9)
		throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`)

	const uptime =
		((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0
	const heap =
		((buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7]) >>> 0
	const rssi = buffer[8] << 24 >> 24 // sign-extend int8

	const status: Status = { uptime, heap, rssi }
	if (buffer.length >= 15) {
		status.mac = Array.from(buffer.subarray(9, 15), byte => byte.toString(16).padStart(2, "0").toUpperCase()).join(":")
	}
	return status
}

/** Convert a Status object to its wire payload: [uptime(4 BE), heap(4 BE), rssi(1, int8), mac?(6)] */
export function statusToBuffer(status: Status): Uint8Array {
	const buffer = new Uint8Array(status.mac ? 15 : 9)
	buffer[0] = (status.uptime >>> 24) & 0xff
	buffer[1] = (status.uptime >>> 16) & 0xff
	buffer[2] = (status.uptime >>> 8) & 0xff
	buffer[3] = status.uptime & 0xff
	buffer[4] = (status.heap >>> 24) & 0xff
	buffer[5] = (status.heap >>> 16) & 0xff
	buffer[6] = (status.heap >>> 8) & 0xff
	buffer[7] = status.heap & 0xff
	buffer[8] = status.rssi & 0xff // int8 written as a raw byte
	if (status.mac) {
		const parts = status.mac.split(":")
		if (parts.length !== 6) throw new Error(`Invalid MAC: "${status.mac}"`)
		for (let i = 0; i < 6; i++) {
			if (!/^[0-9a-f]{1,2}$/i.test(parts[i])) throw new Error(`Invalid MAC: "${status.mac}"`)
			const byte = Number.parseInt(parts[i], 16)
			if (Number.isNaN(byte) || byte < 0 || byte > 255) throw new Error(`Invalid MAC: "${status.mac}"`)
			buffer[9 + i] = byte
		}
	}
	return buffer
}

/** Convert ip + port to the 6-byte address buffer */
export function addressToBuffer(ip: IP, port: number): AddressBuffer {
	const buffer = new Uint8Array(6) // 4 bytes for IP + 2 bytes for port

	if (typeof ip === "string") {
		const parts = ip.split(".")
		if (parts.length !== 4) {
			throw new Error(`Invalid IP: "${ip}"`)
		}
		for (let i = 0; i < 4; i++) {
			const octet = Number(parts[i])
			if (isNaN(octet) || octet < 0 || octet > 255) {
				throw new Error(`Invalid IP: "${ip}"`)
			}
			buffer[i] = octet
		}
	} else {
		if (ip.length < 4) {
			throw new Error(`IP array too short: ${ip.length} elements`)
		}
		buffer[0] = ip[0]
		buffer[1] = ip[1]
		buffer[2] = ip[2]
		buffer[3] = ip[3]
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
	if (nullIndex !== -1) return decoder.decode(buffer.subarray(0, nullIndex))
	return decoder.decode(buffer)
}
