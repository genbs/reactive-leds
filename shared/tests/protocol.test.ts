import { addressToBuffer, bufferToConfig, configToBuffer, decodeBuffer, encodeBuffer } from ".."

describe("Config", () => {
	test("configToBuffer", () => {
		const config = {
			pin: 1,
			num_leds: 10,
			brightness: 255,
			port: 1234,
			hostname: "test",
		}

		const result = configToBuffer(config)
		expect(result).toBeInstanceOf(Uint8Array)
		expect(result.length).toBe(1 + 1 + 1 + 2 + 4) // pin, num_leds, brightness, port_h, port_l, "test".length
		expect(result[0]).toBe(1) // pin
		expect(result[1]).toBe(10) // num_leds
		expect(result[2]).toBe(255) // brightness
		expect(result[3]).toBe(4) // port high byte (1234 >> 8)
		expect(result[4]).toBe(210) // port low byte (1234 & 0xff)
		expect(decodeBuffer(result.slice(5))).toBe("test") // hostname

		// test with destination buffer
		const dest = new Uint8Array(20)
		const resultWithDest = configToBuffer(config, dest)
		expect(resultWithDest).toBe(dest)
		expect(resultWithDest.length).toBe(20)
		expect(resultWithDest[0]).toBe(1)
		expect(resultWithDest[1]).toBe(10)
		expect(resultWithDest[2]).toBe(255)
		expect(resultWithDest[3]).toBe(4) // port high byte
		expect(resultWithDest[4]).toBe(210) // port low byte
		expect(decodeBuffer(resultWithDest.slice(5))).toBe("test") // hostname

		// test with long hostname
		const longHostname = "a".repeat(40)
		const longConfig = {
			pin: 1,
			num_leds: 10,
			brightness: 255,
			port: 1234,
			hostname: longHostname,
		}
		const longResult = configToBuffer(longConfig)
		expect(longResult).toBeInstanceOf(Uint8Array)
		expect(longResult.length).toBe(1 + 1 + 1 + 2 + 32) // pin, num_leds, brightness, port_h, port_l, hostname
		expect(longResult[0]).toBe(1) // pin
		expect(longResult[1]).toBe(10) // num_leds
		expect(longResult[2]).toBe(255) // brightness
		expect(longResult[3]).toBe(4) // port high byte (1234 >> 8)
		expect(longResult[4]).toBe(210) // port low byte (1234 & 0xff)
		expect(decodeBuffer(longResult.slice(5))).toBe(longHostname.substring(0, 32)) // should truncate to 32 characters
	})

	test("bufferToConfig", () => {
		const buffer = new Uint8Array([1, 10, 255, 4, 210, 116, 101, 115, 116]) // pin, num_leds, brightness, port_h, port_l, "test"

		const config = bufferToConfig(buffer)
		expect(config).toEqual({
			pin: 1,
			num_leds: 10,
			brightness: 255,
			port: 1234,
			hostname: "test",
		})

		// test with large hostname > 32 characters
		const longHostname = "a".repeat(40)
		const longBuffer = new Uint8Array([1, 10, 255, 4, 210, ...encodeBuffer(longHostname)])
		const longConfig = bufferToConfig(longBuffer)

		expect(longConfig).toEqual({
			pin: 1,
			num_leds: 10,
			brightness: 255,
			port: 1234,
			hostname: longHostname.substring(0, 32), // should truncate to 32
		})
	})
})

describe("addressToBuffer", () => {
	test("should convert IP and port to buffer", () => {
		const ip = "192.168.1.1"
		const port = 8080

		const buffer = addressToBuffer(ip, port)
		expect(buffer).toBeInstanceOf(Uint8Array)
		expect(buffer.length).toBe(6) // 4 bytes for IP + 2 bytes for port
		expect(buffer[0]).toBe(192) // 1st octet
		expect(buffer[1]).toBe(168) // 2nd octet
		expect(buffer[2]).toBe(1) //  // 3rd octet
		expect(buffer[3]).toBe(1) // 4th octet
		expect(buffer[4]).toBe(31) // // port high byte (8080 >> 8)
		expect(buffer[5]).toBe(144) // port low byte (8080 & 0xff)
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
