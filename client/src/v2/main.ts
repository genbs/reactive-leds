import { LOG_LEVEL, logger } from "@shared"
import { bufferToConfig, Config, PacketType } from "../../../shared/protocol"
import { WorkerRequestType } from "./comm"
import { connect, send, sendSync } from "./proxy"

// initialize the connection to the server in the worker
function begin(serverUrl: string, debug = false): Promise<boolean> {
	if (debug) {
		logger.setLevel(LOG_LEVEL.DEBUG)
	} else {
		logger.setLevel(LOG_LEVEL.ERROR)
	}
	console.log("debug", debug, logger.getLevel())

	return connect(serverUrl, debug)
}

function createPacket(ip: string, port: number, type: PacketType, data?: Uint8Array): Uint8Array {
	const addressPacket = addressToBuffer(ip, port)
	const buffer = new Uint8Array(1 + addressPacket.length + 1 + (data ? data.length : 0))
	buffer[0] = WorkerRequestType.Send
	buffer.set(addressPacket, 1)
	buffer[addressPacket.length + 1] = type

	if (data) buffer.set(data, 1 + addressPacket.length + 1)

	return buffer
}

function ping(address: string, port = 4210): Promise<boolean> {
	return sendSync(createPacket(address, port, PacketType.PING)).then(response => response[0] === 1)
}

function getConfig(address: string, port = 4210): Promise<Config | null> {
	return sendSync(createPacket(address, port, PacketType.GET_CONFIG)).then(response => {
		if (response.length === 1 && response[0] === 0) return null

		const config = bufferToConfig(response)
		previusLEDs = new Uint8Array(config.num_leds * 4)
		return config
	})
}

// [r, g, b, brightness, r, g, b, brightness, ...]
let previusLEDs: Uint8Array = new Uint8Array(0)
function setLEDs(address: string, port = 4210, leds: Uint8Array) {
	// const buffer = new Uint8Array(leds.length)
	// let toUpdate = 0

	// for (let i = 0; i < leds.length; i += 5) {
	// 	const pixel_index = leds[i]
	// 	const r = leds[i + 1]
	// 	const g = leds[i + 2]
	// 	const b = leds[i + 3]
	// 	const brightness = leds[i + 4]

	// 	if (
	// 		previusLEDs[pixel_index] === r &&
	// 		previusLEDs[pixel_index + 1] === g &&
	// 		previusLEDs[pixel_index + 2] === b &&
	// 		previusLEDs[pixel_index + 3] === brightness
	// 	) {
	// 		console.log("skip")
	// 		continue
	// 	} else {
	// 		toUpdate++

	// 		previusLEDs[pixel_index] = r
	// 		previusLEDs[pixel_index + 1] = g
	// 		previusLEDs[pixel_index + 2] = b
	// 		previusLEDs[pixel_index + 3] = brightness

	// 		const newIndex = toUpdate * 5
	// 		buffer[newIndex] = pixel_index
	// 		buffer[newIndex + 1] = r
	// 		buffer[newIndex + 2] = g
	// 		buffer[newIndex + 3] = b
	// 		buffer[newIndex + 4] = brightness
	// 	}
	// }

	return send(createPacket(address, port, PacketType.SET_LEDS, leds))
}

function addressToBuffer(address: string, port: number): Uint8Array {
	const buffer = new Uint8Array(4 + 2)

	const ip = address.split(".")
	for (let i = 0; i < 4; i++) buffer[i] = parseInt(ip[i])
	buffer[4] = (port >> 8) & 0xff
	buffer[5] = port & 0xff

	return buffer
}

export default {
	begin,
	ping,
	getConfig,
	setLEDs,
}
