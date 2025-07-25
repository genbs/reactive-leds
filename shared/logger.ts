export enum LOG_LEVEL {
	DEBUG,
	INFO,
	WARN,
	ERROR,
}

interface OutputStream {
	log: (...args: any[]) => void
	debug: (...args: any[]) => void
	info: (...args: any[]) => void
	warn: (...args: any[]) => void
	error: (...args: any[]) => void
}

const getTimestamp = () => new Date().toISOString()

interface LoggerOptions {
	colors?:
		| false
		| string
		| {
				[key in LOG_LEVEL]: string
		  }
	timestamp?: boolean
	level?: boolean
}

const defaultOptions: LoggerOptions = {
	colors: {
		[LOG_LEVEL.DEBUG]: "36", // cyan
		[LOG_LEVEL.INFO]: "37", // white
		[LOG_LEVEL.WARN]: "33", // yellow
		[LOG_LEVEL.ERROR]: "31", // red
	},
	timestamp: true,
	level: true,
}

function createMessage(level: LOG_LEVEL, options: LoggerOptions) {
	options = { ...defaultOptions, ...options }

	const colors =
		typeof options.colors === "string"
			? {
					[LOG_LEVEL.DEBUG]: options.colors,
					[LOG_LEVEL.INFO]: options.colors,
					[LOG_LEVEL.WARN]: options.colors,
					[LOG_LEVEL.ERROR]: options.colors,
			  }
			: options.colors
	const timestamp = options.timestamp ? `[${getTimestamp()}] ` : ""
	const levelStr = options.level ? `[${LOG_LEVEL[level]}] ` : ""

	return colors ? `\x1b[${colors[level]}m${timestamp}${levelStr}%s\x1b[0m` : `${timestamp}${levelStr}%s`
}

export interface Logger {
	options: LoggerOptions
	level: LOG_LEVEL
	outputStream: OutputStream

	debug: (...args: any[]) => void
	info: (...args: any[]) => void
	warn: (...args: any[]) => void
	error: (...args: any[]) => void
	log: (...args: any[]) => void
}

const logger: Logger = {
	options: defaultOptions,
	level: LOG_LEVEL.INFO,
	outputStream: console as OutputStream,

	debug: (...args: any[]) => {
		if (logger.level <= LOG_LEVEL.DEBUG) {
			logger.outputStream.log(createMessage(LOG_LEVEL.DEBUG, logger.options), ...args)
		}
	},

	info: (...args: any[]) => {
		if (logger.level <= LOG_LEVEL.INFO) {
			logger.outputStream.log(createMessage(LOG_LEVEL.INFO, logger.options), ...args)
		}
	},

	warn: (...args: any[]) => {
		if (logger.level <= LOG_LEVEL.WARN) {
			logger.outputStream.log(createMessage(LOG_LEVEL.WARN, logger.options), ...args)
		}
	},

	error: (...args: any[]) => {
		if (logger.level <= LOG_LEVEL.ERROR) {
			logger.outputStream.log(createMessage(LOG_LEVEL.ERROR, logger.options), ...args)
		}
	},

	log: (...args: any[]) => {
		logger.outputStream.log(createMessage(LOG_LEVEL.INFO, logger.options), ...args)
	},
}

export { logger }
