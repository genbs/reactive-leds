import { Config } from "@reactive-leds/shared"

/** Runtime LED device handle for the client. */
export type Device = {
	config: Config
	send: (leds: Uint8Array) => void
}
