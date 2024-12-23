import WS from "./websocket"

const GYDRA_LEDS_WS_CONNECTION_TIMEOUT = 10000

const gydraLEDs = {
	ws: null,
	start: (url: string, debug = false, autoConnect = true): Promise<boolean> => {
		return new Promise((_resolve, reject) => {
			let resolved = false

			const resolve = (status: boolean) => {
				if (resolved) return

				resolved = true
				ws.removeAllListeners()
				_resolve(status)
			}

			const ws = new WS({
				url,
				debug,
				autoConnect,
				shouldReconnect: autoConnect,
			})

			ws.on("connectionChange", connected => {
				if (connected) {
					resolve(true)
				}
			})

			setTimeout(() => {
				if (ws.connected) return

				console.warn(`[Gydra LEDs] Connection to ${url} timed out`)
				resolve(false)
			}, GYDRA_LEDS_WS_CONNECTION_TIMEOUT)

			gydraLEDs.ws = ws
		})
	},
}

export default gydraLEDs
