import ESPService from "@services/ESPService"
import WebSocketService from "./services/WebSocketService"
import { log } from "./utils/Log"

/////////////////

const ec = new ESPService()
ec.on("espConnect", esp => {
	log(`ESP connected:\n${esp}`)

	sendClients()
})

ec.on("espDisconnect", esp => {
	log(`ESP disconnected:\n${esp}`)

	sendClients()
})

const wsServer = new WebSocketService(8080)

wsServer.on("onClientConnect", ws => {
	sendClients()
})

wsServer.on("onMessage", (message, ws) => {
	log(`Message from client`)

	const jsonmsg = JSON.parse(message.toString())
	console.log("jsonmsg", jsonmsg.event)
	if ("event" in jsonmsg && jsonmsg.event === "set-color") {
		ec.clients.forEach(esp => {
			esp.setLEDs(jsonmsg.data)
		})
	}
})

ec.start()
wsServer.start()

function sendClients() {
	wsServer.send(
		JSON.stringify({
			event: "devices",
			data: [...ec.clients.values()].map(esp => ({
				id: esp.config.id,
				name: esp.name,
				address: esp.address,
				hostname: esp.config.hostname,
				num_leds: esp.config.num_leds,
			})),
		})
	)
}
