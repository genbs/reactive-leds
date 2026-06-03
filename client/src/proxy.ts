/**
 * Create a tunnel to the worker thread.
 * The client (browser) can send messages to the worker with these public functions.
 */

import { encodeBuffer } from "@reactive-leds/shared"
import {
	CONNECTION_CHANGE_REQUEST_ID,
	EMPTY_REQUEST_ID,
	FALSE,
	FIRST_REQUEST_ID,
	TRUE,
	WorkerRequestType,
	WorkerRequestTypeMap,
} from "./comm"
function createWorker() {
	return new Worker(new URL("./daemon.worker.js", location.href).href, { type: "module" })
}

// Pending sync requests waiting for a response from the worker
type ProxyRequest = {
	resolve: (data: Uint8Array) => void
	requestId: number
	message: Uint8Array
}

let requests: ProxyRequest[] = []
let connectionChangeCallbacks: ((connected: boolean) => void)[] = []
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

// @internal Resolve the pending sync request matching the response ID
function handleResponse(event: MessageEvent) {
	const message: Uint8Array = event.data
	const responseId = message[0]
	const responseData = message.slice(1) // remove the requestId from the response
	const request = requests.find(r => r.requestId === responseId)

	if (!request) {
		// connection change events don't require a prior request
		if (responseId == CONNECTION_CHANGE_REQUEST_ID && responseData[0] === WorkerRequestType.ConnectionChange) {
			connected = responseData[1] === TRUE
			debug && console.log(`[Proxy] Connection change event: ${connected}`)

			connectionChangeCallbacks.forEach(callback => callback(connected))
			return
		}

		debug && console.log(`[Proxy] Unknown request id ${responseId}`)
		return
	}

	requests = requests.filter(r => r.requestId !== responseId)
	request.resolve(responseData)
}

export let daemon: Worker | null = null
let debug = false

// @internal Throws if the worker has not been initialized yet
export function checkConnected() {
	if (!daemon) throw new Error("Worker not initialized")
}

////////////////////// Public functions

/** Connect to the WebSocket server via the worker */
export function wsconnect(serverURL: string, _debug = false): Promise<boolean> {
	if (!daemon) {
		daemon = createWorker()
		checkConnected()

		daemon!.addEventListener("message", handleResponse)

		debug = _debug
		debug && console.log("[Proxy] Worker created")
	}

	// create a packet to send to the worker [requestType, serverURL, debug]
	const buffer = new Uint8Array(1 + serverURL.length + 1)
	buffer[0] = WorkerRequestType.Connect
	encodeBuffer(serverURL, buffer, 1)
	buffer[1 + serverURL.length] = debug ? TRUE : FALSE

	debug && console.log(`[Proxy] connect to ${serverURL}`, buffer)
	return sendSync(buffer).then(response => (connected = response[0] === TRUE))
}

/** Register a callback for connection state changes, returns an unsubscribe function */
export function onConnectionChange(callback: (connected: boolean) => void) {
	checkConnected()

	if (!connectionChangeCallbacks.includes(callback)) {
		connectionChangeCallbacks.push(callback)

		return () => {
			connectionChangeCallbacks = connectionChangeCallbacks.filter(cb => cb !== callback)
		}
	}
}

/** Return the current WebSocket connection state */
export function isConnected() {
	checkConnected()

	return connected
}

/** Send a message to the worker and wait for the response */
export function sendSync(data: Uint8Array): Promise<Uint8Array> {
	checkConnected()

	let [promise, buffer, requestId] = createRequest(data)
	debug && console.log(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1] as WorkerRequestType]}`, buffer)
	daemon!.postMessage(buffer)

	return promise
}

/** Send a message to the worker, no response expected */
export function send(data: Uint8Array): void {
	checkConnected()

	const buffer = new Uint8Array(1 + data.length)
	buffer[0] = EMPTY_REQUEST_ID
	buffer.set(data, 1)

	debug && console.log(`[Proxy] send ${WorkerRequestTypeMap[buffer[1] as WorkerRequestType]}`, buffer)
	daemon!.postMessage(buffer)
}
