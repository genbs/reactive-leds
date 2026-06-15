import { decodeBuffer } from "@reactive-leds/shared"
import { CONNECTION_CHANGE_REQUEST_ID, FALSE, TRUE, WorkerRequestType, WorkerRequestTypeMap } from "./comm"
import WS from "./ws"

let globalWS: WS | null = null // single instance to communicate with the server

let connectionChangeRequestId: number | null = null // The syncronous request id for 'connect' request

let debug = false

/** 
 * Handle messages from the client
 * Packet format: [requestId, type, ...message]
 * the requestId is used to send the response back to the client for syncronous requests
 */
self.addEventListener("message", async (e: any) => {
	const requestId = e.data[0]
	const type = e.data[1]
	const message = e.data.slice(2)

	debug && console.log(
		`[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type as WorkerRequestType]}`,
		message
	)

	switch (type) {
		// handle connection request [WorkerRequestType.Connect, serverUrl, debug]
		case WorkerRequestType.Connect:
			// Symmetric with proxy.ts: serverURL is UTF-8 encoded via encodeBuffer.
			// The last byte is the debug flag, so slice it off before decoding.
			const serverUrl = decodeBuffer(message.slice(0, message.length - 1))
			debug = message[message.length - 1] === 1
			debug && console.log(`[Worker] connect request to server="${serverUrl}"`)

			if (!globalWS) {
				globalWS = new WS({
					debug,
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
				debug && console.log("[Worker] Send error, not connected, can't send message")
				return
			}

			const request = new Uint8Array(message.length + 1)
			request[0] = requestId
			request.set(message, 1)
			globalWS.send(request)
			break
		default:
			debug && console.log("[Worker] Unknown request type")
			break
	}
})

/** Intercept the connectionChangeCallback for the WS instance  */
function handleConnectionChange(status: boolean) {
	debug && console.log("[Worker] websocket connection change", status)

	const packet = new Uint8Array(3)
	packet[1] = WorkerRequestType.ConnectionChange
	packet[2] = status ? TRUE : FALSE

	// send message to wsconnect
	if (connectionChangeRequestId) {
		// Only "connect" request can have a requestId
		packet[0] = connectionChangeRequestId
		connectionChangeRequestId = null
		self.postMessage(packet)
	}

	// send message to connection change subscribers
	packet[0] = CONNECTION_CHANGE_REQUEST_ID
	self.postMessage(packet)
}

/** When the server sends a message to the worker, relay it to the client */
function handleMessage(packet: Uint8Array) {
	const requestId = packet[0]
	const message = packet.slice(1)

	debug && console.log(`[Worker] received from backend [${requestId}]`, message)
	self.postMessage(packet)
}
