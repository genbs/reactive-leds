import { LOG_LEVEL, logger } from "@leds/shared"
import { CONNECTION_CHANGE_REQUEST_ID, FALSE, TRUE, WorkerRequestType, WorkerRequestTypeMap } from "./comm"
import WS from "./ws"

// single instance to communicate with the server
let globalWS: WS | null = null

// The syncronous request id for 'connect' request
let connectionChangeRequestId: number | null = null

// handle messages from the client
// Packet format: [requestId, type, ...message]
// the requestId is used to send the response back to the client for syncronous requests
self.addEventListener("message", async (e: any) => {
	const requestId = e.data[0]
	const type = e.data[1]
	const message = e.data.slice(2)
	logger.debug(
		`[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type as WorkerRequestType]}`,
		message,
		logger.level
	)

	switch (type) {
		// handle connection request [WorkerRequestType.Connect, serverUrl, debug]
		case WorkerRequestType.Connect:
			const debug = message[message.length - 1] === TRUE
			const serverUrl = String.fromCharCode(...message.slice(0, message.length - 1))

			logger.level = debug ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR
			logger.debug(`[Worker] connect request to server="${serverUrl}" with debug=${debug}`)

			if (!globalWS) {
				globalWS = new WS({
					autoConnect: false,
					shouldReconnect: true,
					onConnectionChange: handleConnectionChange,
					onMessage: handleMessage,
				})
			}

			connectionChangeRequestId = requestId

			// this request is handled by handleConnectionChange callback
			globalWS.settings.url = serverUrl
			globalWS.connect()
			break

		// handle send message to server [WorkerRequestType.Send, ...message]
		case WorkerRequestType.Send:
			if (!globalWS) {
				logger.error("[Worker] Send error, not connected, can't send message")
				return
			}

			const request = new Uint8Array(message.length + 1)
			request[0] = requestId
			request.set(message, 1)
			globalWS.send(request)
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
	if (connectionChangeRequestId) {
		// Only "connect" request can have a requestId
		packet[0] = connectionChangeRequestId
		connectionChangeRequestId = null
	} else {
		// otherwise call handleConnectionChange
		packet[0] = CONNECTION_CHANGE_REQUEST_ID
	}
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
