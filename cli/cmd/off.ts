import { Command } from "../cmd"
import proto from "../protocol"
import { ok, validateTarget } from "../utils"
import { resolveTargets } from "./wifi"

export const offCommand: Command = {
	name: "off",
	description: "Turn off LEDs. Use \"all\" or omit <target> to target every discovered device.",
	examples: ["off", "off all", "off 192.168.1.10", "off 192.168.1.10:4211"],
	args: [
		{ required: false, name: "target", type: String, validator: validateTarget },
	],
	execute: async (target: string | undefined) => {
		const targets = await resolveTargets(target)
		if (targets.length === 0) return false

		// num_leds comes from the cached config (filled in by scan/resolveTargets);
		// falls back to 16 only if the device didn't respond to GET_CONFIG.
		const packets = targets.map(target => {
			const numLeds = target.config?.num_leds ?? 16

			const data = new Uint8Array(numLeds * 5)
			for (let i = 0; i < numLeds; i++) data[i * 5] = i

			return { target, data }
		})

		for (const { target, data } of packets) {
			await proto.setLEDs(target.ip, target.port, data)
			console.log(`${target.ip}: ${ok("off")}`)
		}
	},
}
