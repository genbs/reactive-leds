import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { configToBuffer, PacketType } from "@reactive-leds/shared"
import { connect, mapping, type Mapping } from "../src/main"
import { send, sendSync } from "../src/proxy"

jest.mock("../src/proxy", () => ({
	isConnected: jest.fn(),
	onConnectionChange: jest.fn(),
	send: jest.fn(),
	sendSync: jest.fn(),
	wsconnect: jest.fn(),
}))

const mockedSend = jest.mocked(send)
const mockedSendSync = jest.mocked(sendSync)

const mappingConfig: Mapping = {
	grid: [2, 1],
	devices: {
		"192.168.0.10:4210": [0, 0, 1, 0, 1, 1, 0, 1],
		"192.168.0.11:4210": [1, 0, 2, 0, 2, 1, 1, 1],
	},
}

describe("mapping", () => {
	beforeEach(() => {
		mockedSend.mockReset()
		mockedSendSync.mockReset()
		mockedSendSync.mockImplementation(async request => {
			const packetType = request[request.length - 1]
			const lastIpOctet = request[5]

			if (packetType === PacketType.PING) {
				return Uint8Array.of(lastIpOctet === 11 ? 0 : 1)
			}

			if (packetType === PacketType.GET_CONFIG) {
				return configToBuffer({ hostname: "strip", pin: 18, num_leds: 1, port: 4210 })
			}

			throw new Error(`Unexpected packet type ${packetType}`)
		})
	})

	test("connects mapped devices, drops unreachable ones and reuses its sample buffer", async () => {
		const [device] = await mapping(mappingConfig)

		expect(device.address).toBe("192.168.0.10:4210")
		expect(device.polygon).toBe(mappingConfig.devices[device.address])
		expect(device.data).toHaveLength(4)

		const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])
		const first = device.sample(pixels, 2, 1)
		const second = device.sample(pixels, 2, 1)

		expect(first).toBe(device.data)
		expect(second).toBe(first)
		expect(first).toEqual(new Uint8Array([255, 0, 0, 0]))

		device.send(first)
		expect(mockedSend).toHaveBeenCalledTimes(1)
	})

	test("plain connect returns the same Device API with a full-frame mapping", async () => {
		const device = await connect("192.168.0.10")

		expect(device?.address).toBe("192.168.0.10:4210")
		expect(device?.grid).toEqual([1, 1])
		expect(device?.polygon).toEqual([0, 0, 1, 0, 1, 1, 0, 1])
		expect(device?.sample(new Uint8Array([1, 2, 3, 255]), 1, 1)).toEqual(new Uint8Array([1, 2, 3, 0]))
	})

	test("samples ImageData without explicit dimensions", async () => {
		const [device] = await mapping({
			grid: [1, 1],
			devices: { "192.168.0.10:4210": [0, 0, 1, 0, 1, 1, 0, 1] },
		})
		const imageData = {
			data: new Uint8ClampedArray([10, 20, 30, 40]),
			width: 1,
			height: 1,
			colorSpace: "srgb",
		} as ImageData

		expect(device.sample(imageData, true)).toEqual(new Uint8Array([10, 20, 30, 40]))
	})

	test("frame samples and sends every connected device", async () => {
		const devices = await mapping(mappingConfig)
		const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])

		expect(devices.frame(pixels, 2, 1)).toBe(devices)
		expect(mockedSend).toHaveBeenCalledTimes(1)
		expect(devices[0].data).toEqual(new Uint8Array([255, 0, 0, 0]))
		expect(devices.map(device => device.address)).toEqual(["192.168.0.10:4210"])
	})

	test("rejects malformed address keys", async () => {
		await expect(
			mapping({
				grid: [1, 1],
				devices: { invalid: [0, 0, 1, 0, 1, 1, 0, 1] },
			})
		).rejects.toThrow('Invalid device address "invalid"; expected "ip:port"')
	})
})
