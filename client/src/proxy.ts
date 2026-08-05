/**
 * Create a tunnel to the worker thread.
 * The client (browser) can send messages to the worker with these public functions.
 */

import { DEFAULT_SYNC_TIMEOUT, encodeBuffer } from "@reactive-leds/shared"
import {
	CONNECTION_CHANGE_REQUEST_ID,
	EMPTY_REQUEST_ID,
	FALSE,
	FIRST_REQUEST_ID,
	TRUE,
	WorkerRequestType,
	WorkerRequestTypeMap,
} from "./comm"
// document.currentScript is only valid during the initial script evaluation,
// so it must be captured at load time. It's the worker-URL base for the UMD
// build, where import.meta.url doesn't exist (esbuild lowers it to undefined).
const scriptSrc =
	typeof document !== "undefined" ? (document.currentScript as HTMLScriptElement | null)?.src : undefined

function createWorker() {
	const base = import.meta.url || scriptSrc || ""
	const url = new URL("./daemon.worker.js", base).href
	try {
		return new Worker(url, { type: "module" })
	} catch {
		// The bundle was loaded cross-origin (e.g. from a CDN): the Worker
		// constructor requires a same-origin script, so bootstrap it through a
		// local blob that re-imports the worker module (CDNs serve CORS headers).
		const blob = new Blob([`import ${JSON.stringify(url)}`], { type: "text/javascript" })
		return new Worker(URL.createObjectURL(blob), { type: "module" })
	}
}

// Pending sync requests waiting for a response from the worker
type ProxyRequest = {
	resolve: (data: Uint8Array) => void
	reject: (error: Error) => void
	timer: ReturnType<typeof setTimeout>
}

let requests = new Map<number, ProxyRequest>()
let connectionChangeCallbacks: ((connected: boolean) => void)[] = []
let connected = false

////////////////////// Internal functions

// @internal Create sync request to proxy. Fill the reserved request ID byte.
let rid = FIRST_REQUEST_ID - 1
function nextRequestId() {
	for (let i = FIRST_REQUEST_ID; i <= 255; i++) {
		rid = rid === 255 ? FIRST_REQUEST_ID : rid + 1
		if (!requests.has(rid)) return rid
	}
	throw new Error("Too many pending requests")
}

function createRequest(buffer: Uint8Array, timeout = DEFAULT_SYNC_TIMEOUT) {
	const requestId = nextRequestId()
	buffer[0] = requestId

	const request = new Promise<Uint8Array>((resolve, reject) => {
		const timer = setTimeout(() => {
			requests.delete(requestId)
			reject(new Error(`Request ${requestId} timed out`))
		}, timeout)
		requests.set(requestId, { resolve, reject, timer })
	})

	return [request, buffer, requestId] as const
}

function rejectPendingRequests(message: string) {
	for (const [requestId, request] of requests) {
		clearTimeout(request.timer)
		request.reject(new Error(`${message} (${requestId})`))
	}
	requests.clear()
}

// @internal Resolve the pending sync request matching the response ID
function handleResponse(event: MessageEvent) {
	if (!(event.data instanceof Uint8Array)) return

	const message: Uint8Array = event.data
	const responseId = message[0]
	const responseData = message.subarray(1) // remove the requestId from the response
	const request = requests.get(responseId)

	if (!request) {
		// connection change events don't require a prior request
		if (responseId === CONNECTION_CHANGE_REQUEST_ID && responseData[0] === WorkerRequestType.ConnectionChange) {
			const next = responseData[1] === TRUE
			// Dedupe: failed reconnect retries emit one `false` each (ws.ts notifies
			// every close) — only forward actual state transitions to subscribers.
			if (next !== connected) {
				connected = next
				if (!connected) rejectPendingRequests("Proxy disconnected")
				debug && console.log(`[Proxy] Connection change event: ${connected}`)
				connectionChangeCallbacks.forEach(callback => callback(connected))
			}
			return
		}

		debug && console.log(`[Proxy] Unknown request id ${responseId}`)
		return
	}

	requests.delete(responseId)
	clearTimeout(request.timer)
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

	// create a packet [requestId, requestType, serverURL, debug]
	const buffer = new Uint8Array(2 + serverURL.length + 1)
	buffer[1] = WorkerRequestType.Connect
	encodeBuffer(serverURL, buffer, 2)
	buffer[2 + serverURL.length] = debug ? TRUE : FALSE

	debug && console.log(`[Proxy] try to connect to ${serverURL}`, buffer)
	return sendSync(buffer).then(response => response[1] === TRUE).catch(() => false)
}

/** Register a callback for connection state changes, returns an unsubscribe function */
export function onConnectionChange(callback: (connected: boolean) => void) {
	checkConnected()

	if (!connectionChangeCallbacks.includes(callback))
		connectionChangeCallbacks.push(callback)

	return () => {
		connectionChangeCallbacks = connectionChangeCallbacks.filter(cb => cb !== callback)
	}
}

/** Return the current WebSocket connection state */
export function isConnected() {
	checkConnected()

	return connected
}

/** Send a message to the worker and wait for the response */
export async function sendSync(data: Uint8Array, timeout = DEFAULT_SYNC_TIMEOUT): Promise<Uint8Array> {
	checkConnected()

	let [promise, buffer, requestId] = createRequest(data, timeout)
	debug && console.log(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1] as WorkerRequestType]}`, buffer)
	try {
		daemon!.postMessage(buffer, [buffer.buffer])
	} catch (err) {
		const request = requests.get(requestId)
		if (request) {
			clearTimeout(request.timer)
			requests.delete(requestId)
		}
		throw err
	}

	return promise
}

/** Send a message to the worker, no response expected */
export function send(data: Uint8Array): void {
	checkConnected()

	data[0] = EMPTY_REQUEST_ID

	debug && console.log(`[Proxy] send ${WorkerRequestTypeMap[data[1] as WorkerRequestType]}`, data)
	daemon!.postMessage(data, [data.buffer])
}
