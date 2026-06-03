import { Command } from "../cmd"
import proto from "../protocol"
import { ok, validateIPOrHostname, validatePort } from "../utils"
import { resolveTargets } from "./wifi"

export const rainbowCommand: Command = {
	name: "rainbow",
	description:
		"Run a rainbow effect for <seconds>. If <ip> is omitted the effect is sent to every device discovered on the network.",
	examples: ["rainbow", "rainbow 10", "rainbow 10 192.168.1.100"],
	args: [
		{ required: false, name: "seconds", type: Number, default: 10 },
		{ required: false, name: "speed", type: Number, default: 1 },
		{ required: false, name: "ip", type: String, validator: validateIPOrHostname },
		{ required: false, name: "port", type: Number, validator: validatePort, default: 4210 },
	],
	execute: async (seconds: number, speed: number, ip: string | undefined, port: number) => {
		const targets = await resolveTargets(ip, port)
		if (targets.length === 0) return false

		console.log(`Target devices: ${targets.map(t => `${t.ip}:${t.port}`).join(", ")}`)

		const FPS = 144
		const start = performance.now()
		const w = 0
		const numLedsPerTarget = targets.map(t => t.config?.num_leds ?? 16)
		const ledsPackages = numLedsPerTarget.map(n => new Uint8Array(n * 5))

		while (performance.now() - start < seconds * 1000) {
			for (let i = 0; i < 256; i += 5) {
				for (let t = 0; t < targets.length; t++) {
					const numLeds = numLedsPerTarget[t]
					const pkg = ledsPackages[t]
					for (let j = 0; j < numLeds; j++) {
						const pixelIndex = (i + (j * 256) / numLeds) % 256
						const r = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + 0) * 127 + 128)
						const g = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + (2 * Math.PI) / 3) * 127 + 128)
						const b = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + (4 * Math.PI) / 3) * 127 + 128)
						pkg.set([j, r, g, b, w], j * 5)
					}
					proto.setLEDs(targets[t].ip, targets[t].port, pkg)
				}

				await new Promise(resolve => setTimeout(resolve, 1000 / (FPS * speed)))
			}
		}

		console.log(ok("Rainbow effect completed"))
	},
}
