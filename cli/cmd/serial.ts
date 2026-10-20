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

export const monitorCommand: Command = {
	name: "monitor",
	description: "Monitor ESP32 logs over USB.",
	args: [
		{ name: "port", required: false, type: String },
	],
	examples: [
		"rleds monitor",
		"rleds monitor /dev/cu.usbmodem1101",
	],
	execute: async (path: string | undefined) => {
		if (!path) path = await selectPort()
		if (!path) return false

		try {
			return await monitorSerial(path)
		} catch (err) {
			console.log(fail(err instanceof Error ? err.message : "Failed to monitor serial port"))
			return false
		}
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

/** Stream a serial port to stdout until interrupted or disconnected. */
export async function monitorSerial(
	path: string,
	options: {
		reconnect?: boolean
		retryDelayMs?: number
		createPort?: (path: string) => SerialPort
	} = {},
): Promise<boolean> {
	return new Promise<boolean>(resolve => {
		const reconnect = options.reconnect ?? true
		const retryDelayMs = options.retryDelayMs ?? 1_000
		const createPort = options.createPort ?? (path => new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false }))
		let port: SerialPort | undefined
		let reconnectTimer: ReturnType<typeof setTimeout> | undefined
		let openedOnce = false
		let settled = false

		const cleanupProcess = () => {
			process.off("SIGINT", onSignal)
			process.off("SIGTERM", onSignal)
		}

		const finish = (result: boolean, message?: string) => {
			if (settled) return
			settled = true
			if (reconnectTimer) clearTimeout(reconnectTimer)
			if (message) console.log(fail(message))

			const current = port
			port = undefined
			if (current) {
				current.off("data", onData)
				current.off("error", onError)
				current.off("close", onClose)
			}
			const complete = () => {
				cleanupProcess()
				resolve(result)
			}
			if (current?.isOpen) current.close(complete)
			else complete()
		}

		const onData = (data: Buffer) => process.stdout.write(data)
		const onSignal = () => finish(true)
		const scheduleReconnect = () => {
			if (!settled) reconnectTimer = setTimeout(openPort, retryDelayMs)
		}
		const disconnected = (message: string) => {
			if (settled) return
			if (!reconnect) {
				finish(false, message)
				return
			}

			const current = port
			port = undefined
			if (current) {
				current.off("data", onData)
				current.off("error", onError)
				current.off("close", onClose)
			}
			console.log(`Serial port disconnected: ${path}. Waiting to reconnect...`)
			if (current?.isOpen) current.close(scheduleReconnect)
			else scheduleReconnect()
		}
		const onError = (err: Error) => disconnected(err.message)
		const onClose = () => disconnected(`Serial port closed: ${path}`)

		const openPort = () => {
			if (settled) return
			let nextPort: SerialPort
			try {
				nextPort = createPort(path)
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to open serial port"
				if (!openedOnce) finish(false, message)
				else scheduleReconnect()
				return
			}
			port = nextPort
			nextPort.open(err => {
				if (settled) {
					if (nextPort.isOpen) nextPort.close(() => {})
					return
				}
				if (err) {
					port = undefined
					if (!openedOnce) finish(false, err.message)
					else scheduleReconnect()
					return
				}

				port = nextPort
				nextPort.on("data", onData)
				nextPort.on("error", onError)
				nextPort.on("close", onClose)
				if (openedOnce) console.log(`Reconnected to ${path}.`)
				else console.log(`Monitoring ${path} at ${BAUD_RATE} baud. Press Ctrl+C to exit.`)
				openedOnce = true
			})
		}

		process.on("SIGINT", onSignal)
		process.on("SIGTERM", onSignal)
		openPort()
	})
}
