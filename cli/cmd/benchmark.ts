import type { Status } from "@reactive-leds/shared"
import { warnIfAwdlActive } from "../awdl"
import type { Command } from "../cmd"
import proto from "../protocol"
import { fail, validateDevicePort, validateHost } from "../utils"
import { resolveTargets, Target } from "./wifi"

const BRIGHTNESS = 48
const SETTLE_MS = 500
const LATE_FRAME_MS = 5

type BenchTarget = Target & {
	leds: number
	data: Uint8Array
	attempted: number
	ok: number
	errors: number
}

export const benchmarkCommand: Command = {
	name: "benchmark",
	description:
		"Send timed LED frames and report delivery/jitter counters. If <host> is omitted, every discovered device is tested.",
	examples: ["benchmark", "benchmark 192.168.1.100", "benchmark 192.168.1.100 120 60"],
	args: [
		{ required: false, name: "host", type: String, validator: validateHost },
		{ required: false, name: "fps", type: Number, default: 60, validator: validatePositive },
		{ required: false, name: "duration", type: Number, default: 30, validator: validatePositive },
		{ required: false, name: "port", type: Number, default: 4210, validator: validateDevicePort },
	],
	execute: async (host: string | undefined, fps: number, duration: number, port: number) => {
		await warnIfAwdlActive("benchmark")

		const targets = (await resolveTargets(host, port)).map(toBenchTarget)
		if (targets.length === 0) return false

		const before = await readStatuses(targets)
		console.log(`Sending ${fps} fps for ${duration}s to ${targets.length} device(s)`)

		const run = await sendFrames(targets, fps, duration)
		await sleep(SETTLE_MS)

		const after = await readStatuses(targets)
		printReport(targets, before, after, run)
	},
}

function validatePositive(value: number): boolean | string {
	return Number.isFinite(value) && value > 0 || `"${value}" must be greater than 0`
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

async function readStatuses(targets: BenchTarget[]): Promise<Map<string, Status | null>> {
	const entries = await Promise.all(
		targets.map(async target => [targetKey(target), await proto.getStatus(target.ip, target.port)] as const)
	)
	return new Map(entries)
}

async function sendFrames(targets: BenchTarget[], fps: number, duration: number) {
	const intervalMs = 1000 / fps
	const frames = Math.round(duration * fps)
	const start = performance.now()
	let lateFrames = 0
	let maxLateMs = 0

	for (let frame = 0; frame < frames; frame++) {
		await Promise.all(targets.map(target => sendFrame(target, frame)))

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

async function sendFrame(target: BenchTarget, frame: number) {
	writeFrame(target.data, target.leds, frame)
	target.attempted++
	const ok = await proto.setLEDsFrame(target.ip, target.port, frame % 256, target.data)
	if (ok) target.ok++
	else target.errors++
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

function printReport(
	targets: BenchTarget[],
	before: Map<string, Status | null>,
	after: Map<string, Status | null>,
	run: { frames: number; elapsedMs: number; lateFrames: number; maxLateMs: number }
) {
	console.log("")
	console.log(`Host attempted ${run.frames} frames in ${(run.elapsedMs / 1000).toFixed(2)}s (${(run.frames / (run.elapsedMs / 1000)).toFixed(1)} fps scheduler rate)`)
	console.log(`Host scheduler: frames >${LATE_FRAME_MS}ms late ${run.lateFrames}  max-late ${run.maxLateMs.toFixed(0)}ms`)
	console.log("Results:")

	for (const target of targets) {
		const key = targetKey(target)
		const a = after.get(key)
		const b = before.get(key)
		if (!a) {
			console.log(`${key}: ${fail("no final status")}`)
			continue
		}

		const recv = delta(a, b, "framesReceived")
		const shown = delta(a, b, "framesShown")
		const dropped = delta(a, b, "framesDropped")
		const udpRead = delta(a, b, "udpPacketsRead")
		const setLedsRate = rate(recv, target.attempted)
		const udpReadRate = rate(udpRead, target.attempted)
		const rmtDropRate = recv > 0 ? `${((dropped / recv) * 100).toFixed(3)}%` : "n/a"
		const rssi = a.rssi === 0 ? "N/A" : `${a.rssi} dBm`

		console.log(`${key}: attempted ${target.attempted}  send-ok ${target.ok}  send-errors ${target.errors}`)
		console.log(`  firmware udp-read ${udpRead}  device recv ${recv}  shown ${shown}  dropped ${dropped}`)
		console.log(`  udp-read/attempted ${udpReadRate}  set-leds ${setLedsRate}  rmt-drop-rate ${rmtDropRate}  loop-max-gap ${a.protocolLoopMaxGapMs ?? "n/a"}ms since boot  rssi ${rssi}`)
		console.log(`  heap ${fmt(a.heap)}  internal ${fmt(a.internalHeap)}  largest ${fmt(a.largestHeapBlock)}  min ${fmt(a.minHeap)}`)

		if (a.arrivalGapHist !== undefined) {
			const hist = a.arrivalGapHist.map((count, i) => count - (b?.arrivalGapHist?.[i] ?? 0))
			const maxGapAgeMs = (a.arrivalGapMaxAgeS ?? Infinity) * 1000
			const during = maxGapAgeMs <= run.elapsedMs + SETTLE_MS + 2000
			console.log(`  arrival-gaps ${formatGapHist(hist)}  max ${a.arrivalGapMaxMs}ms ${during ? "(during this test)" : `(${a.arrivalGapMaxAgeS}s ago, before test)`}`)
			console.log(`  link seq-lost ${delta(a, b, "seqLost")}  seq-reordered ${delta(a, b, "seqReordered")}  beacon-timeouts ${delta(a, b, "beaconTimeouts")}  disconnects ${delta(a, b, "wifiDisconnects")}`)
		}
	}
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

function rate(value: number, total: number): string {
	return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "n/a"
}

function fmt(bytes: number | undefined): string {
	if (bytes === undefined) return "n/a"
	if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
	return `${Math.round(bytes / 1024)} KB`
}

function targetKey(target: Target): string {
	return `${target.ip}:${target.port}`
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
