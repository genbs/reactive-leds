import { bufferToConfig, configToBuffer, logger, PacketType, PacketTypeMap } from "@leds/shared"
import { Command } from "cmd"
import { validateIP, validatePort } from "utils"
import WebSocket from "ws"
import proto from "../protocol"

const serveCommand: Command = {
	name: "serve",
	description:
		"Start the WebSocket server.\nThis service will act as a proxy between the client and the firmware, routing packets between the two.",
	args: [
		{ required: false, name: "host", type: String, default: "0.0.0.0", validator: validateIP },
		{ required: false, name: "port", type: Number, default: 8000, validator: validatePort },
	],
	execute: async (host, port) => serve(host as string, port as number),
}

const STATUS_RESPONSE_SUCCESS = new Uint8Array([0, 1])
const STATUS_RESPONSE_FAILURE = new Uint8Array([0, 0])

/**
 * Start the WebSocket server.
 * Proxy between the client and the firmware.
 * Ping, SetConfig, GetConfig has synchronous responses, SetLEDs is asynchronous.
 */
export function serve(host = "0.0.0.0", port = 8000) {
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
			const packetType = payload[7] as PacketType
			const packet = payload.slice(8)

			logger.debug(`IP: ${ip}, Port: ${port}, Packet type: ${PacketTypeMap[packetType]}`)

			function statusResponse(status: 1 | true | 0 | false) {
				const response = status ? STATUS_RESPONSE_SUCCESS : STATUS_RESPONSE_FAILURE
				response[0] = requestId
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
					// no response
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

	// graceful shutdown
	function shutdown() {
		logger.info("Shutting down WebSocket server...")

		wss.close(() => {
			logger.info("WebSocket server closed")
			process.exit(0)
		})
	}

	process.on("SIGINT", shutdown)
	process.on("SIGTERM", shutdown)

	logger.info(`Server started on ws://${host}:${port}`)
}

export default serveCommand
