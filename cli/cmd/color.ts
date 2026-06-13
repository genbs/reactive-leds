import { Command } from "../cmd"
import proto from "../protocol"
import { debug, ok, validateByte, validateAddressOrHostname, validatePort } from "../utils"
import { resolveTargets } from "./wifi"

const randomByte = () => Math.floor(Math.random() * 256)

export const colorCommand: Command = {
	name: "color",
	description:
		"Set all LEDs to a solid color.\nIf r, g, b are omitted a random color is used.\nIf address is omitted the command is applied to all devices found on the network.",
	examples: ["color", "color 255 0 0", "color 255 0 0 128", "color 255 0 0 0 192.168.1.10"],
	args: [
		{ required: false, name: "r", type: Number, validator: validateByte },
		{ required: false, name: "g", type: Number, validator: validateByte },
		{ required: false, name: "b", type: Number, validator: validateByte },
		{ required: false, name: "w", type: Number, validator: validateByte },
		{ required: false, name: "address", type: String, validator: validateAddressOrHostname },
		{ required: false, name: "port", type: Number, default: 4210, validator: validatePort },
	],
	execute: async (r: number | undefined, g: number | undefined, b: number | undefined, w: number, address: string | undefined, port: number) => {
		if (r === undefined) { r = randomByte(); g = randomByte(); b = randomByte() }
		else { g = g ?? 0; b = b ?? 0 }

		console.log(`Color: rgb(${r}, ${g}, ${b}) w=${w}`)

		const targets = await resolveTargets(address, port)
		if (targets.length === 0) return false

		debug("color", "Found devices:", targets)

		// num_leds comes from the cached config (filled in by scan/resolveTargets);
		// falls back to 16 only if the device didn't respond to GET_CONFIG.
		const packets = targets.map(target => {
			const numLeds = target.config?.num_leds ?? 16

			const data = new Uint8Array(numLeds * 5)
			for (let i = 0; i < numLeds; i++) {
				data.set([i, r, g!, b!, w], i * 5)
			}

			return { target, data }
		})
		debug("color", "Prepared packets:", packets)

		// Await each send so the kernel has actually transmitted before
		// the process exits (setLEDs is fire-and-forget but non-blocking).
		for (const { target, data } of packets) {
			await proto.setLEDs(target.address, target.port, data)
			console.log(`${target.address}: ${ok("done")}`)
		}
	},
}
