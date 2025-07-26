// Types

export interface Command<Args extends readonly CommandArg[] = CommandArg[]> {
	name: string
	description?: string
	args?: Args
	examples?: string[]
	execute: (...args: CommandArgsToTuple<Args>) => Promise<boolean | void> | boolean | void
}

type ArgValue<T> = T extends StringConstructor
	? string
	: T extends NumberConstructor
	? number
	: T extends BooleanConstructor
	? boolean
	: any // Fallback for other types

export interface CommandArg<T = any> {
	required: boolean
	name: string
	type?: T
	validator?: (value: any, args: string[]) => boolean | string
	default?: any
}

// This utility type converts the CommandArg array into a strongly-typed tuple for the execute function's parameters
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

// stop at first required: false
export function requiredArguments(cdm: Command): number {
	let count = 0

	if (cdm.args)
		for (let i = 0, len = cdm.args.length; i < len; i++) {
			const arg = cdm.args[i]
			if (arg.required) count++
			else return count
		}

	return count
}

// print help

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

export function shortUsage(command: Command) {
	const title = `\u001b[1m${command.name}\u001b[22m`
	const args = command.args
		? ` ${command.args
				.map(arg => `<${arg.name}${arg.default ? `(${arg.default})` : arg.required ? "" : "?"}>`)
				.join(" ")}`
		: ""
	const description = command.description ? ` ${command.description}` : ""

	return `${title}${args}${description}`
}

export function usage(command: Command) {
	const title = `\u001b[1m${command.name}\u001b[22m`
	const description = command.description || ""

	const args = (command.args || []).map(
		arg =>
			`\u001b[1m${arg.name}\u001b[22m: ${typeToString(arg.type)}, ${arg.required ? "required" : "optional"}${
				arg.default ? `, default "${arg.default}"` : ""
			}`
	)

	const examples = command.examples || []

	return `${title}${description ? `: ${description}` : ""}${
		args.length > 0 ? `\n\nArguments:\n\t${args.join("\n\t")}` : ""
	}${examples.length > 0 ? `\nExamples:\n\t${examples.join("\n\t")}` : ""}`
}

// Validation

type ValidationResult = {
	errors: Array<string>
	status: boolean
	args: Record<string, string | number | boolean>
}

export function validate(command: Command, args: string[]): ValidationResult {
	const result: ValidationResult = {
		errors: [],
		status: true,
		args: {},
	}

	if (!command.args) return result

	for (let i = 0; i < command.args.length; i++) {
		const arg = command.args[i]
		const value: number | string | boolean = args[i] || arg.default

		if (arg.required && (value === undefined || value === null)) {
			result.errors.push(`Missing required argument: ${arg.name}`)
			continue
		}

		const type = arg.type || String
		// validate by type
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
				const t = args[i].toLowerCase()
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
