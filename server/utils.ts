import readline from "readline"
import { Writable } from "stream"

export function validateIP(ip: string) {
	if (!ip) return false

	const ip_parts = ip.split(".")
	if (ip_parts.length !== 4 || ip_parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) return false

	return true
}

export function validatePort(port: string): boolean {
	const portNumber = parseInt(port)
	if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
		return false
	}

	return true
}

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
