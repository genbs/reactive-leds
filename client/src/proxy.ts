/**
 * Create a tunnel to the worker thread.
 * The client (browser) can send messages to the worker with this public functions.
 */

import { encodeBuffer, logger } from "../../shared"
import { EMPTY_REQUEST_ID, FALSE, TRUE, WorkerRequestType, WorkerRequestTypeMap } from "./comm"
// @ts-ignore
import Deamon from "./deamon.worker"

// Logic to send and receive messages from the worker
// the client need to send a message and wait for the response, like 'connect' function
type ProxyRequest = {
	resolve: (data: Uint8Array) => void
	requestId: number
}

// @internal The requests need to be stored to handle the response from the worker
let requests: ProxyRequest[] = []

// @internal Create sync request to proxy.
// Add to client buffer a requestId before send to worker.
function createRequest(buffer: Uint8Array) {
	const requestId = (requests.length % 255) + 1

	const newBuffer = new Uint8Array(1 + buffer.length)
	newBuffer[0] = requestId
	newBuffer.set(buffer, 1)

	const request = new Promise<Uint8Array>(resolve => {
		requests.push({
			resolve,
			requestId,
		})
	})

	return [request, newBuffer, requestId] as const
}

// @internal When the worker sends a response to the client, check if it is a sync request
function handleResponse(event: MessageEvent) {
	const message: Uint8Array = event.data
	const requestId = message[0]
	const response = message.slice(1)

	const request = requests.find(r => r.requestId === requestId)

	if (!request) {
		logger.debug(`[Proxy] Unknown request id ${requestId}`)
		return
	}

	requests = requests.filter(r => r.requestId !== requestId)
	request.resolve(response)
}

// @internal Global worker instance
export let deamon: Worker | null = null

export function checkConnected() {
	if (!deamon) throw new Error("Worker not initialized")
}

// Send a connect request to the worker.
export function connect(serverURL: string, debug = false): Promise<boolean> {
	if (!deamon) {
		deamon = new Deamon()
		deamon.addEventListener("message", handleResponse)

		logger.debug("[Proxy] Worker created")
	}

	// create a packet to send to the worker [requestType, serverURL, debug]
	const buffer = new Uint8Array(1 + serverURL.length + 1)
	buffer[0] = WorkerRequestType.Connect
	encodeBuffer(serverURL, buffer, 1)
	buffer[1 + serverURL.length] = debug ? TRUE : FALSE

	return sendSync(buffer).then(response => response[0] === TRUE)
}

// Send a synchronous message to the worker.
export function sendSync(data: Uint8Array): Promise<Uint8Array> {
	checkConnected()

	let [promise, buffer, requestId] = createRequest(data)
	logger.debug(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1]]}`, buffer)
	deamon.postMessage(buffer)

	return promise
}

// send async request, no need to wait for the response
export function send(data: Uint8Array): void {
	checkConnected()

	// like 'createRequest' add a requestId to the buffer
	const buffer = new Uint8Array(1 + data.length)
	buffer[0] = EMPTY_REQUEST_ID
	buffer.set(data, 1)

	logger.debug(`[Proxy] send ${WorkerRequestTypeMap[buffer[1]]}`, buffer)
	deamon.postMessage(buffer)
}
