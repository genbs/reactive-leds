/**
 * AWDL (Apple Wireless Direct Link) guard for macOS.
 *
 * AWDL is the hidden interface behind AirDrop/AirPlay/Handoff. While active,
 * macOS periodically hops the WiFi radio off-channel to scan for nearby Apple
 * devices, holding outbound traffic for 50-200ms every few seconds — visible
 * as micro-lag when streaming LED frames in real time. Disabling awdl0 for
 * the duration of a streaming session removes the stalls (measured: gaps
 * >100ms dropped by ~90%). See the README troubleshooting section.
 *
 * macOS re-enables awdl0 on its own (after sleep/wake or AirDrop activity),
 * so the guard re-checks periodically and keeps the sudo credential fresh to
 * avoid re-prompting for the password mid-session. On stop() the interface is
 * brought back up so AirDrop/AirPlay resume working.
 */
import { execFile, spawnSync } from "child_process"
import { promisify } from "util"
import { ask, debug, warn } from "./utils"

const execFileP = promisify(execFile)

const CHECK_INTERVAL = 15_000
const SUDO_REFRESH_INTERVAL = 4 * 60_000 // default sudo timestamp lasts 5 min

export type AwdlMode = "ask" | "off" | "keep"

export function validateAwdlMode(value: string): boolean | string {
	return value === "ask" || value === "off" || value === "keep" || `awdl must be "ask", "off" or "keep", got "${value}"`
}

/** @internal Parse `ifconfig awdl0` output. Exported for tests. */
export function parseAwdlActive(ifconfigOutput: string): boolean {
	return /status:\s*active/.test(ifconfigOutput)
}

/** Check whether the awdl0 interface is currently active. No root needed. */
export async function awdlIsActive(): Promise<boolean> {
	if (process.platform !== "darwin") return false
	try {
		const { stdout } = await execFileP("ifconfig", ["awdl0"])
		return parseAwdlActive(stdout)
	} catch {
		return false // interface missing: nothing to guard
	}
}

/** Warn before realtime commands that are sensitive to AWDL WiFi stalls. */
export async function warnIfAwdlActive(command: string): Promise<void> {
	if (!(await awdlIsActive())) return
	console.log(warn(`AWDL (AirDrop/AirPlay) is active: ${command} may show periodic WiFi micro-lag.`))
	console.log(warn('For a cleaner run use Ethernet or temporarily run "sudo ifconfig awdl0 down".'))
}

/** Run `sudo ifconfig awdl0 <up|down>`. Interactive lets sudo prompt for the password. */
function sudoAwdl(direction: "up" | "down", interactive: boolean): boolean {
	const args = interactive ? [] : ["-n"] // -n: fail instead of prompting
	const result = spawnSync("sudo", [...args, "ifconfig", "awdl0", direction], { stdio: "inherit" })
	return result.status === 0
}

/** Refresh the cached sudo credential without prompting. */
function refreshSudo(): boolean {
	return spawnSync("sudo", ["-n", "-v"], { stdio: "ignore" }).status === 0
}

export interface AwdlGuard {
	/** Restore awdl0 and clear the watchdog timers. */
	stop(): void
}

/**
 * Disable AWDL for the session, according to `mode`:
 * - "keep": do nothing.
 * - "off": disable without asking (still prompts for the sudo password).
 * - "ask": explain and ask for confirmation first; in non-interactive
 *   terminals it only prints a hint and does nothing.
 *
 * Returns a guard to stop() on shutdown, or null when nothing was disabled.
 */
export async function startAwdlGuard(mode: AwdlMode): Promise<AwdlGuard | null> {
	if (mode === "keep" || !(await awdlIsActive())) return null

	if (mode === "ask") {
		if (!process.stdin.isTTY || !process.stdout.isTTY) {
			console.log(warn("AWDL (AirDrop/AirPlay) is active: it causes periodic micro-lag when streaming over WiFi."))
			console.log(warn('Run "sudo ifconfig awdl0 down" or start the proxy with the awdl argument set to "off".'))
			return null
		}

		console.log(warn("AWDL (AirDrop/AirPlay) is active: it causes periodic micro-lag when streaming over WiFi."))
		console.log("AirDrop/AirPlay/Handoff will be unavailable until the proxy exits.")
		const answer = (await ask("Disable AWDL for this session? [Y/n] ")).trim().toLowerCase()
		if (answer !== "" && answer !== "y" && answer !== "yes") return null
	}

	if (!sudoAwdl("down", true)) {
		console.log(warn("Could not disable AWDL (sudo failed or was cancelled). Continuing with AWDL on."))
		return null
	}
	console.log("AWDL disabled for this session.")

	let warned = false
	// macOS re-enables awdl0 on its own: watch and re-disable silently.
	const watchdog = setInterval(async () => {
		if (!(await awdlIsActive())) return
		if (sudoAwdl("down", false)) {
			debug("awdl", "awdl0 came back up, disabled again")
		} else if (!warned) {
			warned = true
			console.log(warn('AWDL came back up and the sudo credential expired: run "sudo ifconfig awdl0 down" to disable it again.'))
		}
	}, CHECK_INTERVAL)
	const sudoKeepalive = setInterval(refreshSudo, SUDO_REFRESH_INTERVAL)
	watchdog.unref()
	sudoKeepalive.unref()

	return {
		stop() {
			clearInterval(watchdog)
			clearInterval(sudoKeepalive)
			if (sudoAwdl("up", false)) {
				console.log("AWDL restored.")
			} else {
				console.log(warn('Could not restore AWDL: run "sudo ifconfig awdl0 up" to re-enable AirDrop/AirPlay.'))
			}
		},
	}
}
