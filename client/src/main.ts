/**
 * The core of the library is a communication with the worker. The worker is directly connected to the server by a websocket.
 *
 * Each request accepted by the server is composed of a packet of this type (in uint8array format):
 * [RequestID, DEVICE_ADDRESS, DEVICE_PORT, PACKET_TYPE, DATA]
 *
 * The packets must be sent to the server through the worker, so the packet needs to be modified by adding an enumerator
 * that helps the worker understand what to do with the message, whether to handle it internally (like a 'connect' request) or route it to the server.
 */
import {
	addressToBuffer,
	bufferToConfig,
	Config,
	DeviceAddress,
	DeviceIP,
	LOG_LEVEL,
	logger,
	PacketType,
} from "@leds/shared"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { mapPixels } from "./mapping"
import { isConnected, onConnectionChange, send, sendSync, wsconnect } from "./proxy"

// Internal map of address to buffer
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
	buffer[0] = WorkerRequestType.Send // the worker will route this packet to the server
	buffer.set(addressPacket, 1)
	buffer[1 + addrLen] = type

	if (data) buffer.set(data, 1 + addrLen + 1)

	return buffer
}

/**
 * (Sync) With this function you can connect to the server, it's necessary to call this function before any other function.
 * With the debug parameter you can enable the debug mode, the library will print more information in the console.
 */
export function begin(serverURL: string, debug = false): Promise<boolean> {
	logger.level = debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR

	return wsconnect(serverURL, debug)
}

// (Sync) Send a ping message to the server and wait for the response.
export function ping(ip: DeviceIP, port = 4210): Promise<boolean> {
	const packet = createPacket(ip, port, PacketType.PING)

	return sendSync(packet).then(response => response[0] === TRUE)
}

// (Sync) Get the configuration of the device.
export function getConfig(ip: DeviceIP, port = 4210): Promise<Config | null> {
	const packet = createPacket(ip, port, PacketType.GET_CONFIG)

	return sendSync(packet).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToConfig(response)
	})
}

// (Async) Set the RGB LEDs of the device.
export function setLEDs(ip: DeviceIP, port = 4210, leds: Uint8Array) {
	return send(createPacket(ip, port, PacketType.SET_LEDS, leds))
}

type Device = {
	config: Config
	send: (leds: Uint8Array) => void
}

export async function connect(ip: DeviceIP, port = 4210): Promise<Device | null> {
	const result = await ping(ip, port)
	if (result) {
		const config = await getConfig(ip, port)
		if (!config) return null

		return {
			config,
			send: (leds: Uint8Array) => setLEDs(ip, port, leds),
		}
	}

	return null
}

const leds = {
	begin,
	onConnectionChange,
	isConnected,

	connect,

	ping,
	getConfig,
	setLEDs,
	mapPixels,
}

export default leds
