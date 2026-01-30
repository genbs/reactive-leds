/**
 * Create a tunnel to the worker thread.
 * The client (browser) can send messages to the worker with this public functions.
 */

import { encodeBuffer, logger } from "@leds/shared"
import {
	CONNECTION_CHANGE_REQUEST_ID,
	EMPTY_REQUEST_ID,
	FALSE,
	FIRST_REQUEST_ID,
	TRUE,
	WorkerRequestType,
	WorkerRequestTypeMap,
} from "./comm"
// @ts-ignore
import Deamon from "./deamon.worker"

// Logic to send and receive messages from the worker
// the client need to send a message and wait for the response, like 'connect' function
type ProxyRequest = {
	resolve: (data: Uint8Array) => void
	requestId: number
	message: Uint8Array
}

// @internal The requests need to be stored to handle the response from the worker
let requests: ProxyRequest[] = []

// @internal The callbacks for connection change events
let connectionChangeCallbacks: ((connected: boolean) => void)[] = []

// @internal The first request id to use for sync requests
let connected = false

////////////////////// Internal functions

// @internal Create sync request to proxy. Add to client buffer a requestId before send it to worker.
let rid = 0
function createRequest(buffer: Uint8Array) {
	const requestId = FIRST_REQUEST_ID + (rid++ % (255 - FIRST_REQUEST_ID)) + 1

	const newBuffer = new Uint8Array(1 + buffer.length)
	newBuffer[0] = requestId
	newBuffer.set(buffer, 1)

	const request = new Promise<Uint8Array>(resolve => {
		requests.push({
			resolve,
			requestId,
			message: newBuffer,
		})
	})

	return [request, newBuffer, requestId] as const
}

// @internal When the worker sends a response to the client, check if it is a sync request. If so, resolve the promise with the response data.
function handleResponse(event: MessageEvent) {
	const message: Uint8Array = event.data
	const responseId = message[0]
	const responseData = message.slice(1) // remove the requestId from the response
	const request = requests.find(r => r.requestId === responseId)

	if (!request) {
		// check if it's a connection change event (connection change not need send request)
		if (responseId == CONNECTION_CHANGE_REQUEST_ID && responseData[0] === WorkerRequestType.ConnectionChange) {
			connected = responseData[1] === TRUE
			logger.debug(`[Proxy] Connection change event: ${connected}`)

			connectionChangeCallbacks.forEach(callback => callback(connected))
			return
		}

		logger.debug(`[Proxy] Unknown request id ${responseId}`)
		return
	}

	requests = requests.filter(r => r.requestId !== responseId)
	request.resolve(responseData)
}

// @internal Global worker instance
export let deamon: Worker | null = null

export function checkConnected() {
	if (!deamon) throw new Error("Worker not initialized")
}

////////////////////// Public functions

// Send a connection request to the web worker.
export function wsconnect(serverURL: string, debug = false): Promise<boolean> {
	if (!deamon) {
		deamon = new Deamon()
		checkConnected()

		deamon!.addEventListener("message", handleResponse)

		logger.debug("[Proxy] Worker created")
	}

	// create a packet to send to the worker [requestType, serverURL, debug]
	const buffer = new Uint8Array(1 + serverURL.length + 1)
	buffer[0] = WorkerRequestType.Connect
	encodeBuffer(serverURL, buffer, 1)
	buffer[1 + serverURL.length] = debug ? TRUE : FALSE

	// handshake with the worker
	logger.debug(`[Proxy] connect to ${serverURL} with debug=${debug}`, buffer)
	return sendSync(buffer).then(response => (connected = response[0] === TRUE))
}

export function onConnectionChange(callback: (connected: boolean) => void) {
	checkConnected()

	if (!connectionChangeCallbacks.includes(callback)) {
		connectionChangeCallbacks.push(callback)

		return () => {
			connectionChangeCallbacks = connectionChangeCallbacks.filter(cb => cb !== callback)
		}
	}
}

export function isConnected() {
	checkConnected()

	return connected
}

// Send a synchronous message to the worker.
export function sendSync(data: Uint8Array): Promise<Uint8Array> {
	checkConnected()

	let [promise, buffer, requestId] = createRequest(data)
	logger.debug(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1] as WorkerRequestType]}`, buffer)
	deamon!.postMessage(buffer)

	return promise
}

// send async request, no need to wait for the response
export function send(data: Uint8Array): void {
	checkConnected()

	// like 'createRequest' add a requestId to the buffer
	const buffer = new Uint8Array(1 + data.length)
	buffer[0] = EMPTY_REQUEST_ID
	buffer.set(data, 1)

	logger.debug(`[Proxy] send ${WorkerRequestTypeMap[buffer[1] as WorkerRequestType]}`, buffer)
	deamon!.postMessage(buffer)
}
