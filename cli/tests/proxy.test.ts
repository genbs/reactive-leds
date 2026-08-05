import {
	Config,
	configToBuffer,
	deviceInfoToBuffer,
	DeviceInfo,
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
		getInfo: jest.fn(),
		getStatus: jest.fn(),
	},
}))
import proto from "../protocol"
import { handleProxyMessage, isAllowedWebSocketOrigin, parseAllowedOrigins, proxyCommand } from "../cmd/proxy/proxy"

const mock = proto as jest.Mocked<typeof proto>

const REQ_ID = 42
const PORT = 4210 // 0x10, 0x72

/** Build a proxy request: [requestId, address(4), port_h, port_l, type, ...data] */
function req(type: PacketType, data: number[] = []): Uint8Array {
	return new Uint8Array([REQ_ID, 192, 168, 1, 10, (PORT >> 8) & 0xff, PORT & 0xff, type, ...data])
}

const CONFIG: Config = { hostname: "esp-1", port: 4210, pin: 18, num_leds: 16 }
const INFO: DeviceInfo = { ip: "192.168.1.10", port: 4210, mac: "A0:85:E3:E0:9F:54", version: "v0.1.0", hostname: "esp-1" }
const STATUS: Status = {
	uptime: 12345, heap: 200000, rssi: -67,
	internalHeap: 180000, largestHeapBlock: 120000, minHeap: 150000,
	framesReceived: 100, framesShown: 99, framesDropped: 1, udpPacketsRead: 102, protocolLoopMaxGapMs: 4,
	arrivalGapHist: [0, 10, 80, 8, 1, 1], arrivalGapMaxMs: 130, arrivalGapMaxAgeS: 12,
	seqLost: 1, seqReordered: 0, beaconTimeouts: 0, wifiDisconnects: 0,
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe("proxy access boundary", () => {
	test("binds to loopback by default", () => {
		expect(proxyCommand.args?.find(arg => arg.name === "host")?.default).toBe("127.0.0.1")
	})

	test("allows native clients and local browser origins", () => {
		expect(isAllowedWebSocketOrigin(undefined)).toBe(true)
		expect(isAllowedWebSocketOrigin("http://localhost:8080")).toBe(true)
		expect(isAllowedWebSocketOrigin("https://127.0.0.1:8443")).toBe(true)
		expect(isAllowedWebSocketOrigin("http://[::1]:3000")).toBe(true)
	})

	test("rejects malformed and remote browser origins", () => {
		expect(isAllowedWebSocketOrigin("not a URL")).toBe(false)
		expect(isAllowedWebSocketOrigin("https://example.com")).toBe(false)
		expect(isAllowedWebSocketOrigin("https://localhost.example.com")).toBe(false)
	})

	test("allows only explicitly configured remote origins", () => {
		expect(isAllowedWebSocketOrigin("https://genbs.github.io", ["https://genbs.github.io"])).toBe(true)
		expect(isAllowedWebSocketOrigin("https://evil.example", ["https://genbs.github.io"])).toBe(false)
	})

	test("allows any remote origin when the wildcard is configured", () => {
		expect(isAllowedWebSocketOrigin("https://hydra.ojack.xyz", ["*"])).toBe(true)
		expect(isAllowedWebSocketOrigin("https://evil.example", ["*"])).toBe(true)
	})

	test("parseAllowedOrigins expands comma-separated origins and keeps the wildcard", () => {
		expect(parseAllowedOrigins("*")).toEqual(["*"])
		expect(parseAllowedOrigins("all")).toEqual(["*"])
		expect(parseAllowedOrigins("ALL")).toEqual(["*"])
		expect(parseAllowedOrigins("https://genbs.github.io, https://hydra.ojack.xyz ")).toEqual([
			"https://genbs.github.io",
			"https://hydra.ojack.xyz",
		])
		expect(parseAllowedOrigins(undefined)).toEqual([])
	})
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
		expect(mock.setLEDs).toHaveBeenCalledWith("192.168.1.10", PORT, new Uint8Array([255, 0, 0, 0]), 0)
		expect(res).toBeNull()
	})

	test("GET_INFO → [requestId, ...info]", async () => {
		mock.getInfo.mockResolvedValue(INFO)
		const res = await handleProxyMessage(req(PacketType.GET_INFO))
		expect(Array.from(res!)).toEqual([REQ_ID, ...deviceInfoToBuffer(INFO)])
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
		mock.getInfo.mockResolvedValue(INFO)
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

	test("short payload returns failure status", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
		const res = await handleProxyMessage(new Uint8Array([REQ_ID]))
		expect(warn).toHaveBeenCalled()
		expect(Array.from(res!)).toEqual([REQ_ID, 0])
		warn.mockRestore()
	})

	test("invalid target port returns failure status", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
		const res = await handleProxyMessage(new Uint8Array([REQ_ID, 192, 168, 1, 10, 0, 0, PacketType.PING]))
		expect(warn).toHaveBeenCalled()
		expect(mock.ping).not.toHaveBeenCalled()
		expect(Array.from(res!)).toEqual([REQ_ID, 0])
		warn.mockRestore()
	})

	test("invalid fire-and-forget payload is dropped", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
		const res = await handleProxyMessage(req(PacketType.SET_LEDS, [0, 255]))
		expect(warn).toHaveBeenCalled()
		expect(mock.setLEDs).not.toHaveBeenCalled()
		expect(res).toBeNull()
		warn.mockRestore()
	})

	test("misaligned SET_LEDS payload is dropped", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
		const res = await handleProxyMessage(req(PacketType.SET_LEDS, [0, 255, 0, 0, 0, 1]))
		expect(mock.setLEDs).not.toHaveBeenCalled()
		expect(res).toBeNull()
		warn.mockRestore()
	})
})
