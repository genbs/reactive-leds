import netFinder from "./netfinder"
import { onClientConnect, onMDNSClientDown, onMDNSClientUp } from "./stripeClient"
import udpServer from "./udpServer"
import websocketServer from "./websocketServer"

/////////////////

function main() {
	netFinder.start(onMDNSClientUp, onMDNSClientDown)

	udpServer.start(4210, (msg, stripe) => {
		console.log(`UDP message from ${stripe.host}: ${msg}`)
		// aggiorna il client
	})

	websocketServer.start(8080, (message: Uint8Array) => {
		const stripe_id = message[0]
		const data = message.slice(1)
	})

	onClientConnect(stripe => {
		console.log("HANDSHAKE OK", stripe)
	})

	// const udpServer = dgram.createSocket("udp4")
	// const wsServer = new WebSocket.Server({ port: 8080 })

	// // Mappa per conservare connessioni WebSocket
	// const wsClients = new Set()

	// udpServer.on("message", (msg, rinfo) => {
	// 	console.log(`UDP message from ${rinfo.address}:${rinfo.port}: ${msg}`)
	// 	// Invia il messaggio ai client WebSocket
	// 	wsClients.forEach(client => {
	// 		// if (client.readyState === WebSocket.OPEN) {
	// 		// 	client.send(msg)
	// 		// }
	// 	})
	// })

	// wsServer.on("connection", ws => {
	// 	wsClients.add(ws)
	// 	ws.on("close", () => wsClients.delete(ws))
	// 	ws.on("message", message => {
	// 		const stripe_index = message[0]
	// 		const data = message.slice(1)

	// 		//udpServer.send(data, 4210, espClientsIP[stripe_index])
	// 	})
	// })

	// udpServer.bind(4210)
	// console.log("UDP Server listening on port 4210")
}

main()
