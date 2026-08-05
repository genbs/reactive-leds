import { benchmarkPacketId, evaluateBenchmarkQuality, summarizeRtt } from "../cmd/benchmark"

describe("benchmark packet ids", () => {
	test("stream ids cycle through 2..255, never the untracked 0 or the marker 1", () => {
		expect(benchmarkPacketId(0)).toBe(2)
		expect(benchmarkPacketId(253)).toBe(255)
		expect(benchmarkPacketId(254)).toBe(2) // wraps 255 -> 2, never touches 1
		expect(benchmarkPacketId(255)).toBe(3)

		for (let frame = 0; frame < 1024; frame++) {
			const id = benchmarkPacketId(frame)
			expect(id).toBeGreaterThanOrEqual(2)
			expect(id).toBeLessThanOrEqual(255)
		}
	})
})

describe("benchmark RTT", () => {
	test("reports nearest-rank percentiles and packet loss", () => {
		const rtt = summarizeRtt([10, 1, 5, 2], 5)
		expect(rtt).toEqual({
			attempted: 5,
			received: 4,
			lost: 1,
			p50Ms: 2,
			p95Ms: 10,
			p99Ms: 10,
			maxMs: 10,
		})
	})

	test("reports null percentiles when every ping is lost", () => {
		expect(summarizeRtt([], 3)).toEqual({
			attempted: 3,
			received: 0,
			lost: 3,
			p50Ms: null,
			p95Ms: null,
			p99Ms: null,
			maxMs: null,
		})
	})
})

describe("benchmark quality", () => {
	const base = {
		attempted: 1800,
		recv: 1800,
		dropped: 0,
		seqLost: 0,
		seqReordered: 0,
		beaconTimeouts: 0,
		disconnects: 0,
		arrivalGapHist: [20, 50, 1700, 30, 0, 0],
		arrivalGapMaxMs: 30,
		arrivalGapMaxDuringTest: true,
	}

	test("rates clean realtime delivery as excellent", () => {
		const quality = evaluateBenchmarkQuality(base)
		expect(quality.level).toBe("excellent")
		expect(quality.score).toBeGreaterThanOrEqual(95)
	})

	test("a handful of seq-lost within the known noise floor stays close to excellent", () => {
		const quality = evaluateBenchmarkQuality({
			...base,
			recv: 1795,
			seqLost: 5,
			arrivalGapHist: [6, 14, 1740, 33, 2, 0],
			arrivalGapMaxMs: 84,
		})
		expect(quality.level).toBe("excellent")
		expect(quality.score).toBeLessThan(100)
	})

	test("rates a real degraded device (elevated loss + late gaps) as fair", () => {
		const quality = evaluateBenchmarkQuality({
			...base,
			recv: 1791,
			seqLost: 4,
			arrivalGapHist: [20, 50, 1692, 26, 4, 4],
			arrivalGapMaxMs: 110,
		})
		expect(quality.level).toBe("fair")
	})

	test("a few isolated >100ms gaps with zero packet loss is NOT poor", () => {
		const quality = evaluateBenchmarkQuality({
			...base,
			arrivalGapHist: [20, 50, 1700, 20, 8, 2],
			arrivalGapMaxMs: 140,
		})
		expect(quality.level).not.toBe("poor")
	})

	test("firmware RMT drops are a hard floor to poor regardless of score", () => {
		const quality = evaluateBenchmarkQuality({ ...base, dropped: 3 })
		expect(quality.level).toBe("poor")
	})

	test("WiFi disconnects are a hard floor to poor regardless of score", () => {
		const quality = evaluateBenchmarkQuality({ ...base, disconnects: 1 })
		expect(quality.level).toBe("poor")
	})

	test("separates a healthy device (jitter only) from a degraded one (real loss) — real benchmark data", () => {
		const jitterOnly = evaluateBenchmarkQuality({
			...base,
			arrivalGapHist: [70, 88, 1472, 163, 4, 3],
			arrivalGapMaxMs: 124,
		})
		const lossAndJitter = evaluateBenchmarkQuality({
			...base,
			recv: 1790,
			seqLost: 10,
			arrivalGapHist: [111, 81, 1427, 157, 5, 9],
			arrivalGapMaxMs: 146,
		})

		expect(jitterOnly.level).not.toBe("poor")
		expect(lossAndJitter.level).toBe("poor")
		expect(lossAndJitter.score).toBeLessThan(jitterOnly.score)
	})
})
