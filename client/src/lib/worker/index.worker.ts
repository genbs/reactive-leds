import { TWSRequest, TWSResponse } from "@shared"
import WS from "./websocket"

export type WorkerEvents = {
	begin: { serverUrl: string; debug: boolean }
	watch: { canvas: OffscreenCanvas }
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
			watchCanvas(message.data.canvas)
			break
		default:
			console.error("Unknown event", e)
			break
	}
})

/////////////////////////////////////

function watchCanvas(canvas: OffscreenCanvas) {
	console.log(canvas)
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
