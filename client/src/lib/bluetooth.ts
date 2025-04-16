/// <reference types="web-bluetooth" />

const SERVICE_UUID = "a9ca1f56-8436-41d7-81dc-947facf48fe8" as const
const CHARACTERISTIC_UUID = "474c5e20-2f61-450c-a4d3-b51a3685ba5c" as const

export async function sendCredentialBT(ssid: string, password: string): Promise<boolean> {
	try {
		const device = await navigator.bluetooth.requestDevice({
			acceptAllDevices: true,
			optionalServices: ["a9ca1f56-8436-41d7-81dc-947facf48fe8"],
		})
		const server = await device.gatt.connect()

		const service = await server.getPrimaryService(SERVICE_UUID)

		const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)

		const credentials = `${ssid},${password}`
		await characteristic.writeValue(new TextEncoder().encode(credentials))

		device.gatt.disconnect()
	} catch (e) {
		console.log(e)

		return false
	}
	return true
}
