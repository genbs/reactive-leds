const dns = require("dns")
import { EventEmitter, TNetClient } from "@shared"
const { exec } = require("child_process")
const fs = require("fs")

const MACADDRESS_IO_API_KEY = "at_BnaVSsK1FBgFk59M7RfRr8WC31Wnk"

export type NetServiceEvents = {
	clients: (clients: TNetClient[]) => void
}

export default class NetService extends EventEmitter<NetServiceEvents> {
	private clients: TNetClient[] = []

	constructor() {
		super()
	}

	start() {
		this.find()

		setInterval(() => this.find(), 5000)
	}

	getClients(): TNetClient[] {
		return this.clients
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

	private async getHostname(ip: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			dns.reverse(ip, (err, hostnames) => {
				resolve(err ? null : hostnames[0])
			})
		})
	}

	private async find() {
		const devices = await this.getARPTable()
		let clients: TNetClient[] = []

		for (const device of devices) {
			const vendor = await this.getMACVendor(device.mac)
			const hostname = await this.getHostname(device.ip)

			clients.push({ vendor, address: device.ip, mac: device.mac, hostname })
		}

		clients = clients.sort(ipSort)
		const oldClients = this.clients.sort(ipSort)

		if (JSON.stringify(oldClients) !== JSON.stringify(clients)) {
			this.clients = clients
			this.emit("clients", this.clients)
		}
	}

	on<K extends keyof NetServiceEvents>(event: K, listener: NetServiceEvents[K]): () => void {
		if (event === "clients") listener(this.clients)

		return super.on(event, listener)
	}
}

function ipSort(a: TNetClient, b: TNetClient) {
	const aParts = a.address.split(".")
	const bParts = b.address.split(".")

	for (let i = 0; i < 4; i++) {
		if (parseInt(aParts[i]) < parseInt(bParts[i])) return -1
		if (parseInt(aParts[i]) > parseInt(bParts[i])) return 1
	}

	return 0
}
