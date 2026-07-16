import { Config, PacketType } from "@reactive-leds/shared"

export type Pixels = Uint8Array | Uint8ClampedArray
export type WhiteChannel = number | boolean | ((r: number, g: number, b: number) => number)
export type Grid = readonly [number, number]
export type Polygon = readonly [number, number, number, number, number, number, number, number]

/** Runtime LED device handle for the client. */
export type Device = {
	address: string
	config: Config
	readonly grid: Grid
	readonly polygon: Polygon
	readonly data: Uint8Array
	send: (leds: Uint8Array, startIndex?: number) => void
	sendRaw: (type: PacketType, data?: Uint8Array) => void
	sendRawSync: (type: PacketType, data?: Uint8Array) => Promise<Uint8Array>
	sample(imageData: ImageData, whiteChannel?: WhiteChannel): Uint8Array
	sample(pixels: Pixels, width: number, height: number, whiteChannel?: WhiteChannel): Uint8Array
}

export type DeviceGroup = Device[] & {
	frame(imageData: ImageData, whiteChannel?: WhiteChannel): DeviceGroup
	frame(pixels: Pixels, width: number, height: number, whiteChannel?: WhiteChannel): DeviceGroup
}

export type DeviceMapping = {
	grid: Grid
	polygon: Polygon
}

/** Serializable mapping exported by the browser mapping tool. */
export type Mapping = {
	grid: Grid
	devices: Record<string, Polygon>
}
