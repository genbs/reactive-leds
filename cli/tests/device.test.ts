jest.mock("../protocol", () => ({
	__esModule: true,
	default: {
		setConfig: jest.fn(),
		setLEDs: jest.fn(),
	},
}))

jest.mock("../cmd/wifi", () => ({
	__esModule: true,
	clearScanCache: jest.fn(),
	resolveTargets: jest.fn(),
}))

import proto from "../protocol"
import { clearScanCache, resolveTargets } from "../cmd/wifi"
import { configCommand, ledsCommand } from "../cmd/device"

const mockProto = proto as jest.Mocked<typeof proto>
const mockResolveTargets = resolveTargets as jest.MockedFunction<typeof resolveTargets>
const mockClearScanCache = clearScanCache as jest.MockedFunction<typeof clearScanCache>

const targets = [
	{ ip: "192.168.1.2", port: 4210, config: { hostname: "led-1", pin: 18, num_leds: 16, port: 4210 } },
	{ ip: "192.168.1.3", port: 4210, config: { hostname: "led-2", pin: 18, num_leds: 24, port: 4210 } },
]

describe("device commands", () => {
	let logSpy: jest.SpyInstance

	beforeEach(() => {
		jest.clearAllMocks()
		logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
		mockResolveTargets.mockResolvedValue(targets)
		mockProto.setConfig.mockResolvedValue(true)
		mockProto.setLEDs.mockResolvedValue(true)
	})

	afterEach(() => {
		logSpy.mockRestore()
	})

	test("config all prints every resolved target config", async () => {
		await configCommand.execute("all")

		expect(mockResolveTargets).toHaveBeenCalledWith("all")
		expect(logSpy).toHaveBeenCalledTimes(2)
		expect(logSpy.mock.calls[0][0]).toContain("led-1")
		expect(logSpy.mock.calls[1][0]).toContain("led-2")
	})

	test("config all sets safe config keys on every target and clears cache", async () => {
		await configCommand.execute("all", "num_leds", "32")

		expect(mockProto.setConfig).toHaveBeenCalledTimes(2)
		expect(mockProto.setConfig).toHaveBeenCalledWith("192.168.1.2", 4210, expect.objectContaining({ num_leds: 32 }))
		expect(mockProto.setConfig).toHaveBeenCalledWith("192.168.1.3", 4210, expect.objectContaining({ num_leds: 32 }))
		expect(mockClearScanCache).toHaveBeenCalled()
	})

	test("config all refuses to set the same hostname on every target", async () => {
		const result = await configCommand.execute("all", "hostname", "same-name")

		expect(result).toBe(false)
		expect(mockProto.setConfig).not.toHaveBeenCalled()
		expect(mockClearScanCache).not.toHaveBeenCalled()
	})

	test("leds all sends the package to every resolved target", async () => {
		await ledsCommand.execute("all", "0,255,0,0,0")

		expect(mockResolveTargets).toHaveBeenCalledWith("all")
		expect(mockProto.setLEDs).toHaveBeenCalledTimes(2)
		expect(mockProto.setLEDs).toHaveBeenCalledWith("192.168.1.2", 4210, new Uint8Array([0, 255, 0, 0, 0]))
		expect(mockProto.setLEDs).toHaveBeenCalledWith("192.168.1.3", 4210, new Uint8Array([0, 255, 0, 0, 0]))
	})
})
