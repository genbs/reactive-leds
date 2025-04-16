import noble, { Peripheral } from "@abandonware/noble"

const SERVICE_UUID = "a9ca1f56-8436-41d7-81dc-947facf48fe8"

const CHARACTERISTIC_UUID = "474c5e20-2f61-450c-a4d3-b51a3685ba5c"

let _bluetooth_started = false

export async function get_bluetooth_devices() {
	return scanDevices()
}

export async function send_bluetooth_credentials(peripheral: Peripheral, ssid: string, password: string) {
	console.log(
		`Sending credentials (${ssid}:${password.replace(/./g, "*")}) to ${
			peripheral.advertisement.localName || peripheral.address
		}`
	)
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
	console.log("Sending credentials...")
	await wifiCharacteristic.writeAsync(data, false)

	await peripheral.disconnectAsync()
	return true
}

async function startBLE() {
	if (_bluetooth_started) return Promise.resolve(true)

	return new Promise<boolean>((resolve, reject) => {
		noble.on("stateChange", state => {
			const ok = state === "poweredOn"
			if (!ok) throw new Error("Bluetooth not available")

			resolve((_bluetooth_started = true))
		})
	})
}

async function scanDevices(timeout = 10_000): Promise<Peripheral[]> {
	await startBLE()

	const peripherals = await new Promise<Peripheral[]>(async (resolve, reject) => {
		noble.startScanning([], false)

		let peripherals: Peripheral[] = []

		const onDiscover = (p: Peripheral) => {
			peripherals.push(p)
		}

		noble.on("discover", onDiscover)

		console.info("Scanning for devices...")

		setTimeout(() => {
			noble.removeListener("discover", onDiscover)
			resolve(peripherals)
		}, timeout)
	})

	noble.stopScanning()

	return peripherals
}
