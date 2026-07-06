import { EventEmitter } from "events"
import { PacketType, PacketStatus, bufferToStatus, configToBuffer, encodeBuffer } from "@reactive-leds/shared"

////////////////////// dgram mock

// Captured send calls + the active socket so tests can fire synthetic responses.
type SendCall = {
	message: Uint8Array
	offset: number
	length: number
	port: number
	address: string
}

const sendCalls: SendCall[] = []
let activeSocket: MockSocket | null = null

class MockSocket extends EventEmitter {
	send(
		message: Uint8Array,
		offset: number,
		length: number,
		port: number,
		address: string,
		callback?: (err: Error | null) => void
	) {
		sendCalls.push({ message, offset, length, port, address })
		// Mirror dgram's async callback semantics: invoke on next tick with no error.
		setImmediate(() => callback && callback(null))
	}
	bind() {
		// Real dgram emits 'listening' once bound; tests don't depend on it but
		// we expose a no-op so the protocol setup completes.
	}
	close() {}
	unref() {
		return this
	}
}

jest.mock("dgram", () => ({
	createSocket: jest.fn(() => {
		activeSocket = new MockSocket()
		return activeSocket
	}),
}))

////////////////////// Helpers

/** Fire a synthetic UDP response back into the mocked socket. */
function respondWith(bytes: number[]) {
	if (!activeSocket) throw new Error("No active socket — call a protocol method first")
	activeSocket.emit("message", Buffer.from(bytes))
}

/** Read the request ID from the most recently captured send. */
function lastRequestId(): number {
	const call = sendCalls[sendCalls.length - 1]
	if (!call) throw new Error("No send call captured")
	return call.message[0]
}

////////////////////// Tests

// Importing here (after jest.mock) so the Protocol singleton picks up the mock.
import { Protocol } from "../protocol"

describe("Protocol", () => {
	let proto: Protocol

	beforeEach(() => {
		sendCalls.length = 0
		activeSocket = null
		proto = new Protocol()
		// Tighten timeouts so failure-paths don't slow the test suite.
		Protocol.PING_TIMEOUT = 50
		Protocol.GET_CONFIG_TIMEOUT = 50
		Protocol.SET_CONFIG_TIMEOUT = 50
		Protocol.GET_VERSION_TIMEOUT = 50
		Protocol.GET_STATUS_TIMEOUT = 50
	})

	describe("ping", () => {
		test("resolves true when a matching response arrives", async () => {
			const promise = proto.ping("192.168.1.10", 4210)

			// dgram.send is invoked synchronously inside sendSync; wait one tick.
			await new Promise(resolve => setImmediate(resolve))

			expect(sendCalls).toHaveLength(1)
			expect(sendCalls[0].address).toBe("192.168.1.10")
			expect(sendCalls[0].port).toBe(4210)
			expect(sendCalls[0].message[1]).toBe(PacketType.PING)

			respondWith([lastRequestId(), PacketType.PING, PacketStatus.OK])
			await expect(promise).resolves.toBe(true)
		})

		test("resolves false on timeout", async () => {
			await expect(proto.ping("192.168.1.99", 4210)).resolves.toBe(false)
		})

		test("ignores responses with mismatched request id", async () => {
			const promise = proto.ping("192.168.1.10", 4210)
			await new Promise(resolve => setImmediate(resolve))

			// Wrong id — should not resolve the pending request.
			respondWith([(lastRequestId() + 1) % 255, PacketType.PING, PacketStatus.OK])
			await expect(promise).resolves.toBe(false)
		})
	})

	describe("getConfig", () => {
		test("parses the config buffer from a valid response", async () => {
			const promise = proto.getConfig("10.0.0.1", 4210)
			await new Promise(resolve => setImmediate(resolve))

			// [reqId, GET_CONFIG, pin, num_leds, port_h, port_l, hostname...]
			const hostname = encodeBuffer("esp-1")
			respondWith([lastRequestId(), PacketType.GET_CONFIG, 18, 16, 0x10, 0x72, ...hostname])

			const config = await promise
			expect(config).toEqual({
				pin: 18,
				num_leds: 16,
				port: (0x10 << 8) | 0x72,
				hostname: "esp-1",
			})
		})

		test("returns null on timeout", async () => {
			await expect(proto.getConfig("10.0.0.99", 4210)).resolves.toBeNull()
		})
	})

	describe("setConfig", () => {
		test("returns true when device acknowledges OK", async () => {
			const promise = proto.setConfig("10.0.0.1", 4210, {
				pin: 18,
				num_leds: 16,
				port: 4210,
				hostname: "esp-1",
			})
			await new Promise(resolve => setImmediate(resolve))

			// Encoded request must carry the config bytes after [reqId, SET_CONFIG]
			const sent = sendCalls[0].message
			expect(sent[1]).toBe(PacketType.SET_CONFIG)
			expect(sent.slice(2)).toEqual(
				configToBuffer({ pin: 18, num_leds: 16, port: 4210, hostname: "esp-1" })
			)

			respondWith([lastRequestId(), PacketType.SET_CONFIG, PacketStatus.OK])
			await expect(promise).resolves.toBe(true)
		})

		test("returns false when device acknowledges ERROR", async () => {
			const promise = proto.setConfig("10.0.0.1", 4210, {
				pin: 18,
				num_leds: 16,
				port: 4210,
				hostname: "esp-1",
			})
			await new Promise(resolve => setImmediate(resolve))

			respondWith([lastRequestId(), PacketType.SET_CONFIG, PacketStatus.ERROR])
			await expect(promise).resolves.toBe(false)
		})
	})

	describe("setLEDs", () => {
		test("sends a fire-and-forget packet with the right header and payload", async () => {
			const data = new Uint8Array([0, 255, 0, 0, 0, 1, 0, 255, 0, 0])
			await proto.setLEDs("10.0.0.1", 4210, data)

			expect(sendCalls).toHaveLength(1)
			const sent = sendCalls[0].message
			// [EMPTY_PACKET_ID=0, SET_LEDS, ...data]
			expect(sent[0]).toBe(0)
			expect(sent[1]).toBe(PacketType.SET_LEDS)
			expect(Array.from(sent.slice(2))).toEqual(Array.from(data))
		})

		test("resolves the promise only after dgram's send callback fires", async () => {
			let resolved = false
			const promise = proto.setLEDs("10.0.0.1", 4210, new Uint8Array([0, 1, 2, 3, 4])).then(() => {
				resolved = true
			})

			// Synchronous check: send was issued but the callback (setImmediate) hasn't run yet.
			expect(sendCalls).toHaveLength(1)
			expect(resolved).toBe(false)

			await promise
			expect(resolved).toBe(true)
		})
	})

	describe("resetWifi", () => {
		test("returns true on OK response", async () => {
			const promise = proto.resetWifi("10.0.0.1", 4210)
			await new Promise(resolve => setImmediate(resolve))

			respondWith([lastRequestId(), PacketType.RESET_WIFI, PacketStatus.OK])
			await expect(promise).resolves.toBe(true)
		})
	})

	describe("getVersion", () => {
		test("decodes the version string from the response", async () => {
			const promise = proto.getVersion("10.0.0.1", 4210)
			await new Promise(resolve => setImmediate(resolve))

			const versionBytes = encodeBuffer("v0.1.0")
			respondWith([lastRequestId(), PacketType.GET_VERSION, ...versionBytes])

			await expect(promise).resolves.toBe("v0.1.0")
		})

		test("returns null on timeout (older firmware that drops unknown packet types)", async () => {
			await expect(proto.getVersion("10.0.0.99", 4210)).resolves.toBeNull()
		})
	})

	describe("getStatus", () => {
		test("parses the status buffer from a valid response", async () => {
			const promise = proto.getStatus("10.0.0.1", 4210)
			await new Promise(resolve => setImmediate(resolve))

			// [reqId, GET_STATUS, uptime(4), heap(4), rssi(1), mac(6)]
			respondWith([
				lastRequestId(), PacketType.GET_STATUS,
				0, 0, 0, 100,  // uptime = 100
				0, 0x01, 0, 0, // heap = 65536
				-42 & 0xff,     // rssi = -42
				0xa0, 0x85, 0xe3, 0xe0, 0x9f, 0x54,
			])

			const status = await promise
			expect(status).toEqual({ uptime: 100, heap: 65536, rssi: -42, mac: "A0:85:E3:E0:9F:54" })
		})

		test("returns null on timeout", async () => {
			await expect(proto.getStatus("10.0.0.99", 4210)).resolves.toBeNull()
		})
	})

	describe("request ID cycling", () => {
		test("cycles request IDs through 1..255 (0 is reserved)", async () => {
			// Fire 257 pings without responses; collect the request IDs from sendCalls.
			const promises = Array.from({ length: 257 }, (_, i) => proto.ping(`10.0.0.${i % 250 + 1}`, 4210))

			// Let all the synchronous send dispatches fire.
			await new Promise(resolve => setImmediate(resolve))

			const ids = sendCalls.map(c => c.message[0])
			expect(ids.every(id => id >= 1 && id <= 255)).toBe(true)
			// After wrapping past 255 we should see id 1 again.
			expect(new Set(ids).size).toBeLessThan(257)

			// Let all timeouts fire so jest doesn't hold open handles.
			await Promise.all(promises)
		})
	})
})
