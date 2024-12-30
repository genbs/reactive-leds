enum LOG_LEVEL {
	DEBUG,
	INFO,
	WARN,
	ERROR,
}

const logLevel = LOG_LEVEL.DEBUG

const logger = {
	debug: (...args: any[]) => {
		if (logLevel <= LOG_LEVEL.DEBUG) {
			console.debug("\x1b[36m%s\x1b[0m", ...args)
		}
	},

	info: (...args: any[]) => {
		if (logLevel <= LOG_LEVEL.INFO) {
			console.log("\x1b[37m%s\x1b[0m", ...args)
		}
	},

	warn: (...args: any[]) => {
		if (logLevel <= LOG_LEVEL.WARN) {
			console.warn("\x1b[33m%s\x1b[0m", ...args)
		}
	},

	error: (...args: any[]) => {
		if (logLevel <= LOG_LEVEL.ERROR) {
			console.error("\x1b[31m%s\x1b[0m", ...args)
		}
	},
}

export { logger }
