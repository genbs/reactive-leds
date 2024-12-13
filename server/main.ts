import ESPController from "./espclient/ESPController"
import { log } from "./log"

/////////////////

function main() {
	const ec = new ESPController()

	ec.on("espConnect", esp => {
		log(`\nESP client connected:
			\r\tName:    ${esp.name}
			\r\tAddress: ${esp.address}
			\r\tHost:    ${esp.host}
			\r\tHostname:    ${esp.config.hostname}
			\r\tPort:    ${esp.config.port}
			\r\tID:      ${esp.config.id}
			`)
	})

	ec.on("espDisconnect", esp => {
		log(`ESP disconnected: ${esp.name}`)
	})

	// ec.find("192.168.0.4", 4210).then(esp => {
	// 	console.log("FINDED", esp)
	// })

	ec.start()

	// websocketServer.start(8080)

	// onClientConnect(stripe => {
	// 	console.log("HANDSHAKE OK", stripe)
	// })

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
