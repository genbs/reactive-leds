import { Command } from "../cmd"
import proto from "../protocol"
import { debug, ok, validateByte, validateTarget } from "../utils"
import { resolveTargets } from "./wifi"

const randomByte = () => Math.floor(Math.random() * 256)

export const colorCommand: Command = {
	name: "color",
	description:
		"Set all LEDs on <target> to a solid color. If r, g, b are omitted a random color is used.",
	examples: ["color", "color all 255 0 0", "color 192.168.1.10 255 0 0 128", "color 192.168.1.10:4211 255 0 0"],
	args: [
		{ required: false, name: "target", type: String, validator: validateTarget },
		{ required: false, name: "r", type: Number, validator: validateByte },
		{ required: false, name: "g", type: Number, validator: validateByte },
		{ required: false, name: "b", type: Number, validator: validateByte },
		{ required: false, name: "w", type: Number, validator: validateByte },
	],
	execute: async (target: string | undefined, r: number | undefined, g: number | undefined, b: number | undefined, w: number | undefined) => {
		if (r === undefined) { r = randomByte(); g = randomByte(); b = randomByte() }
		else { g = g ?? 0; b = b ?? 0 }
		w = w ?? 0

		console.log(`Color: rgb(${r}, ${g}, ${b}) w=${w}`)

		const targets = await resolveTargets(target)
		if (targets.length === 0) return false

		debug("color", "Found devices:", targets)

		// num_leds comes from the cached config (filled in by scan/resolveTargets);
		// falls back to 16 only if the device didn't respond to GET_CONFIG.
		const packets = targets.map(target => {
			const numLeds = target.config?.num_leds ?? 16

			const data = new Uint8Array(numLeds * 4)
			for (let i = 0; i < numLeds; i++) {
				data.set([r, g!, b!, w], i * 4)
			}

			return { target, data }
		})
		debug("color", "Prepared packets:", packets)

		// Await each send so the kernel has actually transmitted before
		// the process exits (setLEDs is fire-and-forget but non-blocking).
		for (const { target, data } of packets) {
			await proto.setLEDs(target.ip, target.port, data)
			console.log(`${target.ip}: ${ok("done")}`)
		}
	},
}
