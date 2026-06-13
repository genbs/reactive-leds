import { Config } from "@reactive-leds/shared"
import fs from "fs"
import os from "os"
import path from "path"
import { exec } from "child_process"

import { Command } from "../cmd"
import proto from "../protocol"
import { debug, fail, green, ok, validateAddressOrHostname, validatePort } from "../utils"

////////////////////// Commands

export const scanCommand: Command = {
	name: "scan",
	description: "Scan for available devices over Wi-Fi (results cached for 5 minutes).",
	args: [
		{ name: "port", type: Number, required: false, default: 4210, validator: validatePort },
		{ name: "timeout", type: Number, required: false, default: 10000 },
	],
	execute: async (port: number, timeout: number) => {
		const devices = await Promise.race([
			scan(port, { useCache: false }),
			new Promise<ScanResult[]>(resolve => setTimeout(() => resolve([]), timeout)),
		])

		if (devices.length === 0) {
			console.log(fail("No devices found"))
			return
		}

		console.log(`Available devices:\n${devices.map(d => "\t- " + formatDevice(d)).join("\n")}`)
	},
}

export const pingCommand: Command = {
	name: "ping",
	description: "Ping a device over Wi-Fi. If <address> is omitted, every device discovered on the network is pinged.",
	args: [
		{ name: "address", required: false, validator: validateAddressOrHostname },
		{ name: "port", type: Number, required: false, default: 4210, validator: validatePort },
	],
	execute: async (address: string | undefined, port: number) => {
		const targets = await resolveTargets(address, port)
		if (targets.length === 0) return false

		for (const target of targets) {
			const result = await ping(target.address, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.address})` : target.address
			console.log(`${label}: ${result ? ok("online") : fail("offline")}`)
		}
	},
}

export const resetWifiCommand: Command = {
	name: "reset-wifi",
	description: "Reset the Wi-Fi credentials on a device. If <address> is omitted, every discovered device is reset.",
	args: [
		{ name: "address", required: false, validator: validateAddressOrHostname },
		{ name: "port", type: Number, required: false, default: 4210, validator: validatePort },
	],
	execute: async (address: string | undefined, port: number) => {
		const targets = await resolveTargets(address, port)
		if (targets.length === 0) return false

		for (const target of targets) {
			const result = await proto.resetWifi(target.address, target.port)
			const label = target.config?.hostname ? `${target.config.hostname} (${target.address})` : target.address
			console.log(`${label}: ${result ? ok("reset successfully") : fail("failed")}`)
		}
	},
}

////////////////////// Public API for other commands

export type ScanResult = {
	address: string
	mac: string
	port: number
	/** Device configuration as returned by GET_CONFIG, or `null` if the device
	 *  was reachable but didn't respond to the config query in time. Cached so
	 *  consumers (color, rainbow, …) don't have to re-fetch it before each send. */
	config: Config | null
}

/** Subset of ScanResult that consumer commands actually need. */
export type Target = {
	address: string
	port: number
	config: Config | null
}

const CACHE_FILE = path.join(os.tmpdir(), "reactive-leds-scan.json")
const CACHE_MAX_MINUTES = 5

/** Pretty one-line representation of a device. Hostname (from config) is
 *  shown first when available — it's the physical label the user wrote on
 *  the case's tape and is much more memorable than the IP. */
export function formatDevice(d: ScanResult, showPort: boolean = true): string {
	const addr = d.address + (showPort ? `:${d.port}` : "")
	const head = d.config?.hostname ? `${d.config.hostname} (${addr})` : addr
	return `${green(head)} ${d.mac}`
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
	opts: { useCache?: boolean; cacheMaxMinutes?: number; verbose?: boolean } = {}
): Promise<ScanResult[]> {
	const { useCache = true, cacheMaxMinutes = CACHE_MAX_MINUTES, verbose = true } = opts

	if (useCache) {
		const cached = readCache(cacheMaxMinutes)
		if (cached) {
			if (verbose) console.log(`Using cached scan (${cached.length} devices, age <${cacheMaxMinutes}min)`)
			return cached
		}
	}

	if (verbose) console.log("Scanning for devices...")
	const fresh = await runArpScan(port)
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
		return devices.map(d => ({ address: d.address, port, config: d.config }))
	}

	if (isIPv4(identifier)) {
		const config = await proto.getConfig(identifier, port).catch(() => null)
		return [{ address: identifier, port, config }]
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

	return [{ address: found.address, port, config: found.config }]
}

function isIPv4(value: string): boolean {
	const parts = value.split(".")
	if (parts.length !== 4) return false
	return parts.every(p => p !== "" && !isNaN(Number(p)) && Number(p) >= 0 && Number(p) <= 255)
}

/**
 * Ping a device, retrying up to `retries` times. Returns true on first success.
 */
export async function ping(address: string, port: number): Promise<boolean> {
	try {
		return await proto.ping(address, port)
	} catch (err) {
		debug("ping", `${address} failed:`, err)
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

function runArpScan(port: number): Promise<ScanResult[]> {
	return new Promise(resolve => {
		exec("arp -a", async (error, stdout, stderr) => {
			if (error || stderr) return resolve([])

			const devices = await Promise.all(
				stdout.split("\n").map(async line => {
					const parts = line.split(/\s+/)
					if (parts.length < 4) return null
					if (parts[3] === "(incomplete)" || parts[3] === "ff:ff:ff:ff:ff:ff") return null

					debug("scan", "Found ARP entry:", line)

					const address = parts[1].replace(/[()]/g, "")
					const mac = parts[3]
						.split(":")
						.map(part => parseInt(part, 16).toString(16).padStart(2, "0").toUpperCase())
						.join(":")

					// use the retrying ping wrapper: a single UDP ping is unreliable on
					// noisy Wi-Fi and would false-negative an online device.
					if (!(await ping(address, port))) return null

					// Pull the config once during the scan so consumers don't have to
					// re-fetch before every setLEDs. `null` is fine if it times out —
					// downstream code falls back to num_leds=16.
					const config = await proto.getConfig(address, port).catch(() => null)
					return { address, mac, port, config }
				})
			)

			resolve(devices.filter(Boolean) as ScanResult[])
		})
	})
}
