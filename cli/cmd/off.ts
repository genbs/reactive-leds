import { Command } from "../cmd"
import proto from "../protocol"
import { ok, validateAddressOrHostname, validatePort } from "../utils"
import { resolveTargets } from "./wifi"

export const offCommand: Command = {
	name: "off",
	description: "Turn off all LEDs. If <address> is omitted, applies to every discovered device.",
	examples: ["off", "off 192.168.1.10"],
	args: [
		{ required: false, name: "address", type: String, validator: validateAddressOrHostname },
		{ required: false, name: "port", type: Number, default: 4210, validator: validatePort },
	],
	execute: async (address: string | undefined, port: number) => {
		const targets = await resolveTargets(address, port)
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
			await proto.setLEDs(target.address, target.port, data)
			console.log(`${target.address}: ${ok("off")}`)
		}
	},
}
