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
import { Device, Mock } from "./types"

// Internal map of address to buffer
const addressBufferMap = new Map<DeviceIP, DeviceAddress>()
let mock: Mock | false = false

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
export function begin(serverURL: string, debug = false, _mock: Mock | false = false): Promise<boolean> {
	logger.level = debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR
	mock = _mock
	console.log("mock", mock)
	if (mock) return Promise.resolve(true)

	return wsconnect(serverURL, debug)
}

// (Sync) Send a ping message to the server and wait for the response.
export function ping(ip: DeviceIP, port = 4210): Promise<boolean> {
	if (mock) {
		const device = mock.devices.find(d => d.ip === ip)
		return Promise.resolve(!!device)
	}

	const packet = createPacket(ip, port, PacketType.PING)

	return sendSync(packet).then(response => response.length === 1 && response[0] === TRUE)
}

// (Sync) Get the configuration of the device.
export function getConfig(ip: DeviceIP, port = 4210): Promise<Config | null> {
	if (mock) {
		const device = mock.devices.find(d => d.ip === ip)
		return Promise.resolve(device ? ({ brightness: 255, port: 4210, pin: 18, ...device.config } as Config) : null)
	}

	const packet = createPacket(ip, port, PacketType.GET_CONFIG)

	return sendSync(packet).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToConfig(response)
	})
}

// (Async) Set the RGB LEDs of the device.
export function setLEDs(ip: DeviceIP, port = 4210, leds: Uint8Array) {
	if (mock) return

	return send(createPacket(ip, port, PacketType.SET_LEDS, leds))
}

export async function connect(ip: DeviceIP, port = 4210): Promise<Device | null> {
	let config: Config | null = null

	if (mock) {
		const deviceConfig = mock.devices.find(d => d.ip === ip)
		config = deviceConfig ? ({ brightness: 255, port: 4210, pin: 18, ...deviceConfig } as any as Config) : null
	} else {
		const result = await ping(ip, port)
		config = result ? await getConfig(ip, port) : null
	}

	if (!config) return null

	return {
		config,
		send: (leds: Uint8Array) => setLEDs(ip, port, leds),
		// map: (pixels: Uint8Array) => mapPixels(config, pixels),
		isValidMapping: (srcWidth: number, srcHeight: number, x0: number, y0: number, x1: number, y1: number) => {
			// TODO: Implement a check for valid mapping
			return true
		},
	}
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
