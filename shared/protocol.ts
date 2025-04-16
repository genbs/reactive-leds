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

export type LEDs = Uint8Array // [pixel_index, r, g, b, b/w, pixel_index, r, g, b, b/w, ...] (5 bytes per LED)

// Used by the device to send the response status
export enum PacketStatus {
	OK = 1,
	ERROR = 0,
}

export type DeviceAddress = string

export const EMPTY_PACKET_ID = 0

// Label for the packet types
export const PacketTypeMap = {
	[PacketType.PING]: "PING",
	[PacketType.GET_CONFIG]: "GET_CONFIG",
	[PacketType.SET_CONFIG]: "SET_CONFIG",
	[PacketType.SET_LEDS]: "SET_LEDS",
}

// convert a buffer to a config object
export function bufferToConfig(buffer: Uint8Array): Config {
	return {
		pin: buffer[0],
		num_leds: buffer[1],
		brightness: buffer[2],
		port: (buffer[3] << 8) | buffer[4],
		hostname: bufferToString(buffer.slice(5)),
	}
}

// convert a config object to a buffer, no validation
export function configToBuffer(config: Config): Uint8Array {
	const pin = config.pin
	const num_leds = config.num_leds
	const brightness = config.brightness // 0-255
	const port = config.port
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

// convert ip and port to a buffer
export function addressToBuffer(ip: DeviceAddress, port: number): Uint8Array {
	const buffer = new Uint8Array(4 + 2)
	const parts = ip.split(".")

	buffer[0] = +parts[0]
	buffer[1] = +parts[1]
	buffer[2] = +parts[2]
	buffer[3] = +parts[3]
	buffer[4] = (port >> 8) & 0xff
	buffer[5] = port & 0xff

	return buffer
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function bufferFromString(str: string): Uint8Array {
	return encoder.encode(str)
}

export function bufferToString(buffer: Uint8Array): string {
	return decoder.decode(
		buffer.subarray(0, buffer.indexOf(0)) // break at the first \0
	)
}
