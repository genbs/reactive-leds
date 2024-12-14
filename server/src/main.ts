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
	console.log("Received request", request)
})

bridge.start()

const client1 = new ESPClient("test", "192.168.1.2", "test.local", false)
client1.port = 4200
client1.num_leds = 10
client1.id = 1
client1.online = true
client1.brightness = 255
bridge.ESPService.add(client1)

const client2 = new ESPClient("test2", "192.168.1.3", "test2.local", false)
client2.port = 4201
client2.num_leds = 10
client2.id = 2
client2.online = true
client2.brightness = 255
bridge.ESPService.add(client2)
