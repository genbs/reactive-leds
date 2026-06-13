import readline from "readline"
import { Writable } from "stream"

export const DEBUG = process.env.DEBUG === "1"

/** Log to console with a `[HH:MM:SS.mmm tag]` prefix, only when DEBUG=1. */
export function debug(tag: string, ...args: unknown[]) {
	if (!DEBUG) return
	const now = new Date()
	const ts = now.toTimeString().slice(0, 8) + "." + String(now.getMilliseconds()).padStart(3, "0")
	console.log(`[${ts} ${tag}]`, ...args)
}

export function validateByte(value: string): boolean {
	const byte = Number(value)
	return !isNaN(byte) && byte >= 0 && byte <= 255
}

/** Check if a string is a valid IPv4 address (four dot-separated octets 0-255). */
export function validateAddress(address: string) {
	if (!address) return false

	const parts = address.split(".")
	if (parts.length !== 4 || parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) return false

	return true
}

export function validatePort(port: string): boolean {
	const portNumber = parseInt(port)
	if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
		return false
	}

	return true
}

/**
 * Accept either an IPv4 address or a hostname (the one stored on the device,
 * matching the firmware's 32-char limit and RFC 1123 alphanumeric+hyphen rules).
 * Commands that target a device use this so the user can type either form.
 */
export function validateAddressOrHostname(value: string): boolean | string {
	if (!value) return false
	if (validateAddress(value)) return true
	// Hostname: 1–32 chars, must start with alphanumeric, then alphanumeric or hyphens.
	if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,31}$/.test(value)) return true
	return `"${value}" is not a valid IPv4 address or hostname`
}

////////////////////// ANSI helpers

// Honor the NO_COLOR convention (https://no-color.org) and skip escapes when
// stdout isn't a TTY (e.g. `rleds ping | grep online`), so pipes stay clean.
const SUPPORTS_COLOR = process.stdout.isTTY && process.env.NO_COLOR !== "1"

const wrap = (open: string, close: string) =>
	(s: string) => SUPPORTS_COLOR ? `${open}${s}${close}` : s

const RESET = "\x1b[0m"

export const green = wrap("\x1b[32m", RESET)
export const red = wrap("\x1b[31m", RESET)
export const yellow = wrap("\x1b[33m", RESET)
export const bold = wrap("\x1b[1m", "\x1b[22m")

// Semantic aliases — most call sites read better with these
export const ok = green
export const fail = red
export const warn = yellow

////////////////////// readline

/** Prompts the user with a question and returns the input. */
export function ask(query: string, hidden = false) {
	let output: NodeJS.WriteStream | Writable = process.stdout

	if (hidden) {
		process.stdout.write(query)
		query = ""

		output = new Writable({
			write(chunk, encoding, callback) {
				callback()
			},
		})
	}

	const rl = readline.createInterface({ input: process.stdin, output, terminal: hidden })
	return new Promise<string>(resolve =>
		rl.question(query, answer => {
			rl.close()
			resolve(answer)
		})
	)
}
