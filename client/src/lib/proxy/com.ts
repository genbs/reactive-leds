import * as proxyState from "../state"
import { WorkerRequest, WorkerResponse } from "../worker/types"
// @ts-ignore
import MyWorker from "../worker/index.worker"

export let globalWorker: Worker | null = null
let globalWorkerURL: string | null = null

export function checkConnected() {
	if (!globalWorker) throw new Error("Worker not initialized")
}

export function onWorkerMessage(message: WorkerResponse) {
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

export function bind(callback: (message: WorkerResponse) => void) {
	function onMessage(event: MessageEvent) {
		callback(event.data)
	}

	globalWorker?.addEventListener("message", onMessage)

	return () => {
		globalWorker?.removeEventListener("message", onMessage)
	}
}

export function onChangeState(callback: (state: proxyState.GydraLEDState) => void) {
	return proxyState.onChangeState(callback)
}

export function getState() {
	return proxyState.getState()
}

///////////////////////////

const WEBSOCKET_CONNECTION_TIMEOUT = 10_000

export function begin(serverUrl: string, debug = false): Promise<void> {
	let resolved = false
	if (globalWorker) {
		if (globalWorkerURL === serverUrl) {
			return Promise.resolve()
		}

		globalWorker.terminate()
		globalWorker = null
		globalWorkerURL = null
	}

	return new Promise((resolve, reject) => {
		globalWorker = new MyWorker()
		globalWorkerURL = serverUrl

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
