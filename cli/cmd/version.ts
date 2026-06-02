import { Command } from "../cmd"
import proto from "../protocol"
import { fail, validateIPOrHostname, validatePort } from "../utils"
import { resolveTargets } from "./wifi"

export const versionCommand: Command = {
	name: "version",
	description:
		"Get the firmware version of a device. If <ip> is omitted, every device discovered on the network is queried.",
	examples: ["version", "version 192.168.1.10", "version 192.168.1.10 4210"],
	args: [
		{ required: false, name: "ip", type: String, validator: validateIPOrHostname },
		{ required: false, name: "port", type: Number, validator: validatePort, default: 4210 },
	],
	execute: async (ip: string | undefined, port: number) => {
		const targets = await resolveTargets(ip, port)
		if (targets.length === 0) return false

		for (const target of targets) {
			const version = await proto.getVersion(target.ip, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.ip})` : target.ip
			if (!version) {
				console.log(`${label}: ${fail("no response (offline or firmware too old)")}`)
			} else {
				console.log(`${label}: ${version}`)
			}
		}
	},
}
