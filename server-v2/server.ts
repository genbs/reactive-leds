import WebSocket from "ws"
import { logger } from "../shared/logger"
import { configToBuffer, PacketType, PacketTypeMap } from "../shared/protocol"
import proto from "./protocol"

export function serve() {
	const wss = new WebSocket.Server({ port: 8000 })

	wss.on("connection", ws => {
		logger.info("New connection established")

		ws.on("message", async (payload: Uint8Array) => {
			logger.debug("Received message", payload)

			const messageId = payload[0]
			const ip = payload[1] + "." + payload[2] + "." + payload[3] + "." + payload[4]
			const port = (payload[5] << 8) | payload[6]

			console.log(`IP: ${ip}, Port: ${port}`)

			const packetType = payload[7]
			console.log(`Packet type: ${PacketTypeMap[packetType]}`)

			switch (packetType) {
				case PacketType.PING:
					const result = await proto.ping(ip, port)
					const response = new Uint8Array(1 + 1) // responseId, status
					response[0] = messageId
					response[1] = result ? 1 : 0
					ws.send(response)
					break
				case PacketType.GET_CONFIG:
					const config = await proto.getConfig(ip, port)
					if (config) {
						const configBuffer = configToBuffer(config)
						const response = new Uint8Array(1 + 1 + configBuffer.length)
						response[0] = messageId
						response.set(configBuffer, 1)
						ws.send(response)
					} else {
						const errorResponse = new Uint8Array(2) // responseId + error status
						errorResponse[0] = messageId
						errorResponse[1] = 0
						ws.send(errorResponse)
					}
			}
		})

		ws.on("close", () => {
			logger.info("Connection closed")
		})
	})

	process.on("SIGINT", () => {
		wss.close()
		process.exit(0)
	})

	process.on("SIGTERM", () => {
		wss.close()
		process.exit(0)
	})

	console.log("Server started on ws://localhost:8000")
}
