// Packet [MessageID, MessageType, PORT_H, PORT_L, ID, NUM_LEDS, BRIGHTNESS, HOSTNAME...]
export type Config = {
	hostname: string
	port: number
	pin: number
	num_leds: number
	brightness: number
}

export type PacketID = number

/**
 * Color format: [r, g, b, b/w]
 */
export type Color = [number, number, number, number]

export enum PacketType {
	PING = 0,
	GET_CONFIG = 1,
	SET_CONFIG = 2,
	SET_LEDS = 3,
	BLINK = 4,
}

// Used by the device to send the response status
export enum PacketStatus {
	OK = 1,
	ERROR = 0,
}

export type Packet = Uint8Array // [PacketID, PacketType, ...number[]]

export const EMPTY_PACKET_ID = 0

export const PacketTypeMap = {
	[PacketType.PING]: "PING",
	[PacketType.GET_CONFIG]: "GET_CONFIG",
	[PacketType.SET_CONFIG]: "SET_CONFIG",
	[PacketType.SET_LEDS]: "SET_COLORS",
	[PacketType.BLINK]: "BLINK",
}

export function bufferToConfig(buffer: Uint8Array): Config {
	return {
		pin: buffer[0],
		num_leds: buffer[1],
		brightness: buffer[2],
		port: (buffer[3] << 8) | buffer[4],
		hostname: bufferToString(buffer.slice(5)),
	}
}

export function configToBuffer(config: Config): Uint8Array {
	const pin = Number(config.pin)
	const num_leds = Number(config.num_leds)
	const brightness = Number(config.brightness) // 0-255
	const port = Number(config.port)
	const hostname = config.hostname.substring(0, 32)

	const packet = new Uint8Array(1 + 1 + 1 + 2 + hostname.length) // pin, num_leds, brightness, port_h, port_l, hostname
	packet[0] = pin
	packet[1] = num_leds
	packet[2] = brightness
	packet[3] = (port >> 8) & 0xff
	packet[4] = port & 0xff
	packet.set(bufferFromString(hostname), 5)

	return packet
}

export function bufferFromString(str: string): Uint8Array {
	const buffer = new Uint8Array(str.length)
	for (let i = 0; i < str.length; i++) buffer[i] = str.charCodeAt(i)

	return buffer
}

export function bufferToString(buffer: Uint8Array): string {
	let result = ""
	for (let i = 0; i < buffer.length; i++) {
		if (buffer[i] === 0) break

		result += String.fromCharCode(buffer[i])
	}

	return result
}
