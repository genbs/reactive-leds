/**
 * Command definition and validation for the CLI.
 *
 * Each command is represented by a Command object with typed arguments
 * and automatic validation via the `validate()` function.
 */

import { bold } from "./utils"

export interface Command<Args extends readonly CommandArg[] = CommandArg[]> {
	name: string
	description?: string
	args?: Args
	examples?: string[]
	execute: (...args: CommandArgsToTuple<Args>) => Promise<boolean | void> | boolean | void
}

interface CommandArg<T = any> {
	required: boolean
	name: string
	flag?: string
	type?: T
	validator?: (value: any, args: string[]) => boolean | string
	default?: any
}

/** Utility type to map a constructor type to its corresponding value type */
type ArgValue<T> = T extends StringConstructor
	? string
	: T extends NumberConstructor
	? number
	: T extends BooleanConstructor
	? boolean
	: any // Fallback for other types

/** This utility type converts the CommandArg array into a strongly-typed tuple for the execute function's parameters */
type CommandArgsToTuple<Args extends readonly CommandArg[]> = {
	[K in keyof Args]: Args[K] extends CommandArg<infer T>
	? Args[K]["required"] extends true
	? ArgValue<T> // Required args are always present
	: // For optional args, check if a default value exists
	"default" extends keyof Args[K]
	? ArgValue<T> // If default exists, it will never be undefined
	: ArgValue<T> | undefined // If no default, it can be undefined
	: never
}

/** Returns the number of required arguments for a command. */
export function requiredArguments(cmd: Command): number {
	let count = 0

	if (cmd.args)
		for (let i = 0; i < cmd.args.length; i++) {
			const arg = cmd.args[i]
			if (arg.flag) continue
			if (arg.required) count++
			else return count
		}

	return count
}

////////////////////// Help printing

function typeToString(type?: StringConstructor | NumberConstructor | BooleanConstructor): string {
	if (!type) return "string"

	switch (type) {
		case String:
			return "string"
		case Number:
			return "number"
		case Boolean:
			return "boolean"
		default:
			return "unknown"
	}
}

/** Returns a short usage string for a command. */
export function shortUsage(command: Command) {
	const title = bold(command.name)
	const args = command.args
		? ` ${command.args
			.map(arg => arg.flag
				? arg.type === Boolean ? `[${arg.flag}]` : `[${arg.flag} <${arg.name}>]`
				: `<${arg.name}${arg.default !== undefined ? `(${arg.default})` : arg.required ? "" : "?"}>`)
			.join(" ")}`
		: ""
	const description = command.description ? ` ${command.description}` : ""

	return `${title}${args}${description}`
}

/** Returns a detailed usage string for a command. */
export function usage(command: Command) {
	const title = bold(command.name)
	const description = command.description || ""

	const args = (command.args || []).map(
		arg =>
			`${bold(arg.flag || arg.name)}: ${typeToString(arg.type)}, ${arg.required ? "required" : "optional"}${arg.default !== undefined ? `, default "${arg.default}"` : ""
			}`
	)

	const examples = command.examples || []

	return `${title}${description ? `: ${description}` : ""}${args.length > 0 ? `\n\nArguments:\n\t${args.join("\n\t")}` : ""
		}${examples.length > 0 ? `\nExamples:\n\t${examples.join("\n\t")}` : ""}`
}

////////////////////// Validation

type ValidationResult = {
	errors: Array<string>
	status: boolean
	args: Record<string, string | number | boolean | undefined>
}

/**
 * Validates the arguments for a command according to its arg definitions,
 * running type coercion and custom validators. Returns the validated values
 * keyed by argument name and a list of errors (empty on success).
 */
export function validate(command: Command, args: string[]): ValidationResult {
	const result: ValidationResult = {
		errors: [],
		status: true,
		args: {},
	}

	if (!command.args) return result

	const flagArgs = new Map(command.args.filter(arg => arg.flag).map(arg => [arg.flag!, arg]))
	const positional: string[] = []
	for (let i = 0; i < args.length; i++) {
		const value = args[i]
		if (!value.startsWith("--")) {
			positional.push(value)
			continue
		}
		const flagArg = flagArgs.get(value)
		if (!flagArg) result.errors.push(`Unknown option: ${value}`)
		else if (flagArg.type !== Boolean) i++
	}

	let positionalIndex = 0
	for (let i = 0; i < command.args.length; i++) {
		const arg = command.args[i]
		let rawValue: number | string | boolean | undefined
		if (arg.flag) {
			const flagIndex = args.indexOf(arg.flag)
			rawValue = flagIndex === -1 ? arg.default : arg.type === Boolean ? true : args[flagIndex + 1]
			if (flagIndex !== -1 && arg.type !== Boolean && (rawValue === undefined || String(rawValue).startsWith("--"))) {
				result.errors.push(`Missing value for option: ${arg.flag}`)
				rawValue = undefined
			}
		} else {
			rawValue = positional[positionalIndex++] ?? arg.default
		}
		const value = rawValue

		if ((value === undefined || value === null)) {
			if (arg.required) {
				result.errors.push(`Missing required argument: ${arg.name}`)
				continue
			}

			result.args[arg.name] = value
			continue
		}

		const type = arg.type || String
		switch (true) {
			case type === String:
				result.args[arg.name] = value
				break
			case type === Number:
				const parsed = Number(value)
				if (!isNaN(parsed)) {
					result.args[arg.name] = parsed
				} else {
					result.errors.push(`"${value}" is not a valid number for argument ${arg.name}`)
				}
				break
			case type === Boolean:
				const t = String(value).toLowerCase()
				if (t === "true" || t === "1") {
					result.args[arg.name] = true
				} else if (t === "false" || t === "0") {
					result.args[arg.name] = false
				} else {
					result.errors.push(`"${args[i]}" is not a valid boolean for argument ${arg.name}`)
				}
				break
		}

		const parsed = result.args[arg.name]
		if (parsed !== undefined && parsed !== null) {
			if (arg.validator) {
				const validationResult = arg.validator(parsed as any, args)
				if (validationResult !== true) {
					const validationResultMessage =
						typeof validationResult === "string"
							? validationResult
							: `"${parsed}" is not a valid value for argument ${arg.name}`

					result.errors.push(validationResultMessage)
					continue
				} else {
					result.args[arg.name] = parsed
				}
			}
		}
	}

	result.status = result.errors.length === 0

	return result
}
