import { logger } from "@leds/shared"
import { Command } from "cmd"
import { validateIP, validatePort } from "utils"
import proto from "../protocol"

export const configCommand: Command = {
	name: "config",

	description:
		"Get configuration of the device at <ip>:<port>.\nIf <key> and <value> are provided, set the configuration.",

	examples: ["config 192.168.1.1 4210", "config 192.168.1.1 4210 hostname my-device"],

	args: [
		{ required: true, name: "ip", type: String, validator: validateIP },
		{ required: false, name: "udp_port", type: Number, validator: validatePort, default: 4210 },
		{ required: false, name: "key", type: String, validator: validateConfigKey },
		{ required: false, name: "value", type: String, validator: (value, args) => validateConfigValue(args[2], value) },
	],

	execute: async (ip, port, key?, value?) => {
		const config = await proto.getConfig(ip as string, port as number)
		if (!config) {
			throw new Error(`Failed to get config for ${ip}:${port}`)
		}

		let status = true
		if (typeof key !== "undefined" && typeof value !== "undefined") {
			const result = await proto.setConfig(ip as string, port as number, { ...config, [key as string]: value })
			if (result) {
				logger.log("Config updated successfully")
			} else {
				logger.error("Failed to update config")
				status = false
			}
		}

		logger.log(`Config: 
			\r\t- pin: ${config.pin}
			\r\t- Num LEDs: ${config.num_leds}
			\r\t- Brightness: ${config.brightness}
			\r\t- Port: ${config.port}
			\r\t- Hostname: ${config.hostname}
		`)

		return status
	},
}

const availableConfigKeys = ["hostname", "pin", "num_leds", "port", "brightness"] // TODO: I don't like them being static here.

function validateConfigKey(key: string): boolean {
	return !!(key && availableConfigKeys.includes(key))
}

function validateConfigValue(key: string, value: string): boolean | string {
	switch (key) {
		case "hostname":
			if (value.length > 32) return `Invalid value for key "${key}". Length must be less than 32 characters.`
			break
		case "pin":
			if (isNaN(Number(value))) return `Invalid value for key "${key}". Value must be a number.`
			break
		case "num_leds":
			if (isNaN(Number(value))) return `Invalid value for key "${key}". Value must be a number.`
			break
		case "port":
			if (!validatePort(value)) return `Invalid value for key "${key}". Value must be a number.`
			break
		case "brightness":
			if (isNaN(Number(value))) return `Invalid value for key "${key}". Value must be a number.`
			if (Number(value) < 0 || Number(value) > 255)
				return `Invalid value for key "${key}". Value must be between 0 and 255.`
			break
	}

	return true
}

export const ledsCommand: Command = {
	name: "leds",
	description:
		"Set the LEDs on the device at <ip>:<port>.\nThe <led_package> argument must be a comma-separated list of values in the format <led_index>,<r>,<g>,<b>,<brightness/whiteness>.",
	examples: ["leds 192.168.1.1 4210 0,255,0,128,0,1,0,255,128,0"],
	args: [
		{ required: true, name: "ip", type: String, validator: validateIP },
		{ required: false, name: "udp_port", type: Number, validator: validatePort, default: 4210 },
		{
			required: true,
			name: "leds_package",
			type: String /* by now array is not supported */,
			validator: validateLedsPackage,
		},
	],
	execute: async (ip, port, ledsPackage) => {
		const ledData = (ledsPackage as string).split(",").map(Number) // validated

		const data = new Uint8Array(ledData)
		proto.setLEDs(ip as string, port as number, data)

		logger.log("LEDs set successfully")
		process.exit(0)
	},
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
