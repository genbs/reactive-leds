import { Command, validate } from "../cmd"
import { benchmarkCommand } from "../cmd/benchmark"
import { configCommand } from "../cmd/device"
import { proxyCommand } from "../cmd/proxy"

describe("command", () => {
	test("validate simple arg", () => {
		const cmd: Command = {
			name: "validate",
			description: "validate input",
			args: [
				{
					required: true,
					name: "input",
					type: String,
				},
			],
			execute: () => {},
		}

		const validationResult = validate(cmd, ["test input"])
		expect(validationResult.status).toBe(true)
		expect(validationResult.args).toEqual({
			input: "test input",
		})
	})

	test("validate with default value", () => {
		const cmd: Command = {
			name: "validate",
			description: "validate input with default",
			args: [
				{
					required: false,
					name: "input",
					default: "test",
				},
				{
					required: false,
					name: "input2",
					default: 42,
				},
			],
			execute: () => {},
		}

		const validationResult = validate(cmd, [])
		expect(validationResult.status).toBe(true)
		expect(validationResult.args).toEqual({
			input: "test",
			input2: 42,
		})
	})

	test("validate multiple args", () => {
		const cmd: Command = {
			name: "validate",
			description: "validate multiple inputs",
			args: [
				{
					required: true,
					name: "input1",
					type: String,
				},
				{
					required: false,
					name: "input2",
					type: Number,
				},
			],
			execute: () => {},
		}

		const validationResult = validate(cmd, ["test input", "42"])
		expect(validationResult.status).toBe(true)
		expect(validationResult.args).toEqual({
			input1: "test input",
			input2: 42,
		})
	})

	test("validate error", () => {
		const cmd: Command = {
			name: "validate",
			description: "validate input",
			args: [
				{
					required: true,
					name: "input",
					type: String,
				},
			],
			execute: () => {},
		}

		const validationResult = validate(cmd, [])
		expect(validationResult.status).toBe(false)
		expect(validationResult.errors).toEqual(["Missing required argument: input"])

		const cmd2: Command = {
			name: "validate",
			description: "validate input",
			args: [
				{
					required: true,
					name: "input",
					type: String,
				},
				{
					required: false,
					name: "input2",
					type: Number,
				},
				{
					required: false,
					name: "input3",
					type: Number,
				},
			],
			execute: () => {},
		}

		const validationResult2 = validate(cmd2, ["test", "test", "test"])
		expect(validationResult2.status).toBe(false)
		expect(validationResult2.errors).toEqual([
			'"test" is not a valid number for argument input2',
			'"test" is not a valid number for argument input3',
		])
	})

	test("validate custom validator", () => {
		const cmd: Command = {
			name: "validate",
			description: "validate input",
			args: [
				{
					required: true,
					name: "input",
					type: String,
					validator: value => value === "valid",
				},
			],
			execute: () => {},
		}

		const validationResult = validate(cmd, ["invalid"])
		expect(validationResult.status).toBe(false)
		expect(validationResult.errors).toEqual(['"invalid" is not a valid value for argument input'])
	})

	test("config command validates device config ranges", () => {
		expect(validate(configCommand, ["192.168.1.10", "pin", "18"]).status).toBe(true)
		expect(validate(configCommand, ["192.168.1.10:4211", "pin", "18"]).status).toBe(true)
		expect(validate(configCommand, ["192.168.1.10", "pin", "50"]).status).toBe(false)
		expect(validate(configCommand, ["192.168.1.10", "pin", "1.5"]).status).toBe(false)

		expect(validate(configCommand, ["192.168.1.10", "num_leds", "16"]).status).toBe(true)
		expect(validate(configCommand, ["192.168.1.10", "num_leds", "0"]).status).toBe(false)
		expect(validate(configCommand, ["192.168.1.10", "num_leds", "256"]).status).toBe(false)

		expect(validate(configCommand, ["192.168.1.10", "port", "4210"]).status).toBe(true)
		expect(validate(configCommand, ["192.168.1.10", "port", "1023"]).status).toBe(false)
		expect(validate(configCommand, ["192.168.1.10", "port", "1.5"]).status).toBe(false)
	})

	test("proxy command separates bind port and device port validation", () => {
		expect(validate(proxyCommand, ["0.0.0.0", "0", "4210"]).status).toBe(true)
		expect(validate(proxyCommand, ["0.0.0.0", "8000", "1023"]).status).toBe(false)
	})

	test("benchmark command requires a single explicit target", () => {
		// single-device by design: benchmarking several devices at once
		// conflates per-link quality, host batching and AP contention
		expect(validate(benchmarkCommand, ["192.168.1.10"]).status).toBe(true)
		expect(validate(benchmarkCommand, ["192.168.1.10:4211", "60", "30"]).status).toBe(true)
		expect(validate(benchmarkCommand, ["192.168.1.10", "60", "30", "json"]).status).toBe(true)
		expect(validate(benchmarkCommand, []).status).toBe(false)
		expect(validate(benchmarkCommand, ["all", "90", "30"]).status).toBe(false)
		expect(validate(benchmarkCommand, ["90", "30"]).status).toBe(false)
		expect(validate(benchmarkCommand, ["192.168.1.10", "0", "30"]).status).toBe(false)
		expect(validate(benchmarkCommand, ["192.168.1.10", "60", "0"]).status).toBe(false)
		expect(validate(benchmarkCommand, ["192.168.1.10", "60", "30", "csv"]).status).toBe(false)
	})
})
