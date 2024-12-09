import dgram from "dgram"
import { scanUdpPorts } from "./utils"

export type MDNSClient = {
	name: string
	host: string
	address: string
	port: number
}

export const clients = new Map<Stripe["address"], Stripe>()

////////////////////////////////////////

export function onMDNSClientUp(client: MDNSClient) {
	if (client.name.includes("genbs")) {
		clients.set(client.address, new Stripe(client.name, client.host, client.address))
		console.log(`Device up: ${client.name} (${client.address}:${client.port})`)
	}
}

export function onMDNSClientDown(client: MDNSClient) {
	if (client.name.includes("genbs")) {
		if (clients.has(client.address)) {
			clients.delete(client.address)
			console.log(`Device down: ${client.name}`)
		}
	}
}

////////////////////////////////////////

export class Stripe {
	socket: dgram.Socket

	port: number
	id: number
	num_leds: number

	constructor(public name: string, public host: string, public address: string) {
		this.handshake().then(() => fireClientConnect(this))
	}

	private handshake() {
		return new Promise<void>(resolve => {
			scanUdpPorts(this.address, 4209, 4211, new Uint32Array([0]), (msg, port) => {
				if (msg.length === 5 && msg[0] === 0) {
					this.port = (msg[1] << 8) | msg[2]
					this.id = msg[3]
					this.num_leds = msg[4]

					resolve()

					return true
				}
			})
		})
	}
}

////////////////////////////////////////

const listeners = [] as ((stripe: Stripe) => void)[]

function fireClientConnect(stripe: Stripe) {
	listeners.forEach(listener => listener(stripe))
}

export function onClientConnect(callback: (stripe: Stripe) => void) {
	listeners.push(callback)
}
