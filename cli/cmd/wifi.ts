import { Config, DeviceInfo, PacketStatus, PacketType } from "@reactive-leds/shared"
import dgram from "dgram"
import fs from "fs"
import os from "os"
import path from "path"

import { Command } from "../cmd"
import proto from "../protocol"
import { debug, fail, green, ok, validateDevicePort, validateHost } from "../utils"

////////////////////// Commands

export const scanCommand: Command = {
	name: "scan",
	description: "Scan for available devices over Wi-Fi via UDP broadcast (results cached for 5 minutes).",
	args: [
		{ name: "port", type: Number, required: false, default: 4210, validator: validateDevicePort },
		{ name: "timeout", type: Number, required: false, default: 1500 },
	],
	execute: async (port: number, timeout: number) => {
		const devices = await scan(port, { useCache: false, timeoutMs: timeout })

		if (devices.length === 0) {
			console.log(fail("No devices found"))
			return
		}

		console.log(`Available devices:\n${devices.map(d => "\t- " + formatDevice(d)).join("\n")}`)
	},
}

export const pingCommand: Command = {
	name: "ping",
	description: "Ping a device over Wi-Fi. If <host> is omitted, every device discovered on the network is pinged.",
	args: [
		{ name: "host", required: false, validator: validateHost },
		{ name: "port", type: Number, required: false, default: 4210, validator: validateDevicePort },
	],
	execute: async (host: string | undefined, port: number) => {
		const targets = await resolveTargets(host, port)
		if (targets.length === 0) return false

		for (const target of targets) {
			const result = await ping(target.ip, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.ip})` : target.ip
			console.log(`${label}: ${result ? ok("online") : fail("offline")}`)
		}
	},
}

export const resetWifiCommand: Command = {
	name: "reset-wifi",
	description: "Reset the Wi-Fi credentials on a device. If <host> is omitted, every discovered device is reset.",
	args: [
		{ name: "host", required: false, validator: validateHost },
		{ name: "port", type: Number, required: false, default: 4210, validator: validateDevicePort },
	],
	execute: async (host: string | undefined, port: number) => {
		const targets = await resolveTargets(host, port)
		if (targets.length === 0) return false

		for (const target of targets) {
			const result = await proto.resetWifi(target.ip, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.ip})` : target.ip
			console.log(`${label}: ${result ? ok("reset successfully") : fail("failed")}`)
		}
	},
}

////////////////////// Public API for other commands

export type ScanResult = {
	ip: string
	port: number
	info: DeviceInfo | null
	/** Device configuration as returned by GET_CONFIG, or `null` if the device
	 *  was reachable but didn't respond to the config query in time. Cached so
	 *  consumers (color, rainbow, …) don't have to re-fetch it before each send. */
	config: Config | null
}

/** Subset of ScanResult that consumer commands actually need. */
export type Target = {
	ip: string
	port: number
	config: Config | null
}

const CACHE_FILE = path.join(os.tmpdir(), "reactive-leds-scan.json")
const CACHE_MAX_MINUTES = 5
const BROADCAST_ADDRESS = "255.255.255.255"
const BROADCAST_SCAN_TIMEOUT = 1200
const BROADCAST_SCAN_ROUNDS = 3

/** Pretty one-line representation of a device. Hostname (from config) is
 *  shown first when available — it's the physical label the user wrote on
 *  the case's tape and is much more memorable than the IP. */
export function formatDevice(d: ScanResult, showPort: boolean = true): string {
	const addr = d.ip + (showPort ? `:${d.port}` : "")
	const hostname = d.info?.hostname || d.config?.hostname
	const mac = d.info?.mac
	const head = hostname ? `${hostname} (${addr})` : addr
	if (!mac) return green(head)
	return `${green(head)} ${mac}`
}

/** Delete the on-disk scan cache. Used by `clear-cache` and after SET_CONFIG. */
export function clearScanCache(): void {
	try {
		if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE)
	} catch (err) {
		debug("scan", "failed to clear cache:", err)
	}
}

/**
 * Scan the local network for reactive-leds devices.
 *
 * Results are cached in `os.tmpdir()/reactive-leds-scan.json` for
 * `cacheMaxMinutes` so subsequent calls (from any CLI command in the same
 * window) return instantly. Pass `useCache: false` to force a fresh scan.
 *
 * Returns devices that responded to a UDP ping on `port`.
 */
export async function scan(
	port: number,
	opts: { useCache?: boolean; cacheMaxMinutes?: number; verbose?: boolean; timeoutMs?: number } = {}
): Promise<ScanResult[]> {
	const { useCache = true, cacheMaxMinutes = CACHE_MAX_MINUTES, verbose = true, timeoutMs = BROADCAST_SCAN_TIMEOUT } = opts

	if (useCache) {
		const cached = readCache(cacheMaxMinutes)
		if (cached) {
			if (verbose) console.log(`Using cached scan (${cached.length} devices, age <${cacheMaxMinutes}min)`)
			return cached
		}
	}

	if (verbose) console.log("Scanning for devices...")
	const fresh = await runBroadcastScan(port, timeoutMs)
	if (fresh.length > 0) writeCache(fresh)
	return fresh
}

/**
 * Resolve `identifier` (an IP, a hostname, or undefined) to a list of target
 * devices with their cached config.
 *
 * - **undefined**: returns every device from `scan()` (5-min cache).
 * - **IPv4 address**: returns a single target; config is fetched on the spot
 *   (one UDP round trip) since we don't have it cached.
 * - **hostname**: looked up in the scan cache (matches `config.hostname`). If
 *   the hostname isn't in the cache we run one fresh scan as a fallback —
 *   useful when the user adds a new device but doesn't run `scan` explicitly.
 *
 * Used by multi-target commands (ping, color, rainbow, version, reset-wifi, off).
 */
export async function resolveTargets(
	identifier: string | undefined,
	port: number
): Promise<Target[]> {
	if (!identifier) {
		const devices = await scan(port)
		if (devices.length === 0) {
			console.log("No devices found")
			return []
		}
		return devices.map(d => ({ ip: d.ip, port, config: d.config }))
	}

	if (isIPv4(identifier)) {
		const config = await proto.getConfig(identifier, port).catch(() => null)
		return [{ ip: identifier, port, config }]
	}

	// Treat as hostname: cache lookup, then fresh-scan fallback.
	let devices = await scan(port)
	let found = devices.find(d => d.config?.hostname === identifier)

	if (!found) {
		console.log(`Hostname "${identifier}" not in cache, running fresh scan...`)
		devices = await scan(port, { useCache: false })
		found = devices.find(d => d.config?.hostname === identifier)
	}

	if (!found) {
		console.log(`Hostname "${identifier}" not found on the network`)
		return []
	}

	return [{ ip: found.ip, port, config: found.config }]
}

function isIPv4(value: string): boolean {
	const parts = value.split(".")
	if (parts.length !== 4) return false
	return parts.every(p => p !== "" && !isNaN(Number(p)) && Number(p) >= 0 && Number(p) <= 255)
}

/**
 * Ping a device, retrying up to `retries` times. Returns true on first success.
 */
export async function ping(ip: string, port: number): Promise<boolean> {
	try {
		return await proto.ping(ip, port)
	} catch (err) {
		debug("ping", `${ip} failed:`, err)
		return false
	}
}

////////////////////// Internal

function readCache(maxMinutes: number): ScanResult[] | null {
	if (!fs.existsSync(CACHE_FILE)) return null
	const ageMinutes = (Date.now() - fs.statSync(CACHE_FILE).mtimeMs) / 1000 / 60
	if (ageMinutes >= maxMinutes) return null
	try {
		const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as ScanResult[]
		if (!Array.isArray(data) || data.length === 0) return null
		// pre-rename cache files carry `address` instead of `ip` — treat them as stale
		if (data.some(d => !d.ip)) return null
		// pre-GET_INFO cache files may carry ARP/status MACs or no info; refresh them.
		if (data.some(d => !("info" in d))) return null

		// Bump mtime to "now" on every hit: the cache TTL becomes "time since last
		// access" instead of "time since written", so calling scan every minute keeps
		// the cache alive indefinitely as long as it's used within the window.
		try {
			const now = new Date()
			fs.utimesSync(CACHE_FILE, now, now)
		} catch (err) {
			debug("scan", "failed to bump cache mtime:", err)
		}

		return data
	} catch {
		return null
	}
}

function writeCache(devices: ScanResult[]): void {
	try {
		fs.writeFileSync(CACHE_FILE, JSON.stringify(devices, null, 2))
	} catch (err) {
		debug("scan", "failed to write cache:", err)
	}
}

function runBroadcastScan(port: number, timeoutMs = BROADCAST_SCAN_TIMEOUT): Promise<ScanResult[]> {
	return new Promise(resolve => {
		const socket = dgram.createSocket({ type: "udp4", reuseAddr: true })
		const requestId = (Date.now() % 255) + 1
		const message = new Uint8Array([requestId, PacketType.PING])
		const ips = new Set<string>()
		let interval: ReturnType<typeof setInterval> | undefined
		let done = false
		const timeout = setTimeout(() => {
			finish()
		}, timeoutMs)

		const sendRound = () => {
			socket.send(message, port, BROADCAST_ADDRESS, err => {
				if (err) debug("scan", `broadcast to ${BROADCAST_ADDRESS}:${port} failed:`, err)
			})
		}

		const finish = async () => {
			if (done) return
			done = true
			clearTimeout(timeout)
			if (interval) clearInterval(interval)
			try {
				socket.close()
			} catch {
				// The socket may fail before bind completes; discovery still resolves.
			}

			const devices = await Promise.all(
				[...ips].sort().map(async ip => {
					const [config, info] = await Promise.all([
						proto.getConfig(ip, port).catch(() => null),
						proto.getInfo(ip, port).catch(() => null),
					])
					return { ip, port: info?.port ?? port, info, config }
				})
			)
			resolve(devices)
		}

		socket.on("message", (msg, rinfo) => {
			if (msg.length < 3) return
			if (msg[0] !== requestId || msg[1] !== PacketType.PING || msg[2] !== PacketStatus.OK) return
			if (isIPv4(rinfo.address)) ips.add(rinfo.address)
		})

		socket.on("error", err => {
			debug("scan", "broadcast socket error:", err)
			finish()
		})

		socket.bind(0, () => {
			socket.setBroadcast(true)
			sendRound()

			let rounds = 1
			interval = setInterval(() => {
				if (rounds >= BROADCAST_SCAN_ROUNDS) {
					clearInterval(interval)
					return
				}
				rounds++
				sendRound()
			}, Math.max(250, Math.floor(timeoutMs / BROADCAST_SCAN_ROUNDS)))
		})
	})
}
