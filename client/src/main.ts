/**
 * The core of the library is a communication with the worker. The worker is directly connected to the server by a websocket.
 *
 * Each request accepted by the server is composed of a packet of this type (in uint8array format):
 * [RequestID, DEVICE_ADDRESS, DEVICE_PORT, PACKET_TYPE, DATA]
 *
 * The packets must be sent to the server through the worker, so the packet needs to be modified by adding an enumerator
 * that helps the worker understand what to do with the message, whether to handle it internally (like a 'connect' request) or route it to the server.
 */
import { addressToBuffer, bufferToConfig, Config, DeviceAddress, LOG_LEVEL, logger, PacketType } from "@leds/shared"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { mapPixels } from "./mapping"
import { connect, send, sendSync } from "./proxy"

// Internal map of address to buffer
const addressBufferMap = new Map<DeviceAddress, Uint8Array>()

// @internal Create a packet to send to the worker and then to the server.
function createPacket(ip: DeviceAddress, port: number, type: PacketType, data?: Uint8Array): Uint8Array {
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
function begin(serverUrl: string, debug = false): Promise<boolean> {
	logger.setLevel(debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR)

	return connect(serverUrl, debug)
}

// (Sync) Send a ping message to the server and wait for the response.
function ping(address: string, port = 4210): Promise<boolean> {
	const packet = createPacket(address, port, PacketType.PING)

	return sendSync(packet).then(response => response[0] === TRUE)
}

// (Sync) Get the configuration of the device.
function getConfig(address: string, port = 4210): Promise<Config | null> {
	const packet = createPacket(address, port, PacketType.GET_CONFIG)

	return sendSync(packet).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null

		return bufferToConfig(response)
	})
}

// (Async) Set the RGB LEDs of the device.
function setLEDs(address: DeviceAddress, port = 4210, leds: Uint8Array) {
	return send(createPacket(address, port, PacketType.SET_LEDS, leds))
}

export default {
	begin,
	ping,
	getConfig,
	setLEDs,
	mapPixels,
}
