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
	GET_INFO = 5,
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

export type LEDs = Uint8Array // [r, g, b, w, ...] (4 bytes per LED)

export function validateLEDs(leds: LEDs, startIndex = 0): void {
	if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > 255) {
		throw new RangeError("startIndex must be an integer between 0 and 255")
	}
	if (leds.length < 4 || leds.length % 4 !== 0) {
		throw new RangeError("leds must contain one or more RGBW pixels")
	}
	if (startIndex + leds.length / 4 > 255) {
		throw new RangeError("LED range exceeds 255 pixels")
	}
}

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
export const DEFAULT_SYNC_TIMEOUT = 1000

/** Label for the packet types */
export const PacketTypeMap = {
	[PacketType.PING]: "PING",
	[PacketType.GET_CONFIG]: "GET_CONFIG",
	[PacketType.SET_CONFIG]: "SET_CONFIG",
	[PacketType.SET_LEDS]: "SET_LEDS",
	[PacketType.RESET_WIFI]: "RESET_WIFI",
	[PacketType.GET_INFO]: "GET_INFO",
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

/** Device identity. Serialized as: [ip(4), port(2), mac(6), version_len(1), version, hostname_len(1), hostname] */
export type DeviceInfo = {
	ip: string
	port: number
	mac: string
	version: string
	hostname: string
}

/** Convert an info buffer to a DeviceInfo object */
export function bufferToDeviceInfo(buffer: Uint8Array): DeviceInfo {
	if (buffer.length < 14)
		throw new Error(`Device info buffer too short: ${buffer.length} bytes, need at least 14`)

	const ip = Array.from(buffer.subarray(0, 4)).join(".")
	const port = (buffer[4] << 8) | buffer[5]
	const mac = Array.from(buffer.subarray(6, 12), byte => byte.toString(16).padStart(2, "0").toUpperCase()).join(":")
	const versionLen = buffer[12]
	const versionStart = 13
	const versionEnd = versionStart + versionLen
	if (buffer.length < versionEnd + 1)
		throw new Error(`Device info buffer too short for version: ${buffer.length} bytes, need ${versionEnd + 1}`)

	const hostnameLen = buffer[versionEnd]
	const hostnameStart = versionEnd + 1
	const hostnameEnd = hostnameStart + hostnameLen
	if (buffer.length < hostnameEnd)
		throw new Error(`Device info buffer too short for hostname: ${buffer.length} bytes, need ${hostnameEnd}`)

	return {
		ip,
		port,
		mac,
		version: decodeBuffer(buffer.subarray(versionStart, versionEnd)),
		hostname: decodeBuffer(buffer.subarray(hostnameStart, hostnameEnd)).substring(0, 32),
	}
}

/** Convert a DeviceInfo object to its wire payload. */
export function deviceInfoToBuffer(info: DeviceInfo): Uint8Array {
	const ip = addressToBuffer(info.ip, info.port).subarray(0, 4)
	const macParts = info.mac.split(":")
	if (macParts.length !== 6) throw new Error(`Invalid MAC: "${info.mac}"`)

	const version = encodeBuffer(info.version.substring(0, 32))
	const hostname = encodeBuffer(info.hostname.substring(0, 32))
	const buffer = new Uint8Array(4 + 2 + 6 + 1 + version.length + 1 + hostname.length)
	buffer.set(ip, 0)
	buffer[4] = (info.port >> 8) & 0xff
	buffer[5] = info.port & 0xff
	for (let i = 0; i < 6; i++) {
		if (!/^[0-9a-f]{1,2}$/i.test(macParts[i])) throw new Error(`Invalid MAC: "${info.mac}"`)
		buffer[6 + i] = Number.parseInt(macParts[i], 16)
	}

	buffer[12] = version.length
	buffer.set(version, 13)
	const hostnameLenOffset = 13 + version.length
	buffer[hostnameLenOffset] = hostname.length
	buffer.set(hostname, hostnameLenOffset + 1)
	return buffer
}

/** Device status. Serialized as: [uptime(4), heap(4), rssi(1), metrics?(32), debug?(48)] */
export type Status = {
	uptime: number // seconds since boot
	heap: number // free heap bytes
	rssi: number // WiFi RSSI in dBm (signed)
	internalHeap?: number // free internal RAM bytes
	largestHeapBlock?: number // largest free 8-bit-capable heap block
	minHeap?: number // minimum free heap seen since boot
	framesReceived?: number // valid SET_LEDS packets accepted
	framesShown?: number // frames submitted to RMT
	framesDropped?: number // frames dropped because RMT was busy
	udpPacketsRead?: number // UDP packets read by the firmware socket
	protocolLoopMaxGapMs?: number // max observed gap between protocol_loop calls
	arrivalGapHist?: number[] // benchmark SET_LEDS inter-arrival histogram: ≤5, ≤10, ≤20, ≤50, ≤100, >100 ms
	arrivalGapMaxMs?: number // largest benchmark SET_LEDS inter-arrival gap (gaps >2s count as stream pauses, not stalls)
	arrivalGapMaxAgeS?: number // seconds since that largest gap occurred
	seqLost?: number // benchmark SET_LEDS sequence gaps; id 0 is untracked
	seqReordered?: number // SET_LEDS packets that arrived out of order
	beaconTimeouts?: number // WiFi beacon-timeout events since boot
	wifiDisconnects?: number // WiFi disconnect events since boot
}

/** Number of buckets in Status.arrivalGapHist */
export const ARRIVAL_GAP_BUCKETS = 6
/** Upper bounds (ms) of the first 5 arrivalGapHist buckets; the 6th is open-ended */
export const ARRIVAL_GAP_BOUNDS_MS = [5, 10, 20, 50, 100] as const

/** Convert a status buffer to a Status object */
export function bufferToStatus(buffer: Uint8Array): Status {
	if (buffer.length < 9)
		throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`)

	const uptime =
		((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0
	const heap =
		((buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7]) >>> 0
	const rssi = buffer[8] << 24 >> 24 // sign-extend int8

	const readU32 = (offset: number) =>
		((buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3]) >>> 0

	const status: Status = { uptime, heap, rssi }
	if (buffer.length >= 41) {
		status.internalHeap = readU32(9)
		status.largestHeapBlock = readU32(13)
		status.minHeap = readU32(17)
		status.framesReceived = readU32(21)
		status.framesShown = readU32(25)
		status.framesDropped = readU32(29)
		status.udpPacketsRead = readU32(33)
		status.protocolLoopMaxGapMs = readU32(37)
	}
	if (buffer.length >= 89) {
		status.arrivalGapHist = Array.from({ length: ARRIVAL_GAP_BUCKETS }, (_, i) => readU32(41 + i * 4))
		status.arrivalGapMaxMs = readU32(65)
		status.arrivalGapMaxAgeS = readU32(69)
		status.seqLost = readU32(73)
		status.seqReordered = readU32(77)
		status.beaconTimeouts = readU32(81)
		status.wifiDisconnects = readU32(85)
	}
	return status
}

/** Convert a Status object to its wire payload: [uptime(4 BE), heap(4 BE), rssi(1, int8), metrics?(32), debug?(48)] */
export function statusToBuffer(status: Status): Uint8Array {
	const hasDebug = status.arrivalGapHist !== undefined ||
		status.arrivalGapMaxMs !== undefined ||
		status.arrivalGapMaxAgeS !== undefined ||
		status.seqLost !== undefined ||
		status.seqReordered !== undefined ||
		status.beaconTimeouts !== undefined ||
		status.wifiDisconnects !== undefined
	const hasMetrics = hasDebug ||
		status.internalHeap !== undefined ||
		status.largestHeapBlock !== undefined ||
		status.minHeap !== undefined ||
		status.framesReceived !== undefined ||
		status.framesShown !== undefined ||
		status.framesDropped !== undefined ||
		status.udpPacketsRead !== undefined ||
		status.protocolLoopMaxGapMs !== undefined
	const buffer = new Uint8Array(hasDebug ? 89 : hasMetrics ? 41 : 9)
	buffer[0] = (status.uptime >>> 24) & 0xff
	buffer[1] = (status.uptime >>> 16) & 0xff
	buffer[2] = (status.uptime >>> 8) & 0xff
	buffer[3] = status.uptime & 0xff
	buffer[4] = (status.heap >>> 24) & 0xff
	buffer[5] = (status.heap >>> 16) & 0xff
	buffer[6] = (status.heap >>> 8) & 0xff
	buffer[7] = status.heap & 0xff
	buffer[8] = status.rssi & 0xff // int8 written as a raw byte
	if (hasMetrics) {
		const writeU32 = (offset: number, value = 0) => {
			buffer[offset] = (value >>> 24) & 0xff
			buffer[offset + 1] = (value >>> 16) & 0xff
			buffer[offset + 2] = (value >>> 8) & 0xff
			buffer[offset + 3] = value & 0xff
		}
		writeU32(9, status.internalHeap)
		writeU32(13, status.largestHeapBlock)
		writeU32(17, status.minHeap)
		writeU32(21, status.framesReceived)
		writeU32(25, status.framesShown)
		writeU32(29, status.framesDropped)
		writeU32(33, status.udpPacketsRead)
		writeU32(37, status.protocolLoopMaxGapMs)
		if (hasDebug) {
			for (let i = 0; i < ARRIVAL_GAP_BUCKETS; i++) {
				writeU32(41 + i * 4, status.arrivalGapHist?.[i])
			}
			writeU32(65, status.arrivalGapMaxMs)
			writeU32(69, status.arrivalGapMaxAgeS)
			writeU32(73, status.seqLost)
			writeU32(77, status.seqReordered)
			writeU32(81, status.beaconTimeouts)
			writeU32(85, status.wifiDisconnects)
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
