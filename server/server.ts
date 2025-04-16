import WebSocket from "ws"
import { LOG_LEVEL, logger } from "../shared/logger"
import { bufferToConfig, configToBuffer, PacketType, PacketTypeMap } from "../shared/protocol"
import proto from "./protocol"

export function serve(host = "0.0.0.0", port = 8000) {
	logger.setLevel(LOG_LEVEL.ERROR)

	const wss = new WebSocket.Server({
		port,
		host,
		perMessageDeflate: false,
	})

	wss.on("connection", ws => {
		logger.info("New connection established")

		ws.on("message", async (payload: Uint8Array) => {
			const requestId = payload[0]
			const ip = payload[1] + "." + payload[2] + "." + payload[3] + "." + payload[4]
			const port = (payload[5] << 8) | payload[6]
			const packetType = payload[7]
			const packet = payload.slice(8)

			logger.debug(`IP: ${ip}, Port: ${port}, Packet type: ${PacketTypeMap[packetType]}`)

			function statusResponse(status: 1 | true | 0 | false) {
				const response = new Uint8Array(1 + 1) // responseId, status
				response[0] = requestId
				response[1] = status ? 1 : 0
				ws.send(response)
			}

			switch (packetType) {
				case PacketType.PING: {
					const result = await proto.ping(ip, port)
					statusResponse(result)
					break
				}

				case PacketType.SET_CONFIG: {
					const config = bufferToConfig(packet)
					const result = await proto.setConfig(ip, port, config)
					statusResponse(result)
					break
				}

				case PacketType.GET_CONFIG: {
					const config = await proto.getConfig(ip, port)

					if (config) {
						const configBuffer = configToBuffer(config)
						const response = new Uint8Array(1 + 1 + configBuffer.length)
						response[0] = requestId
						response.set(configBuffer, 1)
						ws.send(response)
					} else {
						statusResponse(0)
					}
					break
				}

				case PacketType.SET_LEDS: {
					proto.setLEDs(ip, port, packet)
					break
				}

				default: {
					statusResponse(0)
					break
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

	console.log(`Server started on ws://${host}:${port}`)
}
