import noble, { Peripheral } from "@stoprocent/noble"
import { encodeBuffer } from "@reactive-leds/shared"
import { Command } from "../cmd"
import { ask, DEBUG, fail, green, ok } from "../utils"

// Keep in sync with firmware/main/ble.c (SERVICE_UUID_128, CHARACTERISTIC_UUID_128).
// Contract documented in shared/README.md ("BLE provisioning").
const SERVICE_UUID = "a9ca1f56-8436-41d7-81dc-947facf48fe8"
const CHARACTERISTIC_UUID = "474c5e20-2f61-450c-a4d3-b51a3685ba5c"
const SCAN_TIMEOUT = 5_000

export const btScanCommand: Command = {
	name: "bt-scan",
	description: "Find devices over Bluetooth.",
	args: [
		{ name: "timeout", type: Number, required: false, default: SCAN_TIMEOUT },
	],
	execute: async (timeout: number = SCAN_TIMEOUT) => {
		const devices = await scanDevices(timeout)
		if (devices.length === 0) {
			console.log("No devices found")
		} else {
			printDevices(devices)
		}
	},
}

export const btCredentialCommand: Command = {
	name: "bt-credential",
	description: "Send Wi-Fi credentials to a Bluetooth device.",
	args: [
		{ name: "indexOrHost", required: false, type: String },
		{ name: "ssid", required: false, type: String, validator: (v: string) => v.length > 0 && v.length <= 32 },
	],
	execute: async (indexOrHost: string | undefined, ssid: string | undefined) => {
		const devices = await scanDevices()
		if (devices.length === 0) {
			console.log("No devices found")
			return false
		}

		if (!indexOrHost) {
			printDevices(devices)
			indexOrHost = await ask("Insert host (number or name): ")
		}

		// Resolve numeric index regardless of whether host came from argument or prompt
		if (indexOrHost && !isNaN(Number(indexOrHost))) {
			const index = Number(indexOrHost) - 1
			if (index < 0 || index >= devices.length) {
				console.log(fail("Device not found"))
				return false
			}
			indexOrHost = devices[index].advertisement.localName || devices[index].address || devices[index].uuid
		}

		if (!indexOrHost) {
			console.log(fail("Device not found"))
			return false
		}

		const device = findDevice(devices, indexOrHost)
		if (!device) {
			console.log(fail(`Device ${indexOrHost} not found`))
			return false
		}

		if (!ssid) ssid = await ask("Insert SSID: ")
		const password = await ask("Insert password: ", true)

		if (!ssid || !password) {
			console.error("Invalid credentials")
			return false
		}

		const sendOk = await sendBluetoothCredentials(device, ssid, password)
		if (!sendOk) return false

		console.log(`\n\r${ok("Credentials sent successfully")}`)
		return true
	},
}

////////////////////// Internal

function printDevices(devices: Peripheral[]) {
	const message = `Available devices:\n\t- ${devices
		.map((d, i) => green(`${i + 1}) ${d.advertisement.localName || d.address || d.uuid}`))
		.join("\n\t- ")}`
	console.log(message)
}

function findDevice(devices: Peripheral[], host: string): Peripheral | undefined {
	host = host.toLowerCase()
	return devices.find(d => {
		if (d.advertisement.localName?.toLowerCase().includes(host)) return true
		if (d.address?.toLowerCase().includes(host)) return true
		if (d.uuid?.toLowerCase().includes(host)) return true
		return false
	})
}

async function sendBluetoothCredentials(peripheral: Peripheral, ssid: string, password: string) {
	if (DEBUG) console.log(
		`Sending credentials (${ssid}:${password.replace(/./g, "*")}) to ${peripheral.advertisement.localName || peripheral.address || peripheral.uuid}`
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

		const credentials = `${ssid},${password}`
		// Encode via the shared utility, then wrap in Buffer because noble's
		// writeAsync API requires Node Buffer (not a plain Uint8Array).
		const data = Buffer.from(encodeBuffer(credentials))

		await wifiCharacteristic.writeAsync(data, false)

		await peripheral.disconnectAsync()
	} catch (err) {
		console.error(`Failed to send Bluetooth credentials`)
		return false
	}
	return true
}

let bluetoothStarted: Promise<void> | undefined
function startBLE() {
	// @stoprocent/noble: resolves once the adapter is powered on, rejects/timeouts
	// otherwise. Memoized so concurrent callers share one wait.
	if (!bluetoothStarted) {
		bluetoothStarted = noble.waitForPoweredOnAsync()
	}
	return bluetoothStarted
}

async function scanDevices(timeout = SCAN_TIMEOUT): Promise<Peripheral[]> {
	await startBLE()

	const peripherals = await new Promise<Peripheral[]>(resolve => {
		const found: Peripheral[] = []
		const onDiscover = (p: Peripheral) => {
			if (found.includes(p)) return
			found.push(p)
		}

		noble.on("discover", onDiscover)
		noble.startScanningAsync([], false)
		console.log("Scanning for devices...")

		setTimeout(() => {
			noble.removeListener("discover", onDiscover)
			resolve(found)
		}, timeout)
	})

	await noble.stopScanningAsync()

	return peripherals.sort((a, b) => {
		const nameA = a.advertisement.localName || a.address || a.uuid
		const nameB = b.advertisement.localName || b.address || b.uuid
		return nameA.localeCompare(nameB)
	})
}
