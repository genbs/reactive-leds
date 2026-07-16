import type { Status } from "@reactive-leds/shared"
import { awdlIsActive, awdlWarningLines } from "../awdl"
import type { Command } from "../cmd"
import proto from "../protocol"
import { fail, ok, validateTarget, warn } from "../utils"
import { resolveTargets, Target } from "./wifi"

const BRIGHTNESS = 48
// Packet-id scheme, mirrored by the firmware (protocol.c):
//   0 = untracked (ordinary SET_LEDS), 1 = benchmark start marker,
//   2..255 = benchmark stream. Keeping the marker out of the stream range lets
//   the firmware tell them apart by id alone.
const START_PACKET_ID = 1
const SET_LEDS_STREAM_FIRST_PACKET_ID = 2
const SET_LEDS_STREAM_PACKET_COUNT = 254 // ids 2..255
const START_MARKER_SETTLE_MS = 50
const SETTLE_MS = 500
const LATE_FRAME_MS = 5
const RTT_SAMPLES = 1000

type BenchmarkFormat = "text" | "json"

type BenchTarget = Target & {
	leds: number
	data: Uint8Array
	attempted: number
	ok: number
	errors: number
}

type BenchmarkQualityLevel = "excellent" | "good" | "fair" | "poor"

type BenchmarkQuality = {
	level: BenchmarkQualityLevel
	score: number
	reason: string
}

type BenchmarkQualityInput = {
	attempted: number
	recv: number
	dropped: number
	seqLost: number
	seqReordered: number
	beaconTimeouts: number
	disconnects: number
	arrivalGapHist?: number[]
	arrivalGapMaxMs?: number
	arrivalGapMaxDuringTest: boolean
}

export type RttSummary = {
	attempted: number
	received: number
	lost: number
	p50Ms: number | null
	p95Ms: number | null
	p99Ms: number | null
	maxMs: number | null
}

// One device = one link = one clean measurement. Packet id 0 is intentionally
// untracked, so arrival/sequence counters are benchmark-only.
export const benchmarkCommand: Command = {
	name: "benchmark",
	description:
		"Send timed LED frames to a single device and report delivery/jitter counters with a quality verdict.\n" +
		"Measures one link at a time by design; use `status` during real streams for runtime health counters.",
	examples: ["benchmark 192.168.1.100", "benchmark 192.168.1.100 90 30", "benchmark 192.168.1.100:4211 120 60 json"],
	args: [
		{ required: true, name: "target", type: String, validator: validateSingleTarget },
		{ required: false, name: "fps", type: Number, default: 60, validator: validatePositive },
		{ required: false, name: "duration", type: Number, default: 30, validator: validatePositive },
		{ required: false, name: "format", type: String, default: "text", validator: validateFormat },
	],
	execute: async (target: string, fps: number, duration: number, format: BenchmarkFormat) => {
		const awdlActive = await awdlIsActive()
		if (format === "text" && awdlActive)
			for (const line of awdlWarningLines("benchmark")) console.log(line)

		const resolved = await resolveTargets(target, 4210, format === "text")
		if (resolved.length === 0) return false
		const bench = toBenchTarget(resolved[0])
		if (!await readStatus(bench)) {
			printError(format, `${targetKey(bench)}: no initial status`)
			return false
		}

		if (format === "text") console.log(`Measuring ${RTT_SAMPLES} sequential ping round trips`)
		const rtt = await measureRtt(bench, RTT_SAMPLES)

		await sendStartMarker(bench)
		await sleep(START_MARKER_SETTLE_MS)
		const before = await readStatus(bench)
		if (!before) {
			printError(format, `${targetKey(bench)}: no status before stream`)
			return false
		}
		if (format === "text") console.log(`Sending ${fps} fps for ${duration}s to ${targetKey(bench)}`)

		const run = await sendFrames(bench, fps, duration)
		await sleep(SETTLE_MS)

		const after = await readStatus(bench)
		if (!after) {
			printError(format, `${targetKey(bench)}: no final status`)
			return false
		}
		const report = createReport(bench, before, after, run, rtt, fps, duration, awdlActive)
		if (format === "json") console.log(JSON.stringify(report, null, 2))
		else printReport(report)
	},
}

function validateSingleTarget(value: string): boolean | string {
	if (value?.toLowerCase().startsWith("all")) {
		return 'benchmark measures one link at a time — pass a single IP/hostname'
	}
	return validateTarget(value)
}

function validatePositive(value: number): boolean | string {
	return Number.isFinite(value) && value > 0 || `"${value}" must be greater than 0`
}

function validateFormat(value: string): boolean | string {
	return value === "text" || value === "json" || `"${value}" must be text or json`
}

function toBenchTarget(target: Target): BenchTarget {
	const leds = target.config?.num_leds ?? 16
	return {
		...target,
		leds,
		data: new Uint8Array(leds * 5),
		attempted: 0,
		ok: 0,
		errors: 0,
	}
}

function readStatus(target: BenchTarget): Promise<Status | null> {
	return proto.getStatus(target.ip, target.port)
}

async function measureRtt(target: BenchTarget, samples: number): Promise<RttSummary> {
	const latencies: number[] = []
	for (let i = 0; i < samples; i++) {
		const start = performance.now()
		if (await proto.ping(target.ip, target.port))
			latencies.push(performance.now() - start)
	}
	return summarizeRtt(latencies, samples)
}

export function summarizeRtt(latencies: number[], attempted: number): RttSummary {
	const sorted = [...latencies].sort((a, b) => a - b)
	const value = (percentile: number) => {
		if (sorted.length === 0) return null
		const index = Math.ceil(percentile * sorted.length) - 1
		return Number(sorted[Math.max(0, index)].toFixed(3))
	}

	return {
		attempted,
		received: sorted.length,
		lost: attempted - sorted.length,
		p50Ms: value(0.50),
		p95Ms: value(0.95),
		p99Ms: value(0.99),
		maxMs: value(1),
	}
}

async function sendFrames(target: BenchTarget, fps: number, duration: number) {
	const intervalMs = 1000 / fps
	const frames = Math.round(duration * fps)
	const start = performance.now()
	let lateFrames = 0
	let maxLateMs = 0

	for (let frame = 0; frame < frames; frame++) {
		await sendFrame(target, frame)

		const next = start + (frame + 1) * intervalMs
		const delay = next - performance.now()
		if (delay > 0) {
			await sleep(delay)
		} else if (-delay > LATE_FRAME_MS) {
			lateFrames++
			if (-delay > maxLateMs) maxLateMs = -delay
		}
	}

	return { frames, elapsedMs: performance.now() - start, lateFrames, maxLateMs }
}

// Sent with the reserved marker id (1) before the "before" status read: the
// firmware treats it as a run boundary, resetting the per-run max gap and
// re-arming the sequence baseline. The marker itself is not measured (the
// firmware skips its arrival gap and does not sequence-track it), so the
// ~50-60ms marker→frame-0 pause never shows up in the histogram or max gap.
async function sendStartMarker(target: BenchTarget) {
	writeFrame(target.data, target.leds, 0)
	await proto.setLEDs(target.ip, target.port, target.data, START_PACKET_ID)
}

async function sendFrame(target: BenchTarget, frame: number) {
	writeFrame(target.data, target.leds, frame)
	target.attempted++
	const ok = await proto.setLEDs(target.ip, target.port, target.data, benchmarkPacketId(frame))
	if (ok) target.ok++
	else target.errors++
}

// Stream ids cycle through 2..255 and never touch 1: id 1 is reserved for the
// start marker, so the firmware tells marker from stream by id alone (no timing
// heuristic). The firmware computes deltas in this 254-wide space, so the
// 255 -> 2 wrap is a clean +1 step.
export function benchmarkPacketId(frame: number): number {
	return SET_LEDS_STREAM_FIRST_PACKET_ID + (frame % SET_LEDS_STREAM_PACKET_COUNT)
}

function writeFrame(data: Uint8Array, leds: number, frame: number) {
	for (let i = 0; i < leds; i++) {
		const offset = i * 5
		const phase = (frame + i * 5) % 96
		data[offset] = i
		data[offset + 1] = phase < 32 ? BRIGHTNESS : 0
		data[offset + 2] = phase >= 32 && phase < 64 ? BRIGHTNESS : 0
		data[offset + 3] = phase >= 64 ? BRIGHTNESS : 0
		data[offset + 4] = 0
	}
}

function createReport(
	target: BenchTarget,
	before: Status,
	after: Status,
	run: { frames: number; elapsedMs: number; lateFrames: number; maxLateMs: number },
	rtt: RttSummary,
	fps: number,
	duration: number,
	awdlActive: boolean
) {
	const recv = delta(after, before, "framesReceived")
	const shown = delta(after, before, "framesShown")
	const dropped = delta(after, before, "framesDropped")
	const udpRead = delta(after, before, "udpPacketsRead")
	// GET_STATUS increments this counter before returning it.
	const streamUdpRead = Math.max(0, udpRead - 1)
	const seqLost = delta(after, before, "seqLost")
	const seqReordered = delta(after, before, "seqReordered")
	const beaconTimeouts = delta(after, before, "beaconTimeouts")
	const disconnects = delta(after, before, "wifiDisconnects")
	const hist = after.arrivalGapHist?.map((count, i) => count - (before?.arrivalGapHist?.[i] ?? 0))
	const maxGapAgeMs = (after.arrivalGapMaxAgeS ?? Infinity) * 1000
	const maxGapDuringTest = maxGapAgeMs <= run.elapsedMs + SETTLE_MS + 2000
	const quality = evaluateBenchmarkQuality({
		attempted: target.attempted,
		recv,
		dropped,
		seqLost,
		seqReordered,
		beaconTimeouts,
		disconnects,
		arrivalGapHist: hist,
		arrivalGapMaxMs: after.arrivalGapMaxMs,
		arrivalGapMaxDuringTest: maxGapDuringTest,
	})

	const elapsedSeconds = run.elapsedMs / 1000
	return {
		schemaVersion: 1,
		timestamp: new Date().toISOString(),
		target: { ip: target.ip, port: target.port, leds: target.leds },
		parameters: { fps, durationSeconds: duration, awdlActive },
		rtt,
		host: {
			attempted: target.attempted,
			sendOk: target.ok,
			sendErrors: target.errors,
			elapsedMs: run.elapsedMs,
			schedulerFps: run.frames / elapsedSeconds,
			lateFrames: run.lateFrames,
			maxLateMs: run.maxLateMs,
		},
		status: { before, after },
		delta: {
			udpPacketsRead: udpRead,
			streamUdpPacketsRead: streamUdpRead,
			framesReceived: recv,
			framesShown: shown,
			framesDropped: dropped,
			seqLost,
			seqReordered,
			beaconTimeouts,
			wifiDisconnects: disconnects,
			arrivalGapHist: hist,
		},
		metrics: {
			deliveryPct: percentage(recv, target.attempted),
			udpReadPct: percentage(streamUdpRead, target.attempted),
			shownFps: shown / elapsedSeconds,
			rmtDropPct: percentage(dropped, recv),
			arrivalGapMaxMs: after.arrivalGapMaxMs,
			arrivalGapMaxDuringTest: maxGapDuringTest,
		},
		quality,
	}
}

type BenchmarkReport = ReturnType<typeof createReport>

function printReport(report: BenchmarkReport) {
	const { after } = report.status
	const rssi = after.rssi === 0 ? "N/A" : `${after.rssi} dBm`
	console.log("")
	console.log(`Host attempted ${report.host.attempted} frames in ${(report.host.elapsedMs / 1000).toFixed(2)}s (${report.host.schedulerFps.toFixed(1)} fps scheduler rate)`)
	console.log(`Host scheduler: frames >${LATE_FRAME_MS}ms late ${report.host.lateFrames}  max-late ${report.host.maxLateMs.toFixed(0)}ms`)
	console.log(`RTT: ${report.rtt.received}/${report.rtt.attempted}  p50 ${fmtMs(report.rtt.p50Ms)}  p95 ${fmtMs(report.rtt.p95Ms)}  p99 ${fmtMs(report.rtt.p99Ms)}  max ${fmtMs(report.rtt.maxMs)}`)
	console.log(`${report.target.ip}:${report.target.port}: attempted ${report.host.attempted}  send-ok ${report.host.sendOk}  send-errors ${report.host.sendErrors}`)
	console.log(`  quality ${formatQuality(report.quality)}`)
	console.log(`  firmware udp-read ${report.delta.streamUdpPacketsRead}  device recv ${report.delta.framesReceived}  shown ${report.delta.framesShown}  dropped ${report.delta.framesDropped}`)
	console.log(`  udp-read/attempted ${fmtPct(report.metrics.udpReadPct)}  set-leds ${fmtPct(report.metrics.deliveryPct)}  shown-rate ${report.metrics.shownFps.toFixed(1)}fps  rmt-drop-rate ${fmtPct(report.metrics.rmtDropPct, 3)}  loop-max-gap ${after.protocolLoopMaxGapMs ?? "n/a"}ms since boot  rssi ${rssi}`)
	console.log(`  heap ${fmt(after.heap)}  internal ${fmt(after.internalHeap)}  largest ${fmt(after.largestHeapBlock)}  min ${fmt(after.minHeap)}`)

	if (after.arrivalGapHist !== undefined) {
		console.log(`  arrival-gaps ${formatGapHist(report.delta.arrivalGapHist ?? [])}  max ${after.arrivalGapMaxMs}ms ${report.metrics.arrivalGapMaxDuringTest ? "(during this test)" : `(${after.arrivalGapMaxAgeS}s ago, before test)`}`)
		console.log(`  link seq-lost ${report.delta.seqLost}  seq-reordered ${report.delta.seqReordered}  beacon-timeouts ${report.delta.beaconTimeouts}  disconnects ${report.delta.wifiDisconnects}`)
	}
}

// Weights calibrated against the empirical WiFi noise floor measured on this
// project at strong signal (RSSI > -70dBm, AWDL off): isolated gaps up to
// ~150-200ms and a handful of seq-lost packets per test are physical 2.4GHz
// jitter, not a fixable defect (see firmware/README.md Design Choices and the
// AWDL investigation, where a clean run still showed ~7 gaps >100ms and 13
// seq-lost per 120s). The score must separate that floor from a genuinely
// degraded device, not flag every real-world run as "poor".
export function evaluateBenchmarkQuality(input: BenchmarkQualityInput): BenchmarkQuality {
	const deliveryPct = input.attempted > 0 ? (input.recv / input.attempted) * 100 : 0
	const lossPct = Math.max(0, 100 - deliveryPct)
	const lateGaps = (input.arrivalGapHist?.[4] ?? 0) + (input.arrivalGapHist?.[5] ?? 0)
	const veryLateGaps = input.arrivalGapHist?.[5] ?? 0
	const maxGapMs = input.arrivalGapMaxDuringTest ? input.arrivalGapMaxMs ?? 0 : 0
	const lateGapPct = input.attempted > 0 ? (lateGaps / input.attempted) * 100 : 0
	const score = Math.max(0, Math.round(100
		- Math.min(40, lossPct * 6)
		- Math.min(25, input.seqLost * 0.8)
		- Math.min(20, input.dropped * 2)
		- Math.min(20, input.seqReordered * 5)
		- Math.min(30, veryLateGaps * 3)
		- Math.min(20, lateGapPct * 2)
		// Gaps below ~80ms are routine jitter (the ≤50/≤100 buckets are busy on
		// every healthy run); only the tail beyond that costs points.
		- Math.min(25, Math.max(0, maxGapMs - 80) / 3)
		- Math.min(25, input.beaconTimeouts * 5)
		- Math.min(40, input.disconnects * 10)
	))
	const issues = [
		`${deliveryPct.toFixed(1)}% recv`,
		`score ${score}/100`,
		maxGapMs > 0 ? `max ${maxGapMs}ms` : undefined,
		input.seqLost > 0 ? `seq-lost ${input.seqLost}` : undefined,
		input.dropped > 0 ? `rmt-drop ${input.dropped}` : undefined,
		veryLateGaps > 0 ? `>100ms ${veryLateGaps}` : undefined,
		input.disconnects > 0 ? `disconnects ${input.disconnects}` : undefined,
		input.beaconTimeouts > 0 ? `beacon-timeouts ${input.beaconTimeouts}` : undefined,
	].filter((value): value is string => value !== undefined)

	// Hard floor, independent of score: these are qualitatively different from
	// ordinary jitter — the firmware dropping frames it already received, or
	// the WiFi association itself hiccuping — not just a slow packet now and
	// then. A single isolated >100ms gap or a few lost sequence numbers must
	// NOT land here; that's the floor above, reflected in the score instead.
	const unstable = input.dropped > 0 || input.disconnects > 0 || input.beaconTimeouts > 0

	if (unstable || score < 55)
		return { level: "poor", score, reason: issues.join(", ") }
	if (score < 75)
		return { level: "fair", score, reason: issues.join(", ") }
	if (score < 90)
		return { level: "good", score, reason: issues.join(", ") }

	return { level: "excellent", score, reason: issues.join(", ") }
}

function formatQuality(quality: BenchmarkQuality): string {
	const label = quality.level === "excellent" ? ok(quality.level)
		: quality.level === "good" ? ok(quality.level)
			: quality.level === "fair" ? warn(quality.level)
				: fail(quality.level)
	return `${label} (${quality.reason})`
}

function delta(after: Status | null | undefined, before: Status | null | undefined, key: keyof Status): number {
	const a = after?.[key]
	const b = before?.[key]
	if (typeof a !== "number") return 0
	if (typeof b !== "number") return a
	return a - b
}

function formatGapHist(hist: number[]): string {
	const labels = ["≤5ms", "≤10", "≤20", "≤50", "≤100", ">100"]
	return hist.map((count, i) => `${labels[i]} ${count}`).join("  ")
}

function percentage(value: number, total: number): number | null {
	return total > 0 ? value / total * 100 : null
}

function fmtPct(value: number | null, digits = 1): string {
	return value === null ? "n/a" : `${value.toFixed(digits)}%`
}

function fmtMs(value: number | null): string {
	return value === null ? "n/a" : `${value.toFixed(3)}ms`
}

function fmt(bytes: number | undefined): string {
	if (bytes === undefined) return "n/a"
	if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
	return `${Math.round(bytes / 1024)} KB`
}

function targetKey(target: Target): string {
	return `${target.ip}:${target.port}`
}

function printError(format: BenchmarkFormat, message: string) {
	console.log(format === "json" ? JSON.stringify({ error: message }) : fail(message))
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
