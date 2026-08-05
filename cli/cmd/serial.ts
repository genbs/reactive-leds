import { wifiCredentialsToBuffer } from "@reactive-leds/shared"
import { SerialPort } from "serialport"
import { Command } from "../cmd"
import { ask, fail, green, ok } from "../utils"

const BAUD_RATE = 115_200
const MAGIC = Buffer.from("RLEDS")
const RESPONSE_TIMEOUT = 10_000

type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number]

export const serialScanCommand: Command = {
	name: "serial-scan",
	description: "List serial ports.",
	execute: async () => {
		const ports = await SerialPort.list()
		if (ports.length === 0) console.log(fail("No serial ports found"))
		else printPorts(ports)
	},
}

export const credentialCommand: Command = {
	name: "credential",
	description: "Send Wi-Fi credentials over USB.",
	args: [
		{ name: "port", required: false, type: String },
		{ name: "ssid", required: false, type: String },
	],
	execute: async (path: string | undefined, ssid: string | undefined) => {
		if (!path) path = await selectPort()
		if (!path) return false

		if (!ssid) ssid = await ask("Insert SSID: ")
		const password = await ask("Insert password: ", true)

		let packet: Buffer
		try {
			packet = serialCredentialsPacket(ssid, password)
		} catch (err) {
			console.error(err instanceof Error ? err.message : "Invalid credentials")
			return false
		}

		try {
			if (!await sendCredentials(path, packet)) {
				console.log(fail("Device rejected the credentials"))
				return false
			}
		} catch (err) {
			console.log(fail(err instanceof Error ? err.message : "Failed to send credentials"))
			return false
		}

		console.log(`\n\r${ok("Credentials sent successfully")}`)
		return true
	},
}

export function serialCredentialsPacket(ssid: string, password: string): Buffer {
	return Buffer.concat([MAGIC, Buffer.from(wifiCredentialsToBuffer(ssid, password))])
}

function printPorts(ports: PortInfo[]) {
	console.log(`Available serial ports:\n\t- ${ports.map((port, i) =>
		green(`${i + 1}) ${port.path}${port.manufacturer ? ` (${port.manufacturer})` : ""}`)
	).join("\n\t- ")}`)
}

async function selectPort(): Promise<string | undefined> {
	const ports = await SerialPort.list()
	if (ports.length === 0) {
		console.log(fail("No serial ports found"))
		return
	}
	if (ports.length === 1) return ports[0].path

	printPorts(ports)
	const selection = await ask("Insert port (number or path): ")
	const index = Number(selection) - 1
	if (Number.isInteger(index) && index >= 0 && index < ports.length) return ports[index].path
	if (ports.some(port => port.path === selection)) return selection

	console.log(fail("Serial port not found"))
}

async function sendCredentials(path: string, packet: Buffer): Promise<boolean> {
	const port = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false })

	await new Promise<void>((resolve, reject) => port.open(err => err ? reject(err) : resolve()))
	try {
		const response = waitForResponse(port)
		void response.catch(() => {})
		await new Promise<void>((resolve, reject) => port.write(packet, err => err ? reject(err) : resolve()))
		await new Promise<void>((resolve, reject) => port.drain(err => err ? reject(err) : resolve()))
		return await response
	} finally {
		if (port.isOpen) await new Promise<void>(resolve => port.close(() => resolve()))
	}
}

function waitForResponse(port: SerialPort): Promise<boolean> {
	return new Promise((resolve, reject) => {
		let response = ""
		const timeout = setTimeout(() => done(new Error("Device did not respond")), RESPONSE_TIMEOUT)

		const onData = (data: Buffer) => {
			response += data.toString()
			if (response.includes("RLEDS:OK")) done(undefined, true)
			else if (response.includes("RLEDS:ERROR")) done(undefined, false)
		}
		const onError = (err: Error) => done(err)
		const onClose = () => done(new Error("Serial port closed"))
		const done = (err?: Error, result?: boolean) => {
			clearTimeout(timeout)
			port.off("data", onData)
			port.off("error", onError)
			port.off("close", onClose)
			if (err) reject(err)
			else resolve(result === true)
		}

		port.on("data", onData)
		port.on("error", onError)
		port.on("close", onClose)
	})
}
