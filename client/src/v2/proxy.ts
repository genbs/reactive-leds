import { logger } from "@shared"
import { WorkerRequestType, WorkerRequestTypeMap } from "./comm"
// @ts-ignore
import Deamon from "./deamon.worker"

export let deamon: Worker | null = null

const WEBSOCKET_CONNECTION_TIMEOUT = 10_000

export function checkConnected() {
	if (!deamon) throw new Error("Worker not initialized")
}

type ProxyRequest = {
	resolve: (data: Uint8Array) => void
	requestId: number
}
const requests: ProxyRequest[] = []

function onDeamonMessage(event: MessageEvent) {
	const message: Uint8Array = event.data
	const requestId = message[0]
	const request = requests.find(r => r.requestId === requestId)

	if (!request) {
		logger.debug(`[Proxy] Unknown request id ${requestId}`)
		return
	}

	request.resolve(message.slice(1)) // requestId
	requests.splice(requests.indexOf(request), 1)
}

let requestId = 0
const EMPTY_REQUEST_ID = 0

export function sendSync(data: Uint8Array): Promise<Uint8Array> {
	if (!deamon) throw new Error("Worker not initialized")

	requestId = (requestId + 1) % 255

	let promise = new Promise<Uint8Array>(resolve => {
		requests.push({
			resolve,
			requestId,
		})
	})

	const buffer = new Uint8Array(1 + 1 + data.length)
	buffer[0] = requestId
	buffer.set(data, 1)
	deamon.postMessage(buffer)

	logger.debug(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1]]}`, buffer)

	return promise
}

export function send(data: Uint8Array): void {
	if (!deamon) throw new Error("Worker not initialized")

	const buffer = new Uint8Array(1 + data.length)
	buffer[0] = EMPTY_REQUEST_ID
	buffer.set(data, 1)

	logger.debug(`[Proxy] sendSynx [${requestId}] ${WorkerRequestTypeMap[buffer[1]]}`, buffer)

	deamon.postMessage(buffer)
}

export function connect(serverURL: string, debug = false): Promise<boolean> {
	if (!deamon) {
		deamon = new Deamon()
		deamon.addEventListener("message", onDeamonMessage)
	}
	const buffer = new Uint8Array(1 + serverURL.length + 1)
	buffer[0] = WorkerRequestType.Connect
	buffer.set(bufferFromString(serverURL), 1)
	buffer[1 + serverURL.length] = debug ? 0x01 : 0x00

	return sendSync(buffer).then(response => response[0] === 0x01)
}

function bufferFromString(str: string): Uint8Array {
	const buffer = new Uint8Array(str.length)
	for (let i = 0; i < str.length; i++) buffer[i] = str.charCodeAt(i)
	return buffer
}
