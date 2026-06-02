import {
	Config,
	configToBuffer,
	encodeBuffer,
	PacketType,
	Status,
	statusToBuffer,
} from "@reactive-leds/shared"

// Mock the UDP protocol layer so the proxy dispatch can be tested without hardware.
jest.mock("../protocol", () => ({
	__esModule: true,
	default: {
		ping: jest.fn(),
		getConfig: jest.fn(),
		setConfig: jest.fn(),
		setLEDs: jest.fn(),
		resetWifi: jest.fn(),
		getVersion: jest.fn(),
		getStatus: jest.fn(),
	},
}))

import proto from "../protocol"
import { handleProxyMessage } from "../cmd/proxy"

const mock = proto as jest.Mocked<typeof proto>

const REQ_ID = 42
const PORT = 4210 // 0x10, 0x72

/** Build a proxy request: [requestId, ip(4), port_h, port_l, type, ...data] */
function req(type: PacketType, data: number[] = []): Uint8Array {
	return new Uint8Array([REQ_ID, 192, 168, 1, 10, (PORT >> 8) & 0xff, PORT & 0xff, type, ...data])
}

const CONFIG: Config = { hostname: "esp-1", port: 4210, pin: 18, num_leds: 16 }
const STATUS: Status = { uptime: 12345, heap: 200000, rssi: -67 }

beforeEach(() => {
	jest.clearAllMocks()
})

describe("handleProxyMessage", () => {
	test("PING → [requestId, status]", async () => {
		mock.ping.mockResolvedValue(true)
		const res = await handleProxyMessage(req(PacketType.PING))
		expect(mock.ping).toHaveBeenCalledWith("192.168.1.10", PORT)
		expect(Array.from(res!)).toEqual([REQ_ID, 1])
	})

	test("GET_CONFIG → [requestId, ...configBuffer]", async () => {
		mock.getConfig.mockResolvedValue(CONFIG)
		const res = await handleProxyMessage(req(PacketType.GET_CONFIG))
		expect(Array.from(res!)).toEqual([REQ_ID, ...configToBuffer(CONFIG)])
	})

	test("GET_CONFIG unreachable → [requestId, 0]", async () => {
		mock.getConfig.mockResolvedValue(null)
		const res = await handleProxyMessage(req(PacketType.GET_CONFIG))
		expect(Array.from(res!)).toEqual([REQ_ID, 0])
	})

	test("SET_CONFIG → [requestId, status]", async () => {
		mock.setConfig.mockResolvedValue(true)
		const res = await handleProxyMessage(req(PacketType.SET_CONFIG, [...configToBuffer(CONFIG)]))
		expect(mock.setConfig).toHaveBeenCalled()
		expect(Array.from(res!)).toEqual([REQ_ID, 1])
	})

	test("SET_LEDS → no response (null), fire-and-forget", async () => {
		const data = [0, 255, 0, 0, 0]
		const res = await handleProxyMessage(req(PacketType.SET_LEDS, data))
		expect(mock.setLEDs).toHaveBeenCalledWith("192.168.1.10", PORT, expect.any(Uint8Array))
		expect(res).toBeNull()
	})

	test("GET_VERSION → [requestId, ...version]", async () => {
		mock.getVersion.mockResolvedValue("v0.1.0")
		const res = await handleProxyMessage(req(PacketType.GET_VERSION))
		expect(Array.from(res!)).toEqual([REQ_ID, ...encodeBuffer("v0.1.0")])
	})

	test("GET_STATUS → [requestId, ...statusBuffer]", async () => {
		mock.getStatus.mockResolvedValue(STATUS)
		const res = await handleProxyMessage(req(PacketType.GET_STATUS))
		expect(Array.from(res!)).toEqual([REQ_ID, ...statusToBuffer(STATUS)])
	})

	test("RESET_WIFI → [requestId, status]", async () => {
		mock.resetWifi.mockResolvedValue(true)
		const res = await handleProxyMessage(req(PacketType.RESET_WIFI))
		expect(mock.resetWifi).toHaveBeenCalledWith("192.168.1.10", PORT)
		expect(Array.from(res!)).toEqual([REQ_ID, 1])
	})

	test("every PacketType is handled (none falls through to 'Unhandled')", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})

		// Give every mock a benign return so each case can complete.
		mock.ping.mockResolvedValue(true)
		mock.getConfig.mockResolvedValue(CONFIG)
		mock.setConfig.mockResolvedValue(true)
		mock.getVersion.mockResolvedValue("v0")
		mock.getStatus.mockResolvedValue(STATUS)
		mock.resetWifi.mockResolvedValue(true)

		// Supply payload data for the types that parse it (SET_CONFIG, SET_LEDS);
		// the rest ignore the data.
		const dataFor = (t: PacketType): number[] =>
			t === PacketType.SET_CONFIG ? [...configToBuffer(CONFIG)]
			: t === PacketType.SET_LEDS ? [0, 255, 0, 0, 0]
			: []

		const numericTypes = Object.values(PacketType).filter(v => typeof v === "number") as PacketType[]
		for (const type of numericTypes) {
			await handleProxyMessage(req(type, dataFor(type)))
		}

		expect(warn).not.toHaveBeenCalled()
		warn.mockRestore()
	})

	test("unknown packet type warns and returns failure status", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
		const res = await handleProxyMessage(req(99 as PacketType))
		expect(warn).toHaveBeenCalled()
		expect(Array.from(res!)).toEqual([REQ_ID, 0])
		warn.mockRestore()
	})
})
