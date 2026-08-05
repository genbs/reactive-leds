import type { Command } from "../cmd"
import proto from "../protocol"
import { fail, green, validateTarget } from "../utils"
import { resolveTargets } from "./wifi"

export const statusCommand: Command = {
	name: "status",

	description: "Get device status (uptime, free heap, WiFi RSSI).",

	examples: ["status", "status all", "status 192.168.1.100", "status 192.168.1.100:4211"],

	args: [
		{ required: false, name: "target", type: String, validator: validateTarget },
	],

	execute: async (target?: string) => {
		const targets = await resolveTargets(target)
		if (targets.length === 0) {
			console.log("No devices found.")
			return false
		}

		let anyOk = false
		for (const t of targets) {
			const status = await proto.getStatus(t.ip, t.port)
			if (!status) {
				console.log(`${t.ip}:${t.port}  ${fail("offline")}`)
				continue
			}

			anyOk = true
			const uptimeStr = formatUptime(status.uptime)
			const heapStr = formatHeap(status.heap)
			const rssiStr = status.rssi === 0 ? "N/A" : `${status.rssi} dBm`
			console.log(`${t.ip}:${t.port}  ${green("up")} ${uptimeStr}  heap ${heapStr}  rssi ${rssiStr}`)
			if (status.internalHeap !== undefined) {
				console.log(`  mem internal ${formatHeap(status.internalHeap)}  largest ${formatHeap(status.largestHeapBlock ?? 0)}  min ${formatHeap(status.minHeap ?? 0)}`)
			}
			if (status.framesReceived !== undefined) {
				console.log(`  frames recv ${status.framesReceived}  shown ${status.framesShown ?? 0}  dropped ${status.framesDropped ?? 0}`)
			}
			if (status.udpPacketsRead !== undefined) {
				console.log(`  net udp-read ${status.udpPacketsRead}  loop-max-gap ${status.protocolLoopMaxGapMs ?? 0}ms`)
			}
		}

		return anyOk
	},
}

function formatUptime(seconds: number): string {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60

	if (h > 0) {
		return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`
	}
	return `${m}m${String(s).padStart(2, "0")}s`
}

function formatHeap(bytes: number): string {
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}
	return `${Math.round(bytes / 1024)} KB`
}
