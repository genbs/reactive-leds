import { parseAwdlActive } from "../awdl"

describe("awdl", () => {
	test("parseAwdlActive detects an active interface", () => {
		const output = `awdl0: flags=8943<UP,BROADCAST,RUNNING,PROMISC,SIMPLEX,MULTICAST> mtu 1500
	ether aa:bb:cc:dd:ee:ff
	inet6 fe80::1%awdl0 prefixlen 64 scopeid 0x10
	nd6 options=201<PERFORMNUD,DAD>
	media: autoselect
	status: active`
		expect(parseAwdlActive(output)).toBe(true)
	})

	test("parseAwdlActive detects an inactive interface", () => {
		const output = `awdl0: flags=8902<BROADCAST,PROMISC,SIMPLEX,MULTICAST> mtu 1500
	ether aa:bb:cc:dd:ee:ff
	media: autoselect
	status: inactive`
		expect(parseAwdlActive(output)).toBe(false)
	})

})
