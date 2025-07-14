import { logger } from "@leds/shared"
import { exec } from "child_process"
import { Command } from "cmd"
import proto from "protocol"
import { validateIP, validatePort } from "utils"

export const scanCommand: Command = {
	name: "scan",
	description: "Scan for available devices over Wi-Fi",
	args: [{ name: "port", type: Number, required: false, default: 4210, validator: validatePort }],
	execute: async port => {
		const devices = await scan(port as number)

		const message = `Available devices:\n\t- ${devices
			.sort((a, b) => (a.pinged ? -1 : 1))
			.map(device => {
				const message = `${device.ip} (${device.mac}) [${device.pinged ? "online" : "offline"}]`
				return `\x1b[${device.pinged ? "32" : "31"}m${message}\x1b[0m`
			})
			.join("\n\t- ")}`

		logger.log(message)
	},
}

export const pingCommand: Command = {
	name: "ping",
	description: "Ping a device over Wi-Fi",

	args: [
		{ name: "ip", required: true, validator: validateIP },
		{ name: "port", type: Number, required: false, default: 4210, validator: validatePort },
	],

	execute: async (ip, port) => {
		const pingResult = await proto.ping(ip as string, port as number)

		logger.log(pingResult ? "Device is online" : "Device is offline")
	},
}

////////////////////////////

type ScanResult = {
	ip: string
	mac: string
	pinged: boolean
}

function scan(port: number): Promise<ScanResult[]> {
	return new Promise(resolve => {
		exec("arp -a", async (error, stdout, stderr) => {
			if (error || stderr) resolve([])

			const devices = await Promise.all(
				stdout.split("\n").map(async line => {
					const parts = line.split(/\s+/)
					if (parts.length >= 4) {
						if (parts[3] === "(incomplete)" || parts[3] === "ff:ff:ff:ff:ff:ff") {
							return null
						}

						const ip = parts[1].replace(/[()]/g, "")
						const mac = parts[3]
							.split(":")
							.map(part => parseInt(part, 16).toString(16).padStart(2, "0").toUpperCase())
							.join(":")

						return {
							ip,
							mac,
							pinged: await proto.ping(ip, port),
						}
					}
				})
			)

			resolve(devices.filter(Boolean) as ScanResult[])
		})
	})
}
