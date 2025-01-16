// import worker with raw-loader

import {
	EWSRequestByteType,
	TConfig,
	TStripe,
	TWSRequestBlink,
	TWSRequestJSONConnectDevice,
	TWSRequestJSONGetClients,
	TWSRequestJSONGetConfig,
	TWSRequestJSONSetConfig,
	TWSRequestJSONUpdateStripe,
	TWSRequestSetLEDs,
} from "@shared"

import { mappingUI } from "../ui/mapping"
import { WorkerRequest } from "../worker/types"
import { checkConnected, getState, globalWorker, onChangeState } from "./com"

///////////////////////////
// JSON Requests
///////////////////////////

export { begin } from "./com"

export function connect(ip: string) {
	checkConnected()

	const request: TWSRequestJSONConnectDevice = { type: "connect", ip }
	globalWorker.postMessage(request)
}

export function getConfig() {
	checkConnected()

	const request: TWSRequestJSONGetConfig = { type: "get_config" }
	globalWorker.postMessage(request)
}

export function setConfig(config: Partial<TConfig>) {
	const currentConfig = getState().config
	if (JSON.stringify({ ...currentConfig, ...config }) === JSON.stringify(currentConfig)) return
	checkConnected()

	const request: TWSRequestJSONSetConfig = { type: "set_config", data: config }
	globalWorker.postMessage(request)
}

export function updateStripe(ip: TStripe["address"], stripe: TStripe) {
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
// Binary Requests
///////////////////////////

/**
 *
 * @param id
 * @param leds [pixel_index, r, g, b, a, pixel_index, r, g, b, a, ...]
 */
export function setLEDs(stripe_id: TStripe["id"], leds_with_pixel_index: number[] | Uint8Array) {
	checkConnected()

	const request: TWSRequestSetLEDs = new Uint8Array(1 + 1 + leds_with_pixel_index.length)
	request[0] = EWSRequestByteType.SetLEDs
	request[1] = stripe_id
	request.set(leds_with_pixel_index, 2)

	globalWorker.postMessage(request)
}

export function blink(stripe_id: TStripe["id"]) {
	checkConnected()

	const request: TWSRequestBlink = new Uint8Array(1 + 1)
	request[0] = EWSRequestByteType.Blink
	request[1] = stripe_id

	globalWorker.postMessage(request)
}

///////////////////////////

let watchRID = 0
let watchTimeout: NodeJS.Timeout
export function watch(canvas: HTMLCanvasElement | OffscreenCanvas, stripes?: TStripe["id"][]) {
	checkConnected()

	cancelAnimationFrame(watchRID)
	clearTimeout(watchTimeout)

	const grid = getState().config.grid

	stripes = !stripes || stripes.length === 0 ? getState().config.stripes.map(s => s.id) : stripes

	function start_watching() {
		createImageBitmap(canvas).then(imageBitmap => {
			globalWorker.postMessage(
				{
					type: "watch",
					data: {
						bitmap: imageBitmap,
						grid: grid,
						stripesId: stripes,
					},
				} as WorkerRequest,
				[imageBitmap]
			)

			watchTimeout = setTimeout(() => {
				watchRID = requestAnimationFrame(start_watching)
			}, 1000 / 60)
		})
	}

	watchRID = requestAnimationFrame(start_watching)

	return () => {
		cancelAnimationFrame(watchRID)
		clearTimeout(watchTimeout)
	}
}

///////////////////////////

let showRAFID = -1
let unbindShow = () => {}

export function show() {
	const currentCanvas = document.querySelector("canvas[data-type=leds]")
	if (currentCanvas) {
		unbindShow()
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
		const config = getState().config

		mappingUI(canvas, config, (stripe: TStripe) => {
			updateStripe(stripe.address, stripe)
		})
	}

	let lastUpdate = 0
	unbindShow = onChangeState(() => {
		const now = performance.now()
		if (now - lastUpdate < 1000 / 24) return
		lastUpdate = now
		draw()
	})

	draw()
}
