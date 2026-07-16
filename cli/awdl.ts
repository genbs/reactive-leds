import { execFile } from "child_process"
import { promisify } from "util"
import { warn } from "./utils"

const execFileP = promisify(execFile)

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

/**
 * Warn when AWDL is active. No root needed and no interface changes are made.
 */
export async function warnIfAwdlActive(context: string): Promise<void> {
	if (!(await awdlIsActive())) return
	for (const line of awdlWarningLines(context)) console.log(line)
}

export function awdlWarningLines(context: string): string[] {
	return [
		warn(`AWDL (AirDrop/AirPlay) is active: it causes periodic micro-lag when streaming over WiFi.`),
		warn(`If you see stutter in ${context}, use Ethernet, turn off AirDrop/AirPlay/Handoff, or run: sudo ifconfig awdl0 down.`),
	]
}
