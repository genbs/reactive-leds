import { EventEmitter } from "node:events"
import { SerialPort } from "serialport"
import { monitorCommand, monitorSerial, serialCredentialsPacket } from "../cmd/serial"

class FakeSerialPort extends EventEmitter {
	isOpen = false
	closed = false
	openError?: Error

	open(callback: (err: Error | null) => void) {
		if (this.openError) callback(this.openError)
		else {
			this.isOpen = true
			callback(null)
		}
	}

	close(callback: () => void) {
		this.closed = true
		this.isOpen = false
		callback()
	}
}

describe("serial credentials", () => {
	test("prefixes the shared credentials payload with RLEDS", () => {
		const packet = serialCredentialsPacket("my,wifi", "secret")

		expect(packet.subarray(0, 5).toString()).toBe("RLEDS")
		expect([...packet.subarray(5)]).toEqual([
			7, 6,
			...Buffer.from("my,wifi"),
			...Buffer.from("secret"),
		])
	})
})

describe("serial monitor", () => {
	let stdoutWrite: jest.SpyInstance
	let consoleLog: jest.SpyInstance

	beforeEach(() => {
		stdoutWrite = jest.spyOn(process.stdout, "write").mockImplementation(() => true)
		consoleLog = jest.spyOn(console, "log").mockImplementation(() => {})
	})

	afterEach(() => {
		stdoutWrite.mockRestore()
		consoleLog.mockRestore()
	})

	test("defines an optional serial port argument", () => {
		expect(monitorCommand.name).toBe("monitor")
		expect(monitorCommand.args).toEqual([
			{ name: "port", required: false, type: String },
		])
	})

	test("forwards serial bytes unchanged and exits cleanly on SIGINT", async () => {
		const port = new FakeSerialPort()
		const result = monitorSerial("/dev/test", { createPort: () => port as unknown as SerialPort })
		await Promise.resolve()

		const data = Buffer.from("I (123) MAIN: ready\r\n")
		port.emit("data", data)
		expect(stdoutWrite).toHaveBeenCalledWith(data)

		process.emit("SIGINT", "SIGINT")
		await expect(result).resolves.toBe(true)
		expect(port.closed).toBe(true)
	})

	test("fails when the serial port disconnects", async () => {
		const port = new FakeSerialPort()
		const result = monitorSerial("/dev/test", {
			reconnect: false,
			createPort: () => port as unknown as SerialPort,
		})
		await Promise.resolve()

		port.isOpen = false
		port.emit("close")
		await expect(result).resolves.toBe(false)
	})

	test("closes and fails when the serial port emits an error", async () => {
		const port = new FakeSerialPort()
		const result = monitorSerial("/dev/test", {
			reconnect: false,
			createPort: () => port as unknown as SerialPort,
		})
		await Promise.resolve()

		port.emit("error", new Error("read failed"))
		await expect(result).resolves.toBe(false)
		expect(port.closed).toBe(true)
	})

	test("fails when the serial port cannot be opened", async () => {
		const port = new FakeSerialPort()
		port.openError = new Error("permission denied")

		await expect(monitorSerial("/dev/test", { createPort: () => port as unknown as SerialPort }))
			.resolves.toBe(false)
	})

	test("reconnects to the same path after a disconnection", async () => {
		const firstPort = new FakeSerialPort()
		const secondPort = new FakeSerialPort()
		const ports = [firstPort, secondPort]
		const createPort = jest.fn(() => ports.shift() as unknown as SerialPort)
		const result = monitorSerial("/dev/test", { createPort, retryDelayMs: 0 })
		await Promise.resolve()

		firstPort.isOpen = false
		firstPort.emit("close")
		await new Promise(resolve => setTimeout(resolve, 0))
		await Promise.resolve()

		expect(createPort).toHaveBeenCalledTimes(2)
		expect(consoleLog).toHaveBeenCalledWith("Serial port disconnected: /dev/test. Waiting to reconnect...")
		expect(consoleLog).toHaveBeenCalledWith("Reconnected to /dev/test.")

		process.emit("SIGINT", "SIGINT")
		await expect(result).resolves.toBe(true)
		expect(secondPort.closed).toBe(true)
	})
})
