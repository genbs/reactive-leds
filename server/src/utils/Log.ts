const LOGS = true

export function log(...args: any[]) {
	if (LOGS === true) console.log(...args)
}
