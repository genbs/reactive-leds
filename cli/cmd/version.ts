import { Command } from "../cmd"
import proto from "../protocol"
import { fail, validateTarget } from "../utils"
import { resolveTargets } from "./wifi"

export const versionCommand: Command = {
	name: "version",
	description:
		"Get firmware version. Use \"all\" or omit <target> to query every discovered device.",
	examples: ["version", "version all", "version 192.168.1.10", "version 192.168.1.10:4211"],
	args: [
		{ required: false, name: "target", type: String, validator: validateTarget },
	],
	execute: async (target: string | undefined) => {
		const targets = await resolveTargets(target)
		if (targets.length === 0) return false

		for (const target of targets) {
			const info = await proto.getInfo(target.ip, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.ip})` : target.ip
			if (!info) {
				console.log(`${label}: ${fail("no response (offline or firmware too old)")}`)
			} else {
				console.log(`${label}: ${info.version}`)
			}
		}
	},
}
