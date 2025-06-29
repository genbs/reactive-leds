import { LOG_LEVEL, logger } from ".."

describe("Logger", () => {
	let stream: {
		debug: jest.Mock
		info: jest.Mock
		warn: jest.Mock
		error: jest.Mock
		log: jest.Mock
	}

	// Before each test, reset the mock stream and the logger's output and level.
	beforeEach(() => {
		stream = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			log: jest.fn(),
		}
		logger.setOutputStream(stream)

		// Reset the logger level to INFO before each test to ensure a clean slate.
		logger.setLevel(LOG_LEVEL.INFO)

		logger.setOptions() // reset options to default
	})

	test("should display messages according to the set level", () => {
		logger.setOptions({
			colors: false,
			timestamp: false,
			level: false,
		})

		// Default level is INFO, so debug messages should be hidden.
		logger.debug("This is a debug message")
		expect(stream.debug).not.toHaveBeenCalled()

		// INFO, WARN, and ERROR messages should be displayed.
		logger.info("This is an info message")
		expect(stream.info).toHaveBeenCalledWith("%s", "This is an info message")

		logger.warn("This is a warning message")
		expect(stream.warn).toHaveBeenCalledWith("%s", "This is a warning message")

		logger.error("This is an error message")
		expect(stream.error).toHaveBeenCalledWith("%s", "This is an error message")

		// Verify the exact call counts for each log level.
		expect(stream.debug).toHaveBeenCalledTimes(0)
		expect(stream.info).toHaveBeenCalledTimes(1)
		expect(stream.warn).toHaveBeenCalledTimes(1)
		expect(stream.error).toHaveBeenCalledTimes(1)
	})

	test("should display all messages when the level is DEBUG", () => {
		logger.setOptions({
			colors: false,
			timestamp: false,
			level: false,
		})

		logger.setLevel(LOG_LEVEL.DEBUG)

		// All log levels should be displayed.
		logger.debug("Debug message")
		expect(stream.debug).toHaveBeenCalledWith("%s", "Debug message")

		logger.info("Info message")
		expect(stream.info).toHaveBeenCalledWith("%s", "Info message")

		logger.warn("Warn message")
		expect(stream.warn).toHaveBeenCalledWith("%s", "Warn message")

		logger.error("Error message")
		expect(stream.error).toHaveBeenCalledWith("%s", "Error message")

		// All levels should have been called once.
		expect(stream.debug).toHaveBeenCalledTimes(1)
		expect(stream.info).toHaveBeenCalledTimes(1)
		expect(stream.warn).toHaveBeenCalledTimes(1)
		expect(stream.error).toHaveBeenCalledTimes(1)
	})

	test("should hide DEBUG and INFO messages when the level is WARN", () => {
		logger.setOptions({
			colors: false,
			timestamp: false,
			level: false,
		})

		logger.setLevel(LOG_LEVEL.WARN)

		// DEBUG and INFO messages should be hidden.
		logger.debug("Debug message, should be hidden")
		expect(stream.debug).not.toHaveBeenCalled()

		logger.info("Info message, should be hidden")
		expect(stream.info).not.toHaveBeenCalled()

		// WARN and ERROR messages should be shown.
		logger.warn("Warn message, should be shown")
		expect(stream.warn).toHaveBeenCalledWith("%s", "Warn message, should be shown")

		logger.error("Error message, should be shown")
		expect(stream.error).toHaveBeenCalledWith("%s", "Error message, should be shown")

		// Verify exact call counts.
		expect(stream.debug).toHaveBeenCalledTimes(0)
		expect(stream.info).toHaveBeenCalledTimes(0)
		expect(stream.warn).toHaveBeenCalledTimes(1)
		expect(stream.error).toHaveBeenCalledTimes(1)
	})

	test("should only show ERROR messages when the level is ERROR", () => {
		logger.setOptions({
			colors: false,
			timestamp: false,
			level: false,
		})

		logger.setLevel(LOG_LEVEL.ERROR)

		// DEBUG, INFO, and WARN messages should be hidden.
		logger.debug("Debug message, should be hidden")
		expect(stream.debug).not.toHaveBeenCalled()

		logger.info("Info message, should be hidden")
		expect(stream.info).not.toHaveBeenCalled()

		logger.warn("Warn message, should be hidden")
		expect(stream.warn).not.toHaveBeenCalled()

		// Only ERROR messages should be shown.
		logger.error("Error message, should be shown")
		expect(stream.error).toHaveBeenCalledWith("%s", "Error message, should be shown")

		// Verify exact call counts.
		expect(stream.debug).toHaveBeenCalledTimes(0)
		expect(stream.info).toHaveBeenCalledTimes(0)
		expect(stream.warn).toHaveBeenCalledTimes(0)
		expect(stream.error).toHaveBeenCalledTimes(1)
	})

	test("should return the current log level", () => {
		// Initial level after beforeEach is INFO.
		expect(logger.getLevel()).toBe(LOG_LEVEL.INFO)

		// Verify level after setting it to ERROR.
		logger.setLevel(LOG_LEVEL.ERROR)
		expect(logger.getLevel()).toBe(LOG_LEVEL.ERROR)
	})

	test("should allow changing the output stream", () => {
		const customStream = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			log: jest.fn(),
		}
		logger.setOutputStream(customStream)
		// Ensure the level allows logging info.
		logger.setLevel(LOG_LEVEL.INFO)

		logger.setOptions({
			colors: false,
			timestamp: false,
			level: false,
		})

		logger.info("Message on custom stream")
		expect(customStream.info).toHaveBeenCalledWith("%s", "Message on custom stream")

		// Verify that the original stream was not called after setting a new one.
		expect(stream.info).not.toHaveBeenCalled()
	})

	test("should handle custom options", () => {
		logger.setOptions({
			colors: false,
			timestamp: false,
			level: true,
		})
		logger.setLevel(LOG_LEVEL.DEBUG)

		logger.setOutputStream(stream)

		logger.debug("Custom debug message")
		expect(stream.debug).toHaveBeenCalledWith("[DEBUG] %s", "Custom debug message")

		logger.setOptions({
			colors: {
				[LOG_LEVEL.DEBUG]: "36",
				[LOG_LEVEL.INFO]: "37",
				[LOG_LEVEL.WARN]: "33",
				[LOG_LEVEL.ERROR]: "31",
			},
			timestamp: false,
			level: true,
		})

		logger.debug("Custom debug message with options")
		expect(stream.debug).toHaveBeenCalledWith("\x1b[36m[DEBUG] %s\x1b[0m", "Custom debug message with options")
	})
})
