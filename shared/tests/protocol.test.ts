import { addressToBuffer, bufferToConfig, bufferToDeviceInfo, bufferToStatus, configToBuffer, decodeBuffer, deviceInfoToBuffer, encodeBuffer, PacketType, statusToBuffer, validateLEDs, wifiCredentialsToBuffer } from ".."

describe("WiFi credentials", () => {
	test("uses length-prefixed fields without reserving a separator", () => {
		expect(wifiCredentialsToBuffer("my,network", "pass,word")).toEqual(
			new Uint8Array([10, 9, ...encodeBuffer("my,network"), ...encodeBuffer("pass,word")])
		)
		expect(wifiCredentialsToBuffer("open", "")).toEqual(new Uint8Array([4, 0, ...encodeBuffer("open")]))
	})

	test("validates encoded byte lengths", () => {
		expect(() => wifiCredentialsToBuffer("", "password")).toThrow(RangeError)
		expect(() => wifiCredentialsToBuffer("é".repeat(17), "password")).toThrow(RangeError)
		expect(() => wifiCredentialsToBuffer("wifi", "x".repeat(64))).toThrow(RangeError)
	})
})

describe("LEDs", () => {
	test("accepts contiguous RGBW pixels with a valid start index", () => {
		expect(() => validateLEDs(new Uint8Array([255, 0, 0, 0, 0, 255, 0, 0]), 2)).not.toThrow()
	})

	test("rejects empty, misaligned and overflowing ranges", () => {
		expect(() => validateLEDs(new Uint8Array())).toThrow(RangeError)
		expect(() => validateLEDs(new Uint8Array(5))).toThrow(RangeError)
		expect(() => validateLEDs(new Uint8Array(8), 254)).toThrow(RangeError)
	})
})

describe("Config", () => {
	test("configToBuffer", () => {
		const config = {
			pin: 1,
			num_leds: 10,
			port: 1234,
			hostname: "test",
		}

		const result = configToBuffer(config)
		expect(result).toBeInstanceOf(Uint8Array)
		expect(result.length).toBe(1 + 1 + 2 + 4) // pin, num_leds, port_h, port_l, "test".length
		expect(result[0]).toBe(1) // pin
		expect(result[1]).toBe(10) // num_leds
		expect(result[2]).toBe(4) // port high byte (1234 >> 8)
		expect(result[3]).toBe(210) // port low byte (1234 & 0xff)
		expect(decodeBuffer(result.slice(4))).toBe("test") // hostname

		// test with long hostname
		const longHostname = "a".repeat(40)
		const longConfig = {
			pin: 1,
			num_leds: 10,
			port: 1234,
			hostname: longHostname,
		}
		const longResult = configToBuffer(longConfig)
		expect(longResult).toBeInstanceOf(Uint8Array)
		expect(longResult.length).toBe(1 + 1 + 2 + 32) // pin, num_leds, port_h, port_l, hostname
		expect(longResult[0]).toBe(1) // pin
		expect(longResult[1]).toBe(10) // num_leds
		expect(longResult[2]).toBe(4) // port high byte (1234 >> 8)
		expect(longResult[3]).toBe(210) // port low byte (1234 & 0xff)
		expect(decodeBuffer(longResult.slice(4))).toBe(longHostname.substring(0, 32)) // should truncate to 32 characters
	})

	test("bufferToConfig", () => {
		const buffer = new Uint8Array([1, 10, 4, 210, 116, 101, 115, 116]) // pin, num_leds, port_h, port_l, "test"

		const config = bufferToConfig(buffer)
		expect(config).toEqual({
			pin: 1,
			num_leds: 10,
			port: 1234,
			hostname: "test",
		})

		// test with large hostname > 32 characters
		const longHostname = "a".repeat(40)
		const longBuffer = new Uint8Array([1, 10, 4, 210, ...encodeBuffer(longHostname)])
		const longConfig = bufferToConfig(longBuffer)

		expect(longConfig).toEqual({
			pin: 1,
			num_leds: 10,
			port: 1234,
			hostname: longHostname.substring(0, 32), // should truncate to 32
		})
	})
})

describe("Status", () => {
	const status = {
		uptime: 0xffffffff,
		heap: 180_000,
		rssi: -55,
		internalHeap: 170_000,
		largestHeapBlock: 120_000,
		minHeap: 160_000,
		framesReceived: 3_600,
		framesShown: 3_590,
		framesDropped: 10,
		udpPacketsRead: 3_700,
		protocolLoopMaxGapMs: 4,
		arrivalGapHist: [10, 3000, 500, 40, 6, 2],
		arrivalGapMaxMs: 142,
		arrivalGapMaxAgeS: 37,
		seqLost: 12,
		seqReordered: 1,
		beaconTimeouts: 2,
		wifiDisconnects: 0,
	}

	test("statusToBuffer round-trips the fixed GET_STATUS payload", () => {
		// RSSI is always negative in practice — the int8 sign handling is the risky bit.
		const buffer = statusToBuffer(status)
		expect(buffer.length).toBe(89)
		expect(buffer[8]).toBe(-55 & 0xff)
		expect(bufferToStatus(buffer)).toEqual(status)
	})

	test("bufferToStatus rejects incomplete or oversized payloads", () => {
		for (const length of [0, 9, 41, 88, 90]) {
			expect(() => bufferToStatus(new Uint8Array(length))).toThrow("expected 89")
		}
	})

	test("statusToBuffer preserves all runtime counters", () => {
		const buffer = statusToBuffer(status)
		expect(buffer.length).toBe(89)
		expect(bufferToStatus(buffer)).toEqual(status)
	})
})

describe("DeviceInfo", () => {
	test("deviceInfoToBuffer round-trips through bufferToDeviceInfo", () => {
		const info = {
			ip: "192.168.1.123",
			port: 4210,
			mac: "A0:85:E3:E0:9F:54",
			version: "v0.1.0",
			hostname: "esp32-7",
		}
		const buffer = deviceInfoToBuffer(info)
		expect(bufferToDeviceInfo(buffer)).toEqual(info)
	})

	test("bufferToDeviceInfo rejects truncated variable fields", () => {
		const buffer = deviceInfoToBuffer({
			ip: "192.168.1.123",
			port: 4210,
			mac: "A0:85:E3:E0:9F:54",
			version: "v0.1.0",
			hostname: "esp32-7",
		})
		expect(() => bufferToDeviceInfo(buffer.subarray(0, buffer.length - 1))).toThrow()
	})
})

describe("addressToBuffer", () => {
	test("should convert string IP and port to buffer", () => {
		const address = "192.168.1.1"
		const port = 8080

		const buffer = addressToBuffer(address, port)
		expect(buffer).toBeInstanceOf(Uint8Array)
		expect(buffer.length).toBe(6) // 4 bytes for IP + 2 bytes for port
		expect(buffer[0]).toBe(192)
		expect(buffer[1]).toBe(168)
		expect(buffer[2]).toBe(1)
		expect(buffer[3]).toBe(1)
		expect(buffer[4]).toBe(31) // port high byte (8080 >> 8)
		expect(buffer[5]).toBe(144) // port low byte (8080 & 0xff)
	})

	test("should convert array IP and port to buffer", () => {
		const address: [number, number, number, number] = [10, 0, 0, 1]
		const buffer = addressToBuffer(address, 4210)
		expect(buffer[0]).toBe(10)
		expect(buffer[1]).toBe(0)
		expect(buffer[2]).toBe(0)
		expect(buffer[3]).toBe(1)
		expect(buffer[4]).toBe((4210 >> 8) & 0xff)
		expect(buffer[5]).toBe(4210 & 0xff)
	})
})

describe("Buffer", () => {
	test("encodeBuffer", () => {
		const str = "Hello"

		const buffer = encodeBuffer(str)
		expect(buffer).toBeInstanceOf(Uint8Array)

		expect(buffer.length).toBe(5) // 5 chars
		expect(buffer[0]).toBe(72) // 'H'
		expect(buffer[1]).toBe(101) // 'e'
		expect(buffer[2]).toBe(108) // 'l'
		expect(buffer[3]).toBe(108) // 'l'
		expect(buffer[4]).toBe(111) // 'o'
	})

	test("encodeBuffer with destination", () => {
		const str = "World"
		const dest = new Uint8Array(10)

		const buffer = encodeBuffer(str, dest, 2)
		expect(buffer).toBe(dest)
		expect(buffer.length).toBe(10)
		expect(buffer[2]).toBe(87) // 'W'
		expect(buffer[3]).toBe(111) // 'o'
		expect(buffer[4]).toBe(114) // 'r'
		expect(buffer[5]).toBe(108) // 'l'
		expect(buffer[6]).toBe(100) // 'd'
	})

	test("encodeBuffer with destination at position 0 (regression: 0 is falsy)", () => {
		const str = "Hi"
		const dest = new Uint8Array(5).fill(0xff) // pre-fill so we can tell what was written

		const buffer = encodeBuffer(str, dest, 0)
		expect(buffer).toBe(dest)
		expect(buffer[0]).toBe(72)   // 'H'
		expect(buffer[1]).toBe(105)  // 'i'
		// Byte after the string must keep the pre-fill (no null terminator
		// because position was specified).
		expect(buffer[2]).toBe(0xff)
		expect(buffer[3]).toBe(0xff)
		expect(buffer[4]).toBe(0xff)
	})

	test("encodeBuffer with destination and termination", () => {
		const str = "Hello"
		const dest = new Uint8Array(10)

		const buffer = encodeBuffer(str, dest)
		expect(buffer).toBe(dest)
		expect(buffer.length).toBe(10)
		expect(buffer[5]).toBe(0) // null termination
		expect(decodeBuffer(buffer)).toBe("Hello") // should decode correctly

		// if position is specified, it should not add null termination
		const dest2 = new Uint8Array(12).fill(32) // fill with spaces
		const buffer2 = encodeBuffer(str, dest2, 3)
		expect(buffer2).toBe(dest2)
		expect(buffer2.length).toBe(12)
		expect(buffer2[3]).toBe(72) // 'H'
		expect(buffer2[4]).toBe(101) // 'e'
		expect(buffer2[5]).toBe(108) // 'l'
		expect(buffer2[6]).toBe(108) // 'l'
		expect(buffer2[7]).toBe(111) // 'o'
		expect(buffer2[8]).toBe(32) // should not be 0
		expect(decodeBuffer(buffer2)).toBe("   Hello    ") // should decode correctly
	})

	test("decodeBuffer", () => {
		const buffer = new Uint8Array([72, 101, 108, 108, 111]) // 'Hello'

		const str = decodeBuffer(buffer)
		expect(str).toBe("Hello")
	})

	test("decodeBuffer with \\0 termination", () => {
		const noise = new Uint8Array([97, 67, 184]) // 'aCё'
		const buffer = new Uint8Array([87, 111, 114, 108, 100, 0, ...noise]) // 'World\0a'

		const str = decodeBuffer(buffer)
		expect(str).toBe("World")
	})
})

describe("PacketType", () => {
	// These values are hardcoded in the firmware — any mismatch breaks communication silently
	test("enum values match firmware protocol", () => {
		expect(PacketType.PING).toBe(0)
		expect(PacketType.GET_CONFIG).toBe(1)
		expect(PacketType.SET_CONFIG).toBe(2)
		expect(PacketType.SET_LEDS).toBe(3)
		expect(PacketType.RESET_WIFI).toBe(4)
		expect(PacketType.GET_INFO).toBe(5)
		expect(PacketType.GET_STATUS).toBe(6)
	})
})
