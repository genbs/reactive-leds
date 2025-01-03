const dns = require("dns")
import { EventEmitter, TNetClient } from "@shared"
const { exec } = require("child_process")
const fs = require("fs")

const MACADDRESS_IO_API_KEY = "at_BnaVSsK1FBgFk59M7RfRr8WC31Wnk"

export type NetServiceEvents = {
	clients: (clients: TNetClient[]) => void
}

export default class NetService extends EventEmitter<NetServiceEvents> {
	private clients = new Map<string, TNetClient>()

	constructor() {
		super()
	}

	start() {
		setInterval(() => this.find(), 5000)
	}

	getClients(): TNetClient[] {
		return [...this.clients.values()]
	}

	private getARPTable(): Promise<{ ip: string; mac: string; type: string }[]> {
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
							if (parts[3] === "(incomplete)" || parts[3] === "ff:ff:ff:ff:ff:ff") return null

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

	private async getMACVendor(mac: string) {
		if (!fs.existsSync("vendors.json")) fs.writeFileSync("vendors.json", "{}")
		const vendors = JSON.parse(fs.readFileSync("vendors.json", "utf-8"))
		if (mac in vendors) {
			return vendors[mac]
		}

		let vendor = "Unknown Vendor"
		try {
			const response = await fetch(
				`https://api.macaddress.io/v1?apiKey=${MACADDRESS_IO_API_KEY}&output=vendor&search=${mac}`
			)

			vendor = (await response.text()).trim() || vendor
			vendors[mac] = vendor
			fs.writeFileSync("vendors.json", JSON.stringify(vendors, null, 2))
		} catch (error) {}

		return vendor
	}

	private async getHostnames(ip: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			dns.reverse(ip, (err, hostnames) => {
				resolve(err ? null : hostnames[0])
			})
		})
	}

	private async find() {
		const devices = await this.getARPTable()
		const clients: TNetClient[] = []

		for (const device of devices) {
			const vendor = await this.getMACVendor(device.mac)
			const hostname = await this.getHostnames(device.ip)

			clients.push({ vendor, ip: device.ip, mac: device.mac, hostname })
		}

		let changes = false
		const oldClients = [...this.clients.values()]

		if (oldClients.length !== clients.length) {
			changes = true
		} else {
			for (const client of clients) {
				const oldClient = oldClients.find(c => c.mac === client.mac)
				if (!oldClient) {
					changes = true
					break
				}

				if (oldClient.vendor !== client.vendor || oldClient.hostname !== client.hostname) {
					changes = true
					break
				}
			}
		}

		if (changes) {
			this.clients = new Map(clients.map(client => [client.mac, client]))
			this.emit("clients", [...this.clients.values()])
		}
	}

	on<K extends keyof NetServiceEvents>(event: K, listener: NetServiceEvents[K]): () => void {
		if (event === "clients") listener([...this.clients.values()])

		return super.on(event, listener)
	}
}
