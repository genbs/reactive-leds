// import worker with raw-loader

import {
	EWSRequestByteType,
	TNetClient,
	TStripe,
	TWSRequestBlink,
	TWSRequestJSONConnectDevice,
	TWSRequestJSONGetClients,
	TWSRequestJSONGetStripes,
	TWSRequestJSONUpdateStripe,
	TWSRequestSetLEDs,
} from "@shared"
// @ts-ignore
import MyWorker from "./worker/index.worker"

import type { WorkerRequest, WorkerResponse } from "./worker/index.worker.js"
///////////////////////////

export type GydraLEDState = {
	stripes: TStripe[]
	clients: TNetClient[]
	connected: boolean
}

const state: GydraLEDState = {
	stripes: [],
	clients: [],
	connected: false,
}

const onChangeStateListeners = []

export function onChangeState(callback: (state: GydraLEDState) => void) {
	callback(state)
	onChangeStateListeners.push(callback)

	return () => {
		const index = onChangeStateListeners.indexOf(callback)
		onChangeStateListeners.splice(index, 1)
	}
}

function notifyChangeState() {
	onChangeStateListeners.forEach(callback => {
		callback(state)
	})
}

function updateState(newState: Partial<GydraLEDState>) {
	Object.assign(state, newState)
	notifyChangeState()
}

///////////////////////////

function onWorkerMessage(message: WorkerResponse) {
	switch (message.event) {
		case "get_stripes":
			updateState({
				stripes: message.data.map(stripe => ({
					...stripe,
					leds: new Uint8Array(Object.values(stripe.leds)),
				})),
			})
			break
		case "get_clients":
			updateState({ clients: message.data })
			break
		case "connectionChange":
			updateState({ connected: message.data.status })
			break
		default:
			console.error("Unknown message type", message)
			break
	}
}

///////////////////////////

let globalWorker: Worker | null = null

function checkConnected() {
	if (!globalWorker) throw new Error("Worker not initialized")
}

///////////////////////////

export function begin(serverUrl: string, debug = true) {
	globalWorker = new MyWorker()

	globalWorker.addEventListener("message", (event: MessageEvent) => {
		onWorkerMessage(event.data)
	})

	const request: WorkerRequest = { type: "begin", data: { serverUrl, debug } }
	globalWorker.postMessage(request)
}

export function connect(ip: string) {
	checkConnected()

	const request: TWSRequestJSONConnectDevice = { type: "connect", ip }
	globalWorker.postMessage(request)
}
export function getStripes() {
	checkConnected()

	const request: TWSRequestJSONGetStripes = { type: "get_stripes" }
	globalWorker.postMessage(request)
}

export function updateStripe(ip: TStripe["device"]["address"], stripe: TStripe) {
	checkConnected()

	const request: TWSRequestJSONUpdateStripe = { type: "update_stripe", data: stripe, ip }
	globalWorker.postMessage(request)
}

export function getClients() {
	checkConnected()

	const request: TWSRequestJSONGetClients = { type: "get_clients" }
	globalWorker.postMessage(request)
}

export function deleteStripe(ip: string) {
	checkConnected()

	const request = { type: "delete_stripe", ip }
	globalWorker.postMessage(request)
}

/**
 *
 * @param id
 * @param leds [pixel_index, r, g, b, a, pixel_index, r, g, b, a, ...]
 */
export function setLEDs(stripe_id: TStripe["device"]["id"], leds_with_pixel_index: number[] | Uint8Array) {
	checkConnected()

	const request: TWSRequestSetLEDs = new Uint8Array(1 + 1 + leds_with_pixel_index.length)
	request[0] = EWSRequestByteType.SetLEDs
	request[1] = stripe_id
	request.set(leds_with_pixel_index, 2)

	globalWorker.postMessage(request)
}

export function blink(stripe_id: TStripe["device"]["id"]) {
	checkConnected()

	const request: TWSRequestBlink = new Uint8Array(1 + 1)
	request[0] = EWSRequestByteType.Blink
	request[1] = stripe_id

	globalWorker.postMessage(request)
}

///////////////////////////
