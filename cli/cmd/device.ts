import { availableConfigKeys } from "@reactive-leds/shared"
import { Command } from "../cmd"
import proto from "../protocol"
import { fail, ok, validateAddressOrHostname, validatePort } from "../utils"
import { clearScanCache, resolveTargets } from "./wifi"

export const configCommand: Command = {
	name: "config",

	description:
		"Get configuration of the device at <address>:<port>.\nIf <key> and <value> are provided, set the configuration.",

	examples: ["config 192.168.1.1 4210", "config 192.168.1.1 4210 hostname my-device"],

	args: [
		{ required: true, name: "address", type: String, validator: validateAddressOrHostname },
		{ required: false, name: "port", type: Number, validator: validatePort, default: 4210 },
		{ required: false, name: "key", type: String, validator: validateConfigKey },
		{ required: false, name: "value", type: String, validator: (value, args) => validateConfigValue(args[2], value) },
	],

	execute: async (address: string, port: number, key?: string, value?: string) => {
		// resolveTargets resolves a hostname (accepted by the validator) to a real IP.
		const targets = await resolveTargets(address, port)
		const target = targets[0]
		if (!target || !target.config) {
			console.log(fail(`Failed to get config for ${address}:${port}`))
			return false
		}
		const config = target.config
		if (typeof key !== "undefined" && typeof value !== "undefined") {
			const result = await proto.setConfig(target.address, target.port, { ...config, [key]: value })
			if (!result) {
				console.log(fail("Failed to update config"))
				return false
			}
			// The cached scan now holds a stale config for this device (and the
			// device is rebooting on a possibly different port). Clear the cache so
			// the next multi-target command does a fresh scan.
			clearScanCache()
			// SET_CONFIG auto-reboots the device; refetching would fail. We trust
			// the firmware response and report success without re-reading.
			console.log(`Config updated: ${key} = ${value}. Device is rebooting (~5s offline).`)
			return
		}

		console.log(`Config:\n\t- pin: ${config.pin}\n\t- Num LEDs: ${config.num_leds}\n\t- Port: ${config.port}\n\t- Hostname: ${config.hostname}`)
	},
}

export const ledsCommand: Command = {
	name: "leds",
	description:
		"Set the LEDs on the device at <address>:<port>.\nThe <led_package> argument must be a comma-separated list of values in the format <led_index>,<r>,<g>,<b>,<brightness/whiteness>.",
	examples: ["leds 192.168.1.100 4210 0,255,0,128,0,1,0,255,128,0"],
	args: [
		{ required: true, name: "address", type: String, validator: validateAddressOrHostname },
		{ required: false, name: "port", type: Number, validator: validatePort, default: 4210 },
		{
			required: true,
			name: "leds_package",
			type: String, // array not supported yet
			validator: validateLedsPackage,
		},
	],
	execute: async (address: string, port: number, ledsPackage: string) => {
		// Resolve so a hostname (accepted by validateIPOrHostname) becomes a real IP.
		const targets = await resolveTargets(address, port)
		if (targets.length === 0) {
			console.log(fail(`Device ${address} not found`))
			return false
		}
		const target = targets[0]

		const data = new Uint8Array(ledsPackage.split(",").map(Number)) // validated
		// Await so the kernel transmits before process exit.
		await proto.setLEDs(target.address, target.port, data)
		console.log(ok("LEDs request sent"))
	},
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
			if (!validatePort(value)) return `Invalid value for key "${key}". Value must be a number.`
			return true
		case "pin":
		case "num_leds": {
			const n = Number(value)
			if (isNaN(n)) return `Invalid value for key "${key}". Value must be a number.`
			return true
		}
	}

	return true
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
