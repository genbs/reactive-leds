import { Config, PacketType } from "@reactive-leds/shared"

/** Runtime LED device handle for the client. */
export type Device = {
	config: Config
	send: (leds: Uint8Array, startIndex?: number) => void
	sendRaw: (type: PacketType, data?: Uint8Array) => void
	sendRawSync: (type: PacketType, data?: Uint8Array) => Promise<Uint8Array>
}
