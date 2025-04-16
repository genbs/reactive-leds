/**
 * The core of the library is a communication with the worker. The worker is directly connected to the server by a websocket.
 *
 * Each request accepted by the server is composed of a packet of this type (in uint8array format):
 * [RequestID, DEVICE_ADDRESS, DEVICE_PORT, PACKET_TYPE, DATA]
 *
 * The packets must be sent to the server through the worker, so the packet needs to be modified by adding an enumerator
 * that helps the worker understand what to do with the message, whether to handle it internally (like a 'connect' request) or route it to the server.
 */
import { LOG_LEVEL, logger } from "@shared"
import { addressToBuffer, bufferToConfig, Config, PacketType } from "../../../shared/protocol"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { connect, send, sendSync } from "./proxy"

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
function setLEDs(address: string, port = 4210, leds: Uint8Array) {
	return send(createPacket(address, port, PacketType.SET_LEDS, leds))
}

const addressBufferMap = new Map<string /* deviceIP */, Uint8Array>()

// Create a packet to send to the worker and then to the server.
function createPacket(ip: string, port: number, type: PacketType, data?: Uint8Array): Uint8Array {
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

export default {
	begin,
	ping,
	getConfig,
	setLEDs,
	mapPixels,
}

export function step(t: number, xStart: number, yStart: number, xEnd: number, yEnd: number): [number, number] {
	const x = (1 - t) * xStart + t * xEnd
	const y = (1 - t) * yStart + t * yEnd
	return [x, y]
}

export function mapPixels(
	pixels: Uint8Array,
	pixelsSize: [number, number],
	grid: [number, number],
	polygon: [number, number, number, number, number, number, number, number], // x0, y0, x1, y1, x2, y2, x3, y3
	num_leds: number,
	alphaIsBrightness: number | boolean | ((r: number, g: number, b: number) => number) = false
): Uint8Array {
	const [imgWidth, imgHeight] = pixelsSize
	const [cells, rows] = grid

	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	// [pixel_index, r, g, b, a]
	const output = new Uint8Array(num_leds * 5)

	const invSteps = 1 / num_leds

	for (let i = 0; i < num_leds; i++) {
		const offset1 = i * invSteps
		const offset2 = (i + 1) * invSteps

		// linear interpolation
		const [px0, py0] = step(offset1, x0, y0, x3, y3)
		const [px1, py1] = step(offset2, x1, y1, x2, y2)

		const px = px0 + (px1 - px0) * 0.5
		const py = py0 + (py1 - py0) * 0.5

		let sx = Math.round(px * cellWidth)
		let sy = Math.round(py * cellHeight)

		if (sx < 0) sx = 0
		else if (sx >= imgWidth) sx = imgWidth - 1
		if (sy < 0) sy = 0
		else if (sy >= imgHeight) sy = imgHeight - 1

		const srcIndex = (sy * imgWidth + sx) << 2
		const dstIndex = i * 5

		output[dstIndex] = i
		output[dstIndex + 1] = pixels[srcIndex]
		output[dstIndex + 2] = pixels[srcIndex + 1]
		output[dstIndex + 3] = pixels[srcIndex + 2]
		output[dstIndex + 4] =
			typeof alphaIsBrightness === "function"
				? (alphaIsBrightness as Function)(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
				: typeof alphaIsBrightness === "number"
				? alphaIsBrightness
				: alphaIsBrightness
				? pixels[srcIndex + 3]
				: 0
	}
	return output
}
