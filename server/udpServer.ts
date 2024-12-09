import dgram from "dgram"
import { clients, Stripe } from "./stripeClient"

function start(port: number, onMessage: (msg: Buffer, client: Stripe) => void) {
	const udpServer = dgram.createSocket("udp4")

	udpServer.on("message", (msg, rinfo) => {
		if (clients.has(rinfo.address)) {
			const client = clients.get(rinfo.address)!
			onMessage(msg, client)
		}
	})

	udpServer.bind(port)

	console.log(`UDP Server listening on port ${port}`)
}

export default {
	start,
}
