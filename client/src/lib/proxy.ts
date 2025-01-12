// import worker with raw-loader

import {
	EWSRequestByteType,
	TStripe,
	TWSRequestBlink,
	TWSRequestJSONConnectDevice,
	TWSRequestJSONGetClients,
	TWSRequestJSONUpdateStripe,
	TWSRequestSetLEDs,
} from "@shared"

// @ts-ignore
import MyWorker from "./worker/index.worker"

import { mappingUI } from "./ui/mapping"
import type { WorkerRequest, WorkerResponse } from "./worker/index.worker.js"
import * as proxyState from "./worker/state"

///////////////////////////

///////////////////////////

function onWorkerMessage(message: WorkerResponse) {
	switch (message.event) {
		case "update_state":
			proxyState.updateState(message.data)
			break
		case "connectionChange":
			proxyState.updateState({ connected: message.data.status })
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

		let unbind = bind(({ event, data }) => {
			if (event === "connectionChange" && data.status) {
				resolved = true
				unbind()
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

let watchRID = 0
export function watch(canvas: HTMLCanvasElement, gridSize: [number, number]) {
	checkConnected()

	cancelAnimationFrame(watchRID)

	let lastSent = 0
	function start_watching() {
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

			setTimeout(() => {
				watchRID = requestAnimationFrame(start_watching)
			}, 1000 / 60)
		})
	}

	watchRID = requestAnimationFrame(start_watching)
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

let showRAFID = -1
export function show(gridSize: [number, number]) {
	const currentCanvas = document.querySelector("canvas[data-type=leds]")
	if (currentCanvas) {
		return cancelAnimationFrame(showRAFID)
	}

	const canvasRef = document.querySelector("canvas:not([data-type=leds])") as HTMLCanvasElement | null
	if (!canvasRef) throw new Error("Canvas not found")

	const canvas = document.createElement("canvas")
	canvas.width = 200
	canvas.height = (canvasRef.height / canvasRef.width) * 200
	canvas.style.position = "fixed"
	canvas.style.top = "0"
	canvas.style.right = "0"
	canvas.style.zIndex = "9999"
	canvas.setAttribute("data-type", "leds")
	canvas.style.border = "1px solid red"
	document.body.appendChild(canvas)

	function draw() {
		const stripes = proxyState.getState().stripes
		mappingUI(
			canvas,
			{
				gridSize,
			},
			stripes,
			(stripe: TStripe) => {
				updateStripe(stripe.device.address, stripe)
			}
		)
	}

	let lastUpdate = 0
	proxyState.onChangeState(() => {
		const now = performance.now()
		if (now - lastUpdate < 1000 / 24) return
		lastUpdate = now
		draw()
	})

	draw()
}
