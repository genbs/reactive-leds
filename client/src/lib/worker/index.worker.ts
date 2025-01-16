import { EWSRequestByteType, TStripe, TWSRequestBlink, TWSRequestSetLEDs, TWSResponse } from "@shared"
import * as workerState from "../state"
import { mapStripeOnData } from "../ui/mapping/utils"
import { WorkerRequest, WorkerResponse } from "./types"
import WS from "./websocket"

self.addEventListener("message", async (e: any) => {
	const message = e.data as WorkerRequest

	if (message instanceof Uint8Array) {
		switch (message[0]) {
			case EWSRequestByteType.SetLEDs:
				setLEDs(message[1], message.slice(2))
				break
			case EWSRequestByteType.Blink:
				blink(message[1])
				break
		}

		return
	}

	switch (message.type) {
		case "begin":
			const connected = await begin(message.data.serverUrl, message.data.debug)
			const response: WorkerResponse = { event: "connectionChange", data: { status: connected } }
			self.postMessage(response)
			break
		case "get_config":
			globalWs?.send({ type: "get_config" })
			break
		case "set_config":
			globalWs?.send({ type: "set_config", data: message.data })
			break
		case "get_clients":
			globalWs?.send({ type: "get_clients" })
			break
		case "update_stripe":
			globalWs?.send({ type: "update_stripe", data: message.data, ip: message.ip })
			/*
			workerState.updateState({
				stripes: workerState.getState().stripes.map(stripe => {
					if (stripe.device.address === message.ip) {
						return message.data
					}
					return stripe
				}),
			})
			self.postMessage({ event: "update_state", data: workerState.getState() })*/
			break
		case "delete_stripe":
			log("delete_stripe", message.ip)
			globalWs?.send({ type: "delete_stripe", ip: message.ip })
			break
		case "connect":
			globalWs?.send({ type: "connect", ip: message.ip })
			break
		case "watch":
			watchCanvas(message.data)
			break
		default:
			log("Unknown event", e)
			break
	}
})

workerState.onChangeState(state => {
	self.postMessage({ event: "update_state", data: state })
})

/////////////////////////////////////

function imageDataFromBitmap(bitmap: ImageBitmap): Uint8ClampedArray {
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
	const ctx = canvas.getContext("2d")
	ctx.drawImage(bitmap, 0, 0)
	return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
}

function watchCanvas({ bitmap, grid }: { bitmap: ImageBitmap; grid: [number, number] }) {
	const stripes = workerState.getState().config.stripes

	const imageData = imageDataFromBitmap(bitmap)
	for (const stripe of stripes) {
		const { pixels } = mapStripeOnData(imageData, [bitmap.width, bitmap.height], grid, stripe)
		for (let i = 0; i < stripe.num_leds; i++) {
			pixels[i * 4 + 3] = 0
		}
		const data = new Uint8Array(stripe.num_leds * 5)
		for (let i = 0; i < stripe.num_leds; i++) {
			data[i * 5] = i
			data[i * 5 + 1] = pixels[i * 4]
			data[i * 5 + 2] = pixels[i * 4 + 1]
			data[i * 5 + 3] = pixels[i * 4 + 2]
			data[i * 5 + 4] = pixels[i * 4 + 3]
		}
		setLEDs(stripe.id, data)
	}

	const response: WorkerResponse = { event: "leds-setteds" }
	self.postMessage(response)
}

/////////////////////////////////////

function log(...args: any[]) {
	console.log("[Worker]", ...args)
}

/////////////////////////////////////

const GYDRA_LEDS_WS_CONNECTION_TIMEOUT = 10000

let globalWs: WS | null = null

async function begin(serverUrl: string, debug = false): Promise<boolean> {
	if (globalWs && globalWs.connected && globalWs.url === serverUrl) {
		return true
	}

	log("Connecting to", serverUrl)
	const connected = await connect(serverUrl, debug)
	log("Connected")

	globalWs.on("message", message => {
		if (typeof message !== "string") return
		const data = JSON.parse(message) as TWSResponse

		switch (data.event) {
			case "get_config":
				const config = data.data
				workerState.updateState(prevState => ({
					...prevState,
					config: {
						...config,
						stripes: config.stripes.map(stripe => {
							let leds = new Uint8Array(Object.values(stripe.leds))
							if (leds.length !== stripe.num_leds * 4) {
								console.warn("Invalid number of LEDs", leds.length, stripe.num_leds)

								leds = new Uint8Array(stripe.num_leds * 4)
							}

							return {
								...stripe,
								leds,
							}
						}),
					},
				}))
				break
			case "get_clients":
				workerState.updateState({ clients: data.data })
				break
			default:
				log("Unknown message", data)
				break
		}
	})

	globalWs.on("connectionChange", connected => {
		workerState.updateState({ connected })
	})
	globalWs?.send({ type: "get_config" })
	globalWs?.send({ type: "get_clients" })

	workerState.updateState({ connected })

	return connected
}

/**
 * Connect to the websocket server
 */
function connect(serverUrl: string, debug = false): Promise<boolean> {
	return new Promise((_resolve, reject) => {
		let resolved = false

		const resolve = (status: boolean) => {
			if (resolved) return

			resolved = true
			ws.removeAllListeners()
			_resolve(status)
		}

		const ws = new WS({
			url: serverUrl,
			debug,
			autoConnect: true,
			shouldReconnect: true,
		})

		ws.on("connectionChange", connected => {
			if (connected) {
				resolve(true)
			}
		})

		setTimeout(() => {
			if (ws.connected) return

			console.warn(`[Gydra LEDs] Connection to ${serverUrl} timed out`)
			resolve(false)
		}, GYDRA_LEDS_WS_CONNECTION_TIMEOUT)

		globalWs = ws
	})
}

let lastClientUpdate = 0
export function setLEDs(stripe_id: TStripe["id"], leds_with_pixel_index: Uint8Array) {
	const request: TWSRequestSetLEDs = new Uint8Array(1 + 1 + leds_with_pixel_index.length)
	request[0] = EWSRequestByteType.SetLEDs
	request[1] = stripe_id
	request.set(leds_with_pixel_index, 2)

	globalWs?.send(request)

	const now = performance.now()
	if (now - lastClientUpdate > 1000 / 10) {
		const newState = workerState.getState()
		const stripe = newState.config.stripes.find(stripe => stripe.id === stripe_id)
		const leds = new Uint8Array(stripe.num_leds * 4)

		for (let i = 0; i < stripe.num_leds; i++) {
			const led_index = leds_with_pixel_index[i * 5]

			leds[led_index * 4] = leds_with_pixel_index[i * 5 + 1]
			leds[led_index * 4 + 1] = leds_with_pixel_index[i * 5 + 2]
			leds[led_index * 4 + 2] = leds_with_pixel_index[i * 5 + 3]
			leds[led_index * 4 + 3] = leds_with_pixel_index[i * 5 + 4]
		}

		lastClientUpdate = now
		newState.config.stripes = newState.config.stripes.map(s => (s.id === stripe_id ? { ...s, leds } : s))
		workerState.updateState(newState)
	}
}

export function blink(stripe_id: TStripe["id"]) {
	const request: TWSRequestBlink = new Uint8Array(1 + 1)
	request[0] = EWSRequestByteType.Blink
	request[1] = stripe_id

	globalWs?.send(request)
}
