import { serialCredentialsPacket } from "../cmd/serial"

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
