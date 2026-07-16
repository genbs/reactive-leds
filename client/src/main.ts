import {
	AddressBuffer,
	addressToBuffer,
	bufferToConfig,
	bufferToDeviceInfo,
	bufferToStatus,
	Config,
	DeviceInfo,
	IP,
	ledsToBuffer,
	PacketType,
	Status,
} from "@reactive-leds/shared"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { sample } from "./mapping"
import { isConnected, onConnectionChange, send, sendSync, wsconnect } from "./proxy"

export { isConnected, sample, onConnectionChange }
import { Device } from "./types"

const addressBuffers = new Map<string, AddressBuffer>()

// @internal Create a packet to send to the worker and then to the server.
function createPacket(ip: IP, port: number, type: PacketType, data?: Uint8Array): Uint8Array {
	const address = `${ip}:${port}`
	let addressPacket = addressBuffers.get(address)

	if (!addressPacket) {
		addressPacket = addressToBuffer(ip, port)
		addressBuffers.set(address, addressPacket)
	}

	const addrLen = addressPacket.length
	const dataLen = data ? data.length : 0
	const totalLen = 2 + addrLen + 1 + dataLen

	let offset = 1 // request ID is filled by send/sendSync
	const buffer = new Uint8Array(totalLen)
	buffer[offset++] = WorkerRequestType.Send
	buffer.set(addressPacket, offset)
	offset += addrLen

	buffer[offset++] = type

	if (data) buffer.set(data, offset)

	return buffer
}

/** Connect to the proxy server. Must be called before any other function. */
export function begin(serverURL: string, debug = false): Promise<boolean> {
	return wsconnect(serverURL, debug)
}

/** Send a ping to the device and wait for the response. */
export function ping(ip: IP, port = 4210): Promise<boolean> {
	return sendSync(createPacket(ip, port, PacketType.PING)).then(
		response => response.length === 1 && response[0] === TRUE
	).catch(() => false)
}

/** Get the configuration of the device. */
export function getConfig(ip: IP, port = 4210): Promise<Config | null> {
	return sendSync(createPacket(ip, port, PacketType.GET_CONFIG)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToConfig(response)
	}).catch(() => null)
}

/** Get device identity: IP, port, MAC, hostname and firmware version. */
export function getInfo(ip: IP, port = 4210): Promise<DeviceInfo | null> {
	return sendSync(createPacket(ip, port, PacketType.GET_INFO)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToDeviceInfo(response)
	}).catch(() => null)
}

/** Get device status: uptime, heap, WiFi RSSI and optional metrics. */
export function getStatus(ip: IP, port = 4210): Promise<Status | null> {
	return sendSync(createPacket(ip, port, PacketType.GET_STATUS)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToStatus(response)
	}).catch(() => null)
}

/** Send LED colors to the device — fire-and-forget, no response expected. */
export function setLEDs(ip: IP, port = 4210, leds: Uint8Array, startIndex = 0): void {
	send(createPacket(ip, port, PacketType.SET_LEDS, ledsToBuffer(leds, startIndex)))
}

/** Ping the device and fetch its config. Returns null if unreachable. */
export async function connect(ip: IP, port = 4210): Promise<Device | null> {
	const alive = await ping(ip, port)
	if (!alive) return null

	const config = await getConfig(ip, port)
	if (!config) return null

	return {
		config,
		send: (leds: Uint8Array, startIndex = 0) => setLEDs(ip, port, leds, startIndex),
		sendRaw: (type: PacketType, data?: Uint8Array) => sendRaw(ip, port, type, data),
		sendRawSync: (type: PacketType, data?: Uint8Array) => sendRawSync(ip, port, type, data),
	}
}

export { PacketType }

/**
 * Send a raw protocol packet — any PacketType, fire-and-forget.
 * Escape hatch for the packet types the high-level API doesn't wrap
 * (e.g. SET_CONFIG, RESET_WIFI). For request/response types use sendRawSync.
 */
export function sendRaw(ip: IP, port: number, type: PacketType, data?: Uint8Array): void {
	send(createPacket(ip, port, type, data))
}

/**
 * Send a raw protocol packet and wait for the response payload as relayed by
 * the proxy: `[status]` for status-only replies (1 = OK), or the response
 * data (e.g. the info payload bytes for GET_INFO).
 */
export function sendRawSync(ip: IP, port: number, type: PacketType, data?: Uint8Array): Promise<Uint8Array> {
	return sendSync(createPacket(ip, port, type, data))
}

const reactiveLeds = {
	begin,
	onConnectionChange,
	isConnected,
	connect,
	ping,
	getInfo,
	getConfig,
	getStatus,
	setLEDs,
	sendRaw,
	sendRawSync,
	sample,
	PacketType,
}

export default reactiveLeds
