import { Command, requiredArguments, shortUsage, usage, validate } from "./cmd"
import { btCredentialCommand, btScanCommand } from "./cmd/bluetooth"
import { clearCacheCommand } from "./cmd/cache"
import { colorCommand } from "./cmd/color"
import { configCommand, ledsCommand } from "./cmd/device"
import { offCommand } from "./cmd/off"
import { proxyCommand } from "./cmd/proxy"
import { rainbowCommand } from "./cmd/rainbow"
import { statusCommand } from "./cmd/status"
import { versionCommand } from "./cmd/version"
import { pingCommand, resetWifiCommand, scanCommand } from "./cmd/wifi"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("./package.json") as { version: string }

/** Create a list of commands */
const commands = [
	configCommand,
	proxyCommand,
	scanCommand,
	pingCommand,
	resetWifiCommand,
	ledsCommand,
	btScanCommand,
	btCredentialCommand,
	rainbowCommand,
	colorCommand,
	offCommand,
	versionCommand,
	statusCommand,
	clearCacheCommand,
] as Command[]

/** Check if command is provided */
if (process.argv.length < 3) {
	help()
	process.exit(0)
}

/** Global flags handled before command lookup. */
const firstArg = process.argv[2]
if (firstArg === "--version" || firstArg === "-v") {
	console.log(pkg.version)
	process.exit(0)
}
if (firstArg === "--help" || firstArg === "-h") {
	help()
	process.exit(0)
}

/** Get the command */
const commandName = firstArg
const command = commands.find(cmd => cmd.name === commandName)
if (!command) {
	const isHelp = commandName === "help"
	if (!isHelp) console.log(`Unknown command: ${commandName}`)

	help()

	process.exit(isHelp ? 0 : 1)
}

/** Check if command has correct number of arguments */
const args = process.argv.slice(3)
const rArgs = requiredArguments(command)
if (args.length < rArgs) {
	const argsList = (command.args || [])
		.slice(0, rArgs)
		.map(arg => arg.name)
		.join(", ")

	console.error(`Missing required arguments: ${argsList}`)
	help(commandName)

	process.exit(1)
}

/** Validate arguments */
const validationResult = validate(command, args)
if (!validationResult.status) {
	console.error(`Invalid arguments:\n\t${validationResult.errors.join("\n\t")}`)
	help(commandName)

	process.exit(1)
}

/** Execute the command */
executeCommand(command, Object.values(validationResult.args)).catch(err => {
	console.error(`Command error:`, err)
	process.exit(1)
})

// Functions

function help(commandName?: string) {
	const command = commandName ? commands.find(cmd => cmd.name === commandName) : null
	console.log(command ? usage(command) : `Usage:\n\t- ${commands.map(shortUsage).join("\n\t- ")}`)
}

async function executeCommand(command: Command, args: any[]) {
	const result = await command.execute(...args)
	if (result === false) {
		console.error(`Failed to execute command ${command.name}`)
	}

	process.exit(result === false ? 1 : 0)
}
