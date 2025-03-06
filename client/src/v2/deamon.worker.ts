import { LOG_LEVEL, logger } from "@shared"
import { WorkerRequestType, WorkerRequestTypeMap } from "./comm"
import WS from "./ws"

// single instance to communicate with the server
const ws: WS = new WS({
	autoConnect: false,
	shouldReconnect: true,
	onMessage: handleMessage,
	onConnectionChange: handleConnectionChange,
})

let connectionChangeRequest = 0

self.addEventListener("message", async (e: any) => {
	const requestId = e.data[0]
	const type = e.data[1]
	const message = e.data.slice(2)
	logger.debug(`[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type]}`, message)

	switch (type) {
		case WorkerRequestType.Connect:
			const debug = message[message.length - 1] === 0x01

			if (debug) logger.setLevel(LOG_LEVEL.DEBUG)

			const serverUrl = String.fromCharCode(...message.slice(0, message.length - 1))
			connectionChangeRequest = requestId
			ws.settings.url = serverUrl
			ws.settings.debug = debug
			ws.connect()
			break
		case WorkerRequestType.Send:
			const request = new Uint8Array(message.length + 1)
			request[0] = requestId
			request.set(message, 1)
			ws.send(request)
			break
		default:
			logger.debug("[Worker] Unknown request type")
			break
	}
})

function handleConnectionChange(status: boolean) {
	logger.debug("[Worker] websocket connection change", status)
	const packet = new Uint8Array(3)
	packet[0] = connectionChangeRequest
	packet[1] = WorkerRequestType.ConnectionChange
	packet[2] = status ? 0x01 : 0x00

	self.postMessage(packet)
}

function handleMessage(packet: Uint8Array) {
	const requestId = packet[0]
	const message = packet.slice(1)

	logger.debug(`[Worker] received from backend [${requestId}]`, message)

	self.postMessage(packet)
}
