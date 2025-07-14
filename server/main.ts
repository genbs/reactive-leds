import { LOG_LEVEL, logger } from "@leds/shared"
import { Command, requiredArguments, shortUsage, usage, validate } from "cmd"
import { btCredentialCommand, btScanCommand } from "cmd/bluetooth"
import serveCommand from "cmd/server"
import { pingCommand, scanCommand } from "cmd/wifi"
import { configCommand, ledsCommand } from "./cmd/device"

logger.level = LOG_LEVEL.ERROR

// create a list of commands
const commands = [
	configCommand,
	serveCommand,
	scanCommand,
	pingCommand,
	ledsCommand,
	btScanCommand,
	btCredentialCommand,
]

// check if command is provided
if (process.argv.length < 3) {
	help()
	process.exit(0)
}

// find the command
const commandName = process.argv[2]
const command = commands.find(cmd => cmd.name === commandName)
if (!command) {
	if (commandName !== "help") logger.log(`Unknown command: ${commandName}`)

	help()

	process.exit(0)
}

// check if command has correct number of arguments
const args = process.argv.slice(3)
const rArgs = requiredArguments(command)
if (args.length < rArgs) {
	const argsList = (command.args || [])
		.slice(0, rArgs)
		.map(arg => arg.name)
		.join(", ")

	logger.error(`Missing required arguments: ${argsList}`)
	help(commandName)

	process.exit(0)
}

// validate arguments
const validationResult = validate(command, args)
if (!validationResult.status) {
	logger.error(`Invalid arguments:\n\t${validationResult.errors.join("\n\t")}`)
	help(commandName)

	process.exit(0)
}

// now we can execute the command
executeCommand(command, Object.values(validationResult.args))

// Functions

function help(commandName?: string) {
	const command = commandName ? commands.find(cmd => cmd.name === commandName) : null
	logger.log(command ? usage(command) : `Usage:\n\t- ${commands.map(shortUsage).join("\n\t- ")}`)
}

async function executeCommand(command: Command, args: any[]) {
	const result = await command.execute(...args)
	if (result) {
		logger.log(`Command ${command.name} executed succesfully`)
		//process.exit(0)
	} else {
		logger.error(`Failed to execute command ${command.name}`)
		//process.exit(1)
	}

	process.exit(0)
}
