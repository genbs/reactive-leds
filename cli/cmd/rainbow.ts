import { warnIfAwdlActive } from "../awdl"
import { Command } from "../cmd"
import proto from "../protocol"
import { ok, validateTarget } from "../utils"
import { resolveTargets } from "./wifi"

export const rainbowCommand: Command = {
	name: "rainbow",
	description:
		"Run a rainbow effect on <target>. Use \"all\" or omit <target> to target every discovered device.",
	examples: ["rainbow", "rainbow all 10", "rainbow 192.168.1.100 10", "rainbow 192.168.1.100:4211 10 1"],
	args: [
		{ required: false, name: "target", type: String, validator: validateTarget },
		{ required: false, name: "seconds", type: Number, default: 10 },
		{ required: false, name: "speed", type: Number, default: 1 },
	],
	execute: async (target: string | undefined, seconds: number, speed: number) => {
		await warnIfAwdlActive("rainbow")

		const targets = await resolveTargets(target)
		if (targets.length === 0) return false

		console.log(`Target devices: ${targets.map(t => `${t.ip}:${t.port}`).join(", ")}`)

		const FPS = 144
		const start = performance.now()
		const w = 0
		const numLedsPerTarget = targets.map(t => t.config?.num_leds ?? 16)
		const ledsPackages = numLedsPerTarget.map(n => new Uint8Array(n * 5))

		// Time-based: hue position derived from wall-clock time so timer jitter
		// doesn't accumulate. Send rate capped at FPS; the per-target buffers are
		// reused across frames to avoid GC pressure from thousands of allocations/second.
		const cycleDuration = (256 / 5) * (1000 / (FPS * speed)) // ms per full hue cycle
		const sendInterval = 1000 / FPS

		while (performance.now() - start < seconds * 1000) {
			const elapsed = performance.now() - start
			const i = Math.floor((elapsed % cycleDuration) / cycleDuration * 256)

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

			await new Promise(resolve => setTimeout(resolve, sendInterval))
		}

		// off all targets at the end
		for (let t = 0; t < targets.length; t++) {
			const numLeds = numLedsPerTarget[t]
			const pkg = new Uint8Array(numLeds * 5)
			for (let j = 0; j < numLeds; j++) {
				pkg.set([j, 0, 0, 0, w], j * 5)
			}
			await proto.setLEDs(targets[t].ip, targets[t].port, pkg)
		}

		console.log(ok("Rainbow effect completed"))
	},
}
