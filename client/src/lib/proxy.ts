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

import { getState, updateState } from "./state"
import { mapStripeOnData } from "./ui/mapping/utils"
import type { WorkerRequest, WorkerResponse } from "./worker/index.worker.js"

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

export function begin(serverUrl: string, debug = false) {
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

///////////////////////////

export function watch(canvas: HTMLCanvasElement, gridSize: [number, number]) {
	checkConnected()

	const canvasImage = new ImageData(canvas.width, canvas.height)
	const ctx = canvas.getContext("2d")
	if (!ctx) return
	const size = [canvas.width, canvas.height] as [number, number]
	let rid = 0
	// canvas will read frequently
	function clock() {
		// store canvas image to canvasImage
		canvasImage.data.set(ctx.getImageData(0, 0, canvas.width, canvas.height).data)

		const stripes = getState().stripes

		for (const stripe of stripes) {
			const { pixels } = mapStripeOnData(canvasImage.data, size, gridSize, stripe)

			for (let i = 0; i < stripe.device.num_leds; i++) {
				//pixels[i * 4 + 3] = 0
			}

			//if (stripe.leds.every((v, i) => v === pixels[i])) return
			stripe.leds.set(pixels)

			const data = new Uint8Array(stripe.device.num_leds * 5)
			for (let i = 0; i < stripe.device.num_leds; i++) {
				data[i * 5] = i
				data[i * 5 + 1] = pixels[i * 4]
				data[i * 5 + 2] = pixels[i * 4 + 1]
				data[i * 5 + 3] = pixels[i * 4 + 2]
				data[i * 5 + 4] = pixels[i * 4 + 3]
			}

			setLEDs(stripe.device.id, data)
		}

		updateState({ stripes })

		rid = requestAnimationFrame(clock)
	}

	requestAnimationFrame(clock)

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
