import { afterEach, describe, expect, jest, test } from "@jest/globals"
import WS from "../src/ws"

class FakeWebSocket {
	static readonly CONNECTING = 0
	static readonly OPEN = 1
	static readonly CLOSING = 2
	static readonly CLOSED = 3
	static instances: FakeWebSocket[] = []

	readonly url: string
	readyState = FakeWebSocket.CONNECTING
	binaryType = ""
	private listeners = new Map<string, Set<(event: Event) => void>>()

	constructor(url: string) {
		this.url = url
		FakeWebSocket.instances.push(this)
	}

	addEventListener(type: string, listener: (event: Event) => void) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set())
		this.listeners.get(type)!.add(listener)
	}

	removeEventListener(type: string, listener: (event: Event) => void) {
		this.listeners.get(type)?.delete(listener)
	}

	open() {
		this.readyState = FakeWebSocket.OPEN
		this.emit("open")
	}

	close() {
		this.readyState = FakeWebSocket.CLOSED
		this.emit("close")
	}

	send() {}

	private emit(type: string) {
		for (const listener of this.listeners.get(type) ?? []) listener(new Event(type))
	}
}

const originalWebSocket = Object.getOwnPropertyDescriptor(globalThis, "WebSocket")

describe("WS.connect", () => {
	function mockWebSocket() {
		Object.defineProperty(globalThis, "WebSocket", {
			configurable: true,
			value: FakeWebSocket,
		})
	}

	afterEach(() => {
		FakeWebSocket.instances = []
		if (originalWebSocket) Object.defineProperty(globalThis, "WebSocket", originalWebSocket)
		else Reflect.deleteProperty(globalThis, "WebSocket")
	})

	test("reuses an open connection to the same URL", () => {
		mockWebSocket()
		const onConnectionChange = jest.fn()
		const ws = new WS({
			url: "ws://localhost:8000",
			autoConnect: false,
			shouldReconnect: false,
			onConnectionChange,
		})

		ws.connect()
		FakeWebSocket.instances[0].open()
		ws.connect()

		expect(FakeWebSocket.instances).toHaveLength(1)
		expect(onConnectionChange).toHaveBeenLastCalledWith(true)
	})

	test("replaces the connection when the URL changes", () => {
		mockWebSocket()
		const ws = new WS({ url: "ws://localhost:8000", autoConnect: false, shouldReconnect: false })

		ws.connect()
		FakeWebSocket.instances[0].open()
		ws.settings.url = "ws://localhost:9000"
		ws.connect()

		expect(FakeWebSocket.instances).toHaveLength(2)
		expect(FakeWebSocket.instances[1].url).toBe("ws://localhost:9000")
	})
})
