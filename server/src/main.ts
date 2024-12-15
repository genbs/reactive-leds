import { ESPClient } from "@services/ESPService/ESPClient"
import { EWSRequestByteType, logger } from "@shared"
import Bridge from "./bridge"

/////////////////

const bridge = new Bridge(8080)

logger.info("Starting bridge...")

bridge.on("espConnect", esp => {
	logger.info(`ESP Connected: ${esp})`)
	bridge.sendStripesToClients()

	esp.blink()
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
	//console.log("Received request", request)

	if (isArray(request)) {
		const messageType = request[0]

		switch (messageType) {
			case EWSRequestByteType.SetLEDs:
				const client = bridge.ESPService.get(request[1])
				if (client) {
					console.log("SetLeds", request.subarray(2))
					client.setLEDs(request.subarray(2)).then(resp => {
						console.log(resp)
					})
				}
				break
		}
	}
})

function isArray(value: any): value is Uint8Array {
	return value instanceof Uint8Array
}

bridge.start()

const mock = false
if (mock) {
	const client1 = new ESPClient("192.168.1.2", 4203, "test", "test.local", false)
	client1.port = 4200
	client1.num_leds = 10
	client1.id = 1
	client1.online = true
	client1.brightness = 255
	bridge.ESPService.add(client1)

	const client2 = new ESPClient("192.168.1.3", 4202, "test2", "test2.local", false)
	client2.port = 4201
	client2.num_leds = 10
	client2.id = 2
	client2.online = true
	client2.brightness = 255
	bridge.ESPService.add(client2)
}

bridge.ESPService.find("192.168.1.142", 4210)
