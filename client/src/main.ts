import {
	AddressBuffer,
	addressToBuffer,
	bufferToConfig,
	bufferToDeviceInfo,
	bufferToStatus,
	Config,
	DeviceInfo,
	IP,
	PacketType,
	Status,
	validateLEDs,
} from "@reactive-leds/shared"
import { FALSE, TRUE, WorkerRequestType } from "./comm"
import { sample } from "./mapping"
import { isConnected, onConnectionChange, send, sendSync, wsconnect } from "./proxy"
import type { Device, DeviceGroup, DeviceMapping, Mapping, Pixels, WhiteChannel } from "./types"

export { isConnected, sample, onConnectionChange }
export type { Device, DeviceGroup, DeviceMapping, Grid, Mapping, Pixels, Polygon, WhiteChannel } from "./types"

const addressBuffers = new Map<string, AddressBuffer>()

function formatAddress(ip: IP, port: number): string {
	return `${Array.isArray(ip) ? ip.join(".") : ip}:${port}`
}

function getAddressBuffer(ip: IP, port: number): AddressBuffer {
	const address = formatAddress(ip, port)
	let addressBuffer = addressBuffers.get(address)

	if (!addressBuffer) {
		addressBuffer = addressToBuffer(ip, port)
		addressBuffers.set(address, addressBuffer)
	}

	return addressBuffer
}

// @internal Create a packet to send to the worker and then to the server.
function createPacket(address: AddressBuffer, type: PacketType, data?: Uint8Array, dataPrefix?: number): Uint8Array {
	const addrLen = address.length
	const dataLen = (data ? data.length : 0) + (dataPrefix === undefined ? 0 : 1)
	const totalLen = 2 + addrLen + 1 + dataLen

	let offset = 1 // request ID is filled by send/sendSync
	const buffer = new Uint8Array(totalLen)
	buffer[offset++] = WorkerRequestType.Send
	buffer.set(address, offset)
	offset += addrLen

	buffer[offset++] = type

	if (dataPrefix !== undefined) buffer[offset++] = dataPrefix
	if (data) buffer.set(data, offset)

	return buffer
}

/** Connect to the proxy server. Must be called before any other function. */
export function begin(serverURL: string, debug = false): Promise<boolean> {
	return wsconnect(serverURL, debug)
}

/** Send a ping to the device and wait for the response. */
export function ping(ip: IP, port = 4210): Promise<boolean> {
	return pingAddress(getAddressBuffer(ip, port))
}

function pingAddress(address: AddressBuffer): Promise<boolean> {
	return sendSync(createPacket(address, PacketType.PING)).then(
		response => response.length === 1 && response[0] === TRUE
	).catch(() => false)
}

/** Get the configuration of the device. */
export function getConfig(ip: IP, port = 4210): Promise<Config | null> {
	return getConfigAddress(getAddressBuffer(ip, port))
}

function getConfigAddress(address: AddressBuffer): Promise<Config | null> {
	return sendSync(createPacket(address, PacketType.GET_CONFIG)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToConfig(response)
	}).catch(() => null)
}

/** Get device identity: IP, port, MAC, hostname and firmware version. */
export function getInfo(ip: IP, port = 4210): Promise<DeviceInfo | null> {
	return sendSync(createPacket(getAddressBuffer(ip, port), PacketType.GET_INFO)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToDeviceInfo(response)
	}).catch(() => null)
}

/** Get the fixed runtime-status snapshot: uptime, memory, LED and WiFi counters. */
export function getStatus(ip: IP, port = 4210): Promise<Status | null> {
	return sendSync(createPacket(getAddressBuffer(ip, port), PacketType.GET_STATUS)).then(response => {
		if (response.length === 1 && response[0] === FALSE) return null
		return bufferToStatus(response)
	}).catch(() => null)
}

/** Send LED colors to the device — fire-and-forget, no response expected. */
export function setLEDs(ip: IP, port = 4210, leds: Uint8Array, startIndex = 0): void {
	setLEDsAddress(getAddressBuffer(ip, port), leds, startIndex)
}

function setLEDsAddress(address: AddressBuffer, leds: Uint8Array, startIndex = 0): void {
	validateLEDs(leds, startIndex)
	send(createPacket(address, PacketType.SET_LEDS, leds, startIndex))
}

const defaultDeviceMapping: DeviceMapping = {
	grid: [1, 1],
	polygon: [0, 0, 1, 0, 1, 1, 0, 1],
}

/** Ping the device and fetch its config. Returns null if unreachable. */
export async function connect(ip: IP, port = 4210, deviceMapping = defaultDeviceMapping): Promise<Device | null> {
	const addressBuffer = getAddressBuffer(ip, port)
	const alive = await pingAddress(addressBuffer)
	if (!alive) return null

	const config = await getConfigAddress(addressBuffer)
	if (!config) return null
	const address = formatAddress(ip, port)
	const numLEDs = config.num_leds
	const data = new Uint8Array(numLEDs * 4)
	const { grid, polygon } = deviceMapping

	function sampleDevice(imageData: ImageData, whiteChannel?: WhiteChannel): Uint8Array
	function sampleDevice(pixels: Pixels, width: number, height: number, whiteChannel?: WhiteChannel): Uint8Array
	function sampleDevice(
		source: ImageData | Pixels,
		widthOrWhite: number | WhiteChannel = 0,
		height = 0,
		whiteChannel: WhiteChannel = 0
	): Uint8Array {
		if (!ArrayBuffer.isView(source)) {
			return sample(source.data, [source.width, source.height], grid, polygon, numLEDs, widthOrWhite as WhiteChannel, data)
		}

		return sample(source, [widthOrWhite as number, height], grid, polygon, numLEDs, whiteChannel, data)
	}

	return {
		address,
		config,
		grid,
		polygon,
		data,
		send: (leds: Uint8Array, startIndex = 0) => setLEDsAddress(addressBuffer, leds, startIndex),
		sendRaw: (type: PacketType, data?: Uint8Array) => send(createPacket(addressBuffer, type, data)),
		sendRawSync: (type: PacketType, data?: Uint8Array) => sendSync(createPacket(addressBuffer, type, data)),
		sample: sampleDevice,
	}
}

function parseAddress(address: string): [string, number] {
	const separator = address.lastIndexOf(":")
	const ip = address.slice(0, separator)
	const port = Number(address.slice(separator + 1))

	if (separator < 1 || !ip || !Number.isInteger(port) || port < 1 || port > 65535) {
		throw new TypeError(`Invalid device address "${address}"; expected "ip:port"`)
	}

	return [ip, port]
}

/** Connect every device in a mapping, dropping unreachable devices. */
export async function mapping(config: Mapping): Promise<DeviceGroup> {
	const devices = await Promise.all(
		Object.entries(config.devices).map(async ([address, polygon]) => {
			const [ip, port] = parseAddress(address)
			return connect(ip, port, { grid: config.grid, polygon })
		})
	)

	const group = devices.filter((device): device is Device => device !== null) as DeviceGroup

	function frame(imageData: ImageData, whiteChannel?: WhiteChannel): DeviceGroup
	function frame(pixels: Pixels, width: number, height: number, whiteChannel?: WhiteChannel): DeviceGroup
	function frame(
		source: ImageData | Pixels,
		widthOrWhite: number | WhiteChannel = 0,
		height = 0,
		whiteChannel: WhiteChannel = 0
	): DeviceGroup {
		for (const device of group) {
			const data = ArrayBuffer.isView(source)
				? device.sample(source, widthOrWhite as number, height, whiteChannel)
				: device.sample(source, widthOrWhite as WhiteChannel)
			device.send(data)
		}

		return group
	}

	group.frame = frame
	return group
}

export { PacketType }

/**
 * Send a raw protocol packet — any PacketType, fire-and-forget.
 * Escape hatch for the packet types the high-level API doesn't wrap
 * (e.g. SET_CONFIG, RESET_WIFI). For request/response types use sendRawSync.
 */
export function sendRaw(ip: IP, port: number, type: PacketType, data?: Uint8Array): void {
	send(createPacket(getAddressBuffer(ip, port), type, data))
}

/**
 * Send a raw protocol packet and wait for the response payload as relayed by
 * the proxy: `[status]` for status-only replies (1 = OK), or the response
 * data (e.g. the info payload bytes for GET_INFO).
 */
export function sendRawSync(ip: IP, port: number, type: PacketType, data?: Uint8Array): Promise<Uint8Array> {
	return sendSync(createPacket(getAddressBuffer(ip, port), type, data))
}

const rleds = {
	begin,
	onConnectionChange,
	isConnected,
	connect,
	mapping,
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

export default rleds
