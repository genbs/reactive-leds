import { LOG_LEVEL, logger } from "@shared"
import { FALSE, TRUE, WorkerRequestType, WorkerRequestTypeMap } from "./comm"
import WS from "./ws"

// single instance to communicate with the server
const ws: WS = new WS({
	autoConnect: false,
	shouldReconnect: true,
	onMessage: handleMessage,
	onConnectionChange: handleConnectionChange,
})

// The syncronous request id for 'connect' request
let connectionChangeRequestId = 0

// handle messages from the client
// Packet format: [requestId, type, ...message]
// the requestId is used to send the response back to the client for syncronous requests
self.addEventListener("message", async (e: any) => {
	const requestId = e.data[0]
	const type = e.data[1]
	const message = e.data.slice(2)
	logger.debug(`[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type]}`, message, logger.getLevel())

	switch (type) {
		// handle connection request
		case WorkerRequestType.Connect:
			const debug = message[message.length - 1] === TRUE
			console.log("RECEVED DEBUG", debug, message[message.length - 1])
			logger.setLevel(debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR)

			const serverUrl = String.fromCharCode(...message.slice(0, message.length - 1))
			connectionChangeRequestId = requestId
			ws.settings.url = serverUrl
			ws.settings.debug = debug

			// this request is handled by handleConnectionChange callback
			ws.connect()
			break

		// handle send message to server
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

// Intercept the connectionChangeCallback for the WS instance
function handleConnectionChange(status: boolean) {
	logger.debug("[Worker] websocket connection change", status)

	const packet = new Uint8Array(3)
	packet[0] = connectionChangeRequestId
	packet[1] = WorkerRequestType.ConnectionChange
	packet[2] = status ? TRUE : FALSE

	self.postMessage(packet)
}

// When the server sends a message to the worker, relay it to the client
function handleMessage(packet: Uint8Array) {
	const requestId = packet[0]
	const message = packet.slice(1)

	logger.debug(`[Worker] received from backend [${requestId}]`, message)
	self.postMessage(packet)
}
