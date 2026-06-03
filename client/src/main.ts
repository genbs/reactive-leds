import {
	addressToBuffer,
	bufferToConfig,
	bufferToStatus,
	Config,
	DeviceAddress,
	DeviceIP,
	PacketType,
	Status,
} from "@reactive-leds/shared"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { mapPixels } from "./mapping"
import { isConnected, onConnectionChange, send, sendSync, wsconnect } from "./proxy"

export { isConnected, mapPixels, onConnectionChange }
import { Device } from "./types"

const addressBufferMap = new Map<DeviceIP, DeviceAddress>()

// @internal Create a packet to send to the worker and then to the server.
function createPacket(ip: DeviceIP, port: number, type: PacketType, data?: Uint8Array): Uint8Array {
	let addressPacket = addressBufferMap.get(ip)

	if (!addressPacket) {
		addressPacket = addressToBuffer(ip, port)
		addressBufferMap.set(ip, addressPacket)
	}

	const addrLen = addressPacket.length
	const dataLen = data ? data.length : 0
	const totalLen = 1 + addrLen + 1 + dataLen

	const buffer = new Uint8Array(totalLen)
	buffer[0] = WorkerRequestType.Send
	buffer.set(addressPacket, 1)
	buffer[1 + addrLen] = type

	if (data) buffer.set(data, 1 + addrLen + 1)

	return buffer
}

/** Connect to the proxy server. Must be called before any other function. */
export function begin(serverURL: string, debug = false): Promise<boolean> {
	return wsconnect(serverURL, debug)
}

/** Send a ping to the device and wait for the response. */
export function ping(ip: DeviceIP, port = 4210): Promise<boolean> {
	return sendSync(createPacket(ip, port, PacketType.PING)).then(
		response => response.length === 1 && response[0] === TRUE
	)
}

/** Get the configuration of the device. */
export function getConfig(ip: DeviceIP, port = 4210): Promise<Config | null> {
	return sendSync(createPacket(ip, port, PacketType.GET_CONFIG)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToConfig(response)
	})
}

/** Get device status: uptime (seconds), free heap (bytes), WiFi RSSI (dBm). */
export function getStatus(ip: DeviceIP, port = 4210): Promise<Status | null> {
	return sendSync(createPacket(ip, port, PacketType.GET_STATUS)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToStatus(response)
	})
}

/** Send LED colors to the device — fire-and-forget, no response expected. */
export function setLEDs(ip: DeviceIP, port = 4210, leds: Uint8Array): void {
	send(createPacket(ip, port, PacketType.SET_LEDS, leds))
}

/** Ping the device and fetch its config. Returns null if unreachable. */
export async function connect(ip: DeviceIP, port = 4210): Promise<Device | null> {
	const alive = await ping(ip, port)
	if (!alive) return null

	const config = await getConfig(ip, port)
	if (!config) return null

	return {
		config,
		send: (leds: Uint8Array) => setLEDs(ip, port, leds),
	}
}

const reactiveLeds = {
	begin,
	onConnectionChange,
	isConnected,
	connect,
	ping,
	getConfig,
	getStatus,
	setLEDs,
	mapPixels,
}

export default reactiveLeds
