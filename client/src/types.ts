import { Config, DeviceIP } from "@leds/shared"

// Runtime LED device handle for the client.
export type Device = {
	config: Config
	send: (leds: Uint8Array) => void
	isValidMapping: (srcWidth: number, srcHeight: number, x0: number, y0: number, x1: number, y1: number) => boolean
}

// Minimal mock payload used to emulate devices in the client.
export type Mock = {
	devices: {
		ip: DeviceIP
		config: Pick<Partial<Config>, "hostname" | "num_leds">
	}[]
}
