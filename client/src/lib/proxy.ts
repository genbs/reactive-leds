// import worker with raw-loader

import {
	EWSRequestByteType,
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
import { updateState } from "./worker/state"

///////////////////////////

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
		case "leds-setteds":
			break
		default:
			console.error("Unknown message type", message)
			break
	}
}

function bind(callback: (message: WorkerResponse) => void) {
	function onMessage(event: MessageEvent) {
		callback(event.data)
	}

	globalWorker?.addEventListener("message", onMessage)

	return () => {
		globalWorker?.removeEventListener("message", onMessage)
	}
}

function once(callback: (message: WorkerResponse) => void) {
	function onMessage(event: MessageEvent) {
		callback(event.data)
		globalWorker?.removeEventListener("message", onMessage)
	}

	globalWorker?.addEventListener("message", onMessage)
}

///////////////////////////

let globalWorker: Worker | null = null

function checkConnected() {
	if (!globalWorker) throw new Error("Worker not initialized")
}

///////////////////////////

const WEBSOCKET_CONNECTION_TIMEOUT = 10000
export function begin(serverUrl: string, debug = false): Promise<void> {
	let resolved = false
	return new Promise((resolve, reject) => {
		globalWorker = new MyWorker()

		bind(onWorkerMessage)

		once(({ event, data }) => {
			if (event === "connectionChange" && data.status) {
				resolved = true
				resolve()
			}
		})

		const request: WorkerRequest = { type: "begin", data: { serverUrl, debug } }
		globalWorker.postMessage(request)

		setTimeout(() => {
			if (resolved) return
			reject(new Error("Connection timeout"))
		}, WEBSOCKET_CONNECTION_TIMEOUT)
	})
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

///////////////////////////

export function watch(canvas: HTMLCanvasElement, gridSize: [number, number]) {
	checkConnected()

	let rid = 0

	function sendToWorker() {
		once(({ event }) => {
			if (event === "leds-setteds") {
				rid = requestAnimationFrame(sendToWorker)
			}
		})

		createImageBitmap(canvas).then(imageBitmap => {
			globalWorker.postMessage(
				{
					type: "watch",
					data: {
						bitmap: imageBitmap,
						grid: gridSize,
					},
					gridSize,
				},
				[imageBitmap]
			)
		})
	}

	requestAnimationFrame(sendToWorker)

	return () => cancelAnimationFrame(rid)
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
