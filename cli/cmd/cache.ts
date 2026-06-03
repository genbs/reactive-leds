import { Command } from "../cmd"
import { ok } from "../utils"
import { clearScanCache } from "./wifi"

export const clearCacheCommand: Command = {
	name: "clear-cache",
	description:
		"Delete the on-disk scan cache. The next command that needs the device list (ping, color, rainbow, off, version, reset-wifi, proxy) will run a fresh Wi-Fi scan.",
	examples: ["clear-cache"],
	args: [],
	execute: async () => {
		clearScanCache()
		console.log(ok("Scan cache cleared"))
	},
}
