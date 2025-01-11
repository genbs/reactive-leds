import { EWSRequestByteType, TStripe, TWSRequest, TWSRequestBlink, TWSRequestSetLEDs, TWSResponse } from "@shared"
import { mapStripeOnData } from "../ui/mapping/utils"
import { getState } from "./state"
import WS from "./websocket"

export type WorkerEvents = {
	begin: { serverUrl: string; debug: boolean }
	watch: { bitmap: ImageBitmap; grid: [number, number] }
}
export type WorkerRequest =
	| {
			type: "begin"
			data: WorkerEvents["begin"]
	  }
	| {
			type: "watch"
			data: WorkerEvents["watch"]
	  }

export type WorkerResponse =
	| {
			event: "connectionChange"
			data: {
				status: boolean
			}
	  }
	| {
			event: "leds-setteds"
			data?: undefined
	  }
	| TWSResponse

self.addEventListener("message", async (e: any) => {
	const message = e.data as TWSRequest | WorkerRequest

	if (message instanceof Uint8Array) {
		globalWs?.send(message)
		return
	}

	switch (message.type) {
		case "begin":
			const status = await begin(message.data.serverUrl, message.data.debug)
			const response: WorkerResponse = { event: "connectionChange", data: { status } }
			self.postMessage(response)
			break
		case "get_stripes":
			globalWs?.send({ type: "get_stripes" })
			break
		case "get_clients":
			globalWs?.send({ type: "get_clients" })
			break
		case "update_stripe":
			globalWs?.send({ type: "update_stripe", data: message.data, ip: message.ip })
			break
		case "delete_stripe":
			globalWs?.send({ type: "delete_stripe", ip: message.ip })
			break
		case "connect":
			globalWs?.send({ type: "connect", ip: message.ip })
			break
		case "watch":
			watchCanvas(message.data)
			break
		default:
			console.error("Unknown event", e)
			break
	}
})

/////////////////////////////////////

function watchCanvas({ bitmap, grid }: WorkerEvents["watch"]) {
	const stripes = getState().stripes

	for (const stripe of stripes) {
		const { pixels } = mapStripeOnData(bitmap, [bitmap.width, bitmap.height], grid, stripe)
		for (let i = 0; i < stripe.device.num_leds; i++) {
			pixels[i * 4 + 3] = 0
		}
		if (stripe.leds.every((v, i) => v === pixels[i])) return
		stripe.leds.set(pixels)
		const data = new Uint8Array(stripe.device.num_leds * 5)
		for (let i = 0; i < stripe.device.num_leds; i++) {
			data[i * 5] = i
			data[i * 5 + 1] = pixels[i * 4]
			data[i * 5 + 2] = pixels[i * 4 + 1]
			data[i * 5 + 3] = pixels[i * 4 + 2]
			data[i * 5 + 4] = pixels[i * 4 + 3]
		}
		console.log("setLEDs", stripe.device.id, data)
		setLEDs(stripe.device.id, data)
	}

	const response: WorkerResponse = { event: "leds-setteds" }
	self.postMessage(response)
}

/////////////////////////////////////

const GYDRA_LEDS_WS_CONNECTION_TIMEOUT = 10000

let globalWs: WS | null = null

async function begin(serverUrl: string, debug = false): Promise<boolean> {
	const connected = await connect(serverUrl, debug)

	globalWs.on("message", message => {
		if (typeof message !== "string") return
		self.postMessage(JSON.parse(message) as WorkerResponse)
	})

	globalWs.on("connectionChange", connected => {
		self.postMessage({ event: "connectionChange", data: { status: connected } })
	})

	globalWs?.send({ type: "get_stripes" })
	globalWs?.send({ type: "get_clients" })

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

/**
 *
 * @param id
 * @param leds [pixel_index, r, g, b, a, pixel_index, r, g, b, a, ...]
 */
export function setLEDs(stripe_id: TStripe["device"]["id"], leds_with_pixel_index: number[] | Uint8Array) {
	const request: TWSRequestSetLEDs = new Uint8Array(1 + 1 + leds_with_pixel_index.length)
	request[0] = EWSRequestByteType.SetLEDs
	request[1] = stripe_id
	request.set(leds_with_pixel_index, 2)

	globalWs?.send(request)
}

export function blink(stripe_id: TStripe["device"]["id"]) {
	const request: TWSRequestBlink = new Uint8Array(1 + 1)
	request[0] = EWSRequestByteType.Blink
	request[1] = stripe_id

	globalWs?.send(request)
}
