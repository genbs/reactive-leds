import { exec } from "child_process"
import readline from "readline"
import { Writable } from "stream"
import { get_bluetooth_devices, send_bluetooth_credentials } from "./bluetooth"
import proto from "./protocol"
import { serve } from "./server"

function help() {
	console.log(`Usage: 
        \r\t- serve <port>          		// Start server on port, default 8080
        \r\t- scan                  		// Scan devices on network
        \r\t- bt-scan               		// Scan devices on bluetooth
        \r\t- bt-credential <host> <ssid>	// Send credentials to bluetooth device
        \r\t- ping <ip> <udp_port>  		// Ping IP, default 4210
        \r\t- config <ip> <udp_port>					// Ping IP, default 4210
        \r\t- config <ip> <udp_port> <key> <value>		// Ping IP, default 4210
    `)

	process.exit(1)
}

if (process.argv.length < 3) {
	help()
}

const command = process.argv[2]

function validateIP(ip: string) {
	if (!ip) {
		throw new Error("Invalid IP")
	}

	const ip_parts = ip.split(".")
	if (ip_parts.length !== 4 || ip_parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) {
		throw new Error("Invalid IP")
	}

	return ip
}

async function main() {
	switch (command) {
		case "serve": {
			serve()
			break
		}
		case "config": {
			const ip = validateIP(process.argv[3])
			const port = parseInt(process.argv[4] || "4210")

			// set mode
			if (process.argv.length === 7) {
				const key = process.argv[5]
				const value = process.argv[6]

				if (key !== "hostname" && key !== "pin" && key !== "num_leds" && key !== "port" && key !== "brightness") {
					console.error("Invalid key")
					process.exit(1)
				}
				const currentConfig = await proto.getConfig(ip, port)
				if (!currentConfig) {
					console.error("Failed to get config")
					process.exit(1)
				}
				const response = await proto.setConfig(ip, port, { ...currentConfig, [key]: value })
				console.log(response ? "Config updated" : "Failed to update config")
				process.exit(0)
			} else {
				const config = await proto.getConfig(ip, port)
				if (!config) {
					console.error("Failed to get config")
				} else
					console.log(`Config: 
						\r\t- pin: ${config.pin}
						\r\t- Num LEDs: ${config.num_leds}
						\r\t- Brightness: ${config.brightness}
						\r\t- Port: ${config.port}
						\r\t- Hostname: ${config.hostname}
					`)
			}
			process.exit(0)
		}
		case "ping": {
			const ip = validateIP(process.argv[3])
			const port = parseInt(process.argv[4] || "4210")

			const pingResult = await proto.ping(ip, port)
			console.log(pingResult ? "Device is online" : "Device is offline")
			process.exit(0)
		}

		case "scan": {
			const result = await scan()
			if (result.length === 0) {
				console.log("No devices found")
			} else {
				console.log("Devices: ")
				result.forEach((d, i) => console.log(`${i + 1}) ${d.ip} (${d.mac}) - ${d.type}`))
			}

			process.exit(0)
		}
		case "bt-scan": {
			const devices = await get_bluetooth_devices()
			if (devices.length === 0) {
				console.log("No devices found")
			} else {
				console.log("Devices: ")
				console.log(devices)
				devices.forEach((d, i) => console.log(`${i + 1}) ${d.advertisement.localName || d.address || d.uuid}`))
			}

			process.exit(0)
		}
		case "bt-credential": {
			const devices = await get_bluetooth_devices()
			if (devices.length === 0) {
				console.error("No devices found")
				process.exit(1)
			}

			let host = process.argv[3]
			if (!host) {
				console.log("Devices:")
				devices.forEach((d, i) => console.log(`${i + 1}) ${d.advertisement.localName || d.address || d.uuid}`))
				host = await ask("Insert host: ")

				// check if input host is number
				if (!isNaN(Number(host))) {
					const index = Number(host) - 1
					if (index < 0 || index >= devices.length) {
						console.error("Device not found")
						process.exit(1)
					}
					host = devices[index].advertisement.localName || devices[index].address
				}
			}

			let device = devices.find(d => d.advertisement.localName === host || d.address === host)
			if (!device) {
				console.error("Device not found")
				process.exit(1)
			}

			let ssid = process.argv[4]
			if (!ssid) ssid = await ask("Insert SSID: ")
			let password = await ask("Insert password: ", true)

			if (!ssid || !password) {
				console.error("Invalid credentials")
				process.exit(1)
			}

			await send_bluetooth_credentials(device, ssid, password)

			process.exit(0)
		}
		default:
			help()
	}
}

function ask(query: string, hidden = false) {
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

function scan(): Promise<{ ip: string; mac: string; type: string }[]> {
	return new Promise((resolve, reject) => {
		exec("arp -a", (error, stdout, stderr) => {
			if (error || stderr) {
				resolve([])
			}
			const devices = stdout
				.split("\n")
				.map(line => {
					const parts = line.split(/\s+/)
					if (parts.length >= 4) {
						if (parts[3] === "(incomplete)" || parts[3] === "ff:ff:ff:ff:ff:ff") {
							return null
						}

						return {
							ip: parts[1].replace(/[()]/g, ""), // Rimuove le parentesi dall'indirizzo IP
							mac: parts[3]
								.split(":")
								.map(part => parseInt(part, 16).toString(16).padStart(2, "0").toUpperCase())
								.join(":"),
							type: parts[4] || "Unknown",
						}
					}
				})
				.filter(Boolean)

			resolve(devices)
		})
	})
}

main()
