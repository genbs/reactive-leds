import noble, { Peripheral } from "@abandonware/noble"
import { logger } from "@leds/shared"
import { Command } from "../cmd"
import { ask } from "../utils"

const SERVICE_UUID = "a9ca1f56-8436-41d7-81dc-947facf48fe8"
const CHARACTERISTIC_UUID = "474c5e20-2f61-450c-a4d3-b51a3685ba5c"
const SCAN_TIMEOUT = 5_000

/**
 * Find Bluetooth devices
 */
export const btScanCommand: Command = {
	name: "bt-scan",
	description: "Find devices over Bluetooth",
	args: [],
	execute: async () => {
		const devices = await scanDevices()
		if (devices.length === 0) {
			logger.log("No devices found")
		} else {
			printDevices(devices)
		}
	},
}

/*
 * Send Wi-Fi credentials to a Bluetooth device
 */
export const btCredentialCommand: Command = {
	name: "bt-credential",
	description: "Send Wi-Fi credentials to a Bluetooth device",
	args: [
		{ name: "host", required: false, type: String },
		{ name: "ssid", required: false, type: String, validator: (v: string) => v.length > 0 && v.length <= 32 },
	],
	execute: async (host, ssid) => {
		const devices = await scanDevices()
		if (devices.length === 0) {
			logger.log("No devices found")
			return false
		}

		// if host is not provided, prompt for it
		if (!host) {
			printDevices(devices)

			host = await ask("Insert host (number or name): ")
			// check if input host is number
			if (!isNaN(Number(host))) {
				const index = Number(host) - 1
				if (index < 0 || index >= devices.length) {
					logger.log("Device not found")
					return false
				}
				host = devices[index].advertisement.localName || devices[index].address || devices[index].uuid
			}

			// otherwise host is a string representing the device name or address
		}

		const device = findDevice(devices, host as string)
		if (!device) {
			logger.log(`Device ${host} not found`)
			return false
		}

		if (!ssid) ssid = await ask("Insert SSID: ")
		const password = await ask("Insert password: ", true)

		if (!ssid || !password) {
			console.error("Invalid credentials")
			return false
		}

		try {
			await sendBluetoothCredentials(device, ssid as string, password)
		} catch {
			return false
		}
	},
}

//////////

function printDevices(devices: Peripheral[]) {
	logger.log(
		`Devices:\n${devices.map((d, i) => `${i + 1}) ${d.advertisement.localName || d.address || d.uuid}`).join("\n")}`
	)
}

function findDevice(devices: Peripheral[], host: string): Peripheral | undefined {
	host = host.toLowerCase()
	return devices.find(
		d =>
			d.advertisement.localName?.toLowerCase().indexOf(host) !== -1 ||
			d.address.toLowerCase().indexOf(host) !== -1 ||
			d.uuid.toLowerCase().indexOf(host) !== -1
	)
}

async function sendBluetoothCredentials(peripheral: Peripheral, ssid: string, password: string) {
	logger.debug(
		`Sending credentials (${ssid}:${password.replace(/./g, "*")}) to ${
			peripheral.advertisement.localName || peripheral.address
		}`
	)

	try {
		await startBLE()

		await peripheral.connectAsync()

		const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
			[SERVICE_UUID],
			[CHARACTERISTIC_UUID]
		)

		if (characteristics.length === 0) {
			throw new Error("Characteristic not found")
		}

		const wifiCharacteristic = characteristics[0]

		// send credentials
		const credentials = `${ssid},${password}`
		const data = Buffer.from(credentials, "utf8")

		await wifiCharacteristic.writeAsync(data, false)

		await peripheral.disconnectAsync()
	} catch {
		logger.error(`Failed to send Bluetooth credentials`)
		return false
	}
	return true
}

let bluetooth_started: Promise<void> | undefined
async function startBLE() {
	if (!bluetooth_started) {
		bluetooth_started = new Promise<void>(resolve => {
			noble.on("stateChange", state => {
				const ok = state === "poweredOn"
				if (!ok) throw new Error("Bluetooth not available")

				resolve()
			})
		})
	}

	return bluetooth_started
}

async function scanDevices(timeout = SCAN_TIMEOUT): Promise<Peripheral[]> {
	await startBLE()

	const peripherals = await new Promise<Peripheral[]>(async (resolve, reject) => {
		noble.startScanning([], false)

		let peripherals: Peripheral[] = []

		const onDiscover = (p: Peripheral) => {
			if (peripherals.includes(p)) return
			peripherals.push(p)
		}

		noble.on("discover", onDiscover)

		logger.log("Scanning for devices...")

		setTimeout(() => {
			noble.removeListener("discover", onDiscover)
			resolve(peripherals)
		}, timeout)
	})

	noble.stopScanning()

	return peripherals
}
