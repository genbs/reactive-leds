import { ESPClient } from "@services/ESPService/ESPClient"
import { logger } from "@shared"
import Bridge from "./bridge"

/////////////////

const bridge = new Bridge(8080)

logger.info("Starting bridge...")

bridge.on("espConnect", esp => {
	logger.info(`ESP Connected: ${esp})`)
	bridge.sendStripesToClients()
})

bridge.on("espDisconnect", esp => {
	logger.info(`ESP Disconnected: ${esp})`)
	bridge.sendStripesToClients()
})

bridge.on("clientConnect", ws => {
	logger.info(`Client Connected`)
	bridge.sendStripesToClients()
})

bridge.on("clientDisconnect", ws => {
	logger.info(`Client Disconnected`)
	bridge.sendStripesToClients()
})

bridge.on("clientRequest", request => {
	console.log("clientRequest", request)
})

bridge.start()

const client = new ESPClient("test", "192.168.1.2", "test", false)
client.port = 4200
client.num_leds = 10
bridge.ESPService.add(client)
