import { availableConfigKeys } from "@reactive-leds/shared"
import { Command } from "../cmd"
import proto from "../protocol"
import { fail, ok, validateDevicePort, validateTarget } from "../utils"
import { clearScanCache, resolveTargets, Target } from "./wifi"

const ALL_TARGETS = "all"

export const configCommand: Command = {
	name: "config",

	description:
		"Get configuration of <target>. Use \"all\" to target every discovered device.\nIf <key> and <value> are provided, set the configuration.",

	examples: ["config 192.168.1.1", "config 192.168.1.1:4211", "config all", "config 192.168.1.1 hostname my-device"],

	args: [
		{ required: true, name: "target", type: String, validator: validateTarget },
		{ required: false, name: "key", type: String, validator: validateConfigKey },
		{ required: false, name: "value", type: String, validator: (value, args) => validateConfigValue(args[1], value) },
	],

	execute: async (targetArg: string, key?: string, value?: string) => {
		const targets = await resolveTargets(targetArg)
		if (targets.length === 0) {
			console.log(fail(`Failed to get config for ${targetArg}`))
			return false
		}

		if (typeof key !== "undefined" && typeof value !== "undefined") {
			if (targetArg.toLowerCase().split(":")[0] === ALL_TARGETS && key === "hostname") {
				console.log(fail("Refusing to set the same hostname on all devices"))
				return false
			}

			let anyOk = false
			for (const target of targets) {
				if (!target.config) {
					console.log(`${targetLabel(target)}: ${fail("failed to read config")}`)
					continue
				}

				const result = await proto.setConfig(target.ip, target.port, { ...target.config, [key]: configValue(key, value) })
				console.log(`${targetLabel(target)}: ${result ? ok(`updated ${key} = ${value}; rebooting`) : fail("failed")}`)
				anyOk ||= result
			}

			if (anyOk) clearScanCache()
			return anyOk
		}

		let anyOk = false
		for (const target of targets) {
			if (!target.config) {
				console.log(`${targetLabel(target)}: ${fail("failed to read config")}`)
				continue
			}
			anyOk = true
			console.log(`${targetLabel(target)}:\n\t- pin: ${target.config.pin}\n\t- Num LEDs: ${target.config.num_leds}\n\t- Port: ${target.config.port}\n\t- Hostname: ${target.config.hostname}`)
		}
		return anyOk
	},
}

export const ledsCommand: Command = {
	name: "leds",
	description:
		"Set LEDs on <target>. Use \"all\" to target every discovered device.\nThe <led_package> argument must be a comma-separated list of values in the format <led_index>,<r>,<g>,<b>,<brightness/whiteness>.",
	examples: ["leds 192.168.1.100 0,255,0,128,0,1,0,255,128,0", "leds all 0,255,0,128,0", "leds all:4211 0,255,0,128,0"],
	args: [
		{ required: true, name: "target", type: String, validator: validateTarget },
		{
			required: true,
			name: "leds_package",
			type: String, // array not supported yet
			validator: validateLedsPackage,
		},
	],
	execute: async (targetArg: string, ledsPackage: string) => {
		const targets = await resolveTargets(targetArg)
		if (targets.length === 0) {
			console.log(fail(`Device ${targetArg} not found`))
			return false
		}

		const data = new Uint8Array(ledsPackage.split(",").map(Number)) // validated
		for (const target of targets) {
			await proto.setLEDs(target.ip, target.port, data)
			console.log(`${targetLabel(target)}: ${ok("LEDs request sent")}`)
		}
	},
}

function targetLabel(target: Target): string {
	return target.config?.hostname ? `${target.config.hostname} (${target.ip}:${target.port})` : `${target.ip}:${target.port}`
}

////////////////////// Validators

function validateConfigKey(key: (typeof availableConfigKeys)[number]): boolean {
	return !!(key && availableConfigKeys.includes(key))
}

function validateConfigValue(key: string, value: string): boolean | string {
	switch (key) {
		case "hostname":
			if (value.length > 32) return `Invalid value for key "${key}". Length must be less than 32 characters.`
			return true
		case "port":
			if (!validateDevicePort(value)) return `Invalid value for key "${key}". Value must be an integer between 1024 and 65535.`
			return true
		case "pin": {
			const n = Number(value)
			if (!Number.isInteger(n) || n < 0 || n > 48 || (n >= 22 && n <= 25))
				return `Invalid value for key "${key}". Use an output GPIO in 0..21 or 26..48.`
			return true
		}
		case "num_leds": {
			const n = Number(value)
			if (!Number.isInteger(n) || n < 1 || n > 255) return `Invalid value for key "${key}". Value must be an integer between 1 and 255.`
			return true
		}
	}

	return true
}

function configValue(key: string, value: string): string | number {
	return key === "hostname" ? value : Number(value)
}

function validateLedsPackage(ledsPackage: string): boolean | string {
	const ledData = ledsPackage.split(",").map(Number)

	if (ledData.length % 5 !== 0)
		return "Invalid LED package format. Must be a comma-separated list of values in the format <led_index>,<r>,<g>,<b>,<brightness/whiteness>."

	for (let i = 0; i < ledData.length; i++) {
		if (isNaN(ledData[i]) || ledData[i] < 0 || ledData[i] > 255) {
			return `Invalid value at index ${i}. All values must be numbers between 0 and 255.`
		}
	}

	return true
}
