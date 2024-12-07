export enum NeoPixelMessage {
	GET_CONFIG = 0,
	SET_CONFIG = 1,
	SET_COLOR = 2,
	LOG = 3,
	RESET = 4,
}

export type Config = {
	wifi_ssid: string
	wifi_pwd: string

	id: number // unique id or stripe index
	port: number // http and ws port
	pixelType: number // NEO_GRB + NEO_KHZ800 (5v stripe), NEO_WRGB + NEO_KHZ800 (24v cob)
	pin: number // GPIO4 = 4
	leds: number // number of leds
	brightness: number
}

export default class NeoPixel {
	static DEFAULT_BLOCK_SIZE = 80

	private blockSize: number
	private ws: WebSocket
	private url: string
	private lock: boolean
	private config: Config

	// array of callbacks
	private listeners: ((message: NeoPixelMessage, data: any) => void)[] = []

	constructor(url: string, blockSize = NeoPixel.DEFAULT_BLOCK_SIZE) {
		this.url = `ws://${url}/ws`
		this.lock = false
		this.blockSize = blockSize
	}

	setBlockSize(blockSize: number) {
		this.blockSize = blockSize
	}

	//////////////////////////////////////////

	onMessage(callback: (message: NeoPixelMessage, data: any) => void) {
		this.listeners.push(callback)

		return () => {
			this.listeners = this.listeners.filter(listener => listener !== callback)
		}
	}

	once(response_code, callback) {
		let unbind = null

		const listener = (message, data) => {
			if (message === response_code) {
				unbind()
				callback(data)
			}
		}

		unbind = this.onMessage(listener)
	}

	//////////////////////////////////////////

	private loadConfig() {
		return new Promise<void>((resolve, reject) => {
			this.once(NeoPixelMessage.GET_CONFIG, config => {
				this.config = config
				resolve()
			})

			this.send(NeoPixelMessage.GET_CONFIG)
		})
	}

	public setConfig(config: { leds: number; brightness: number; pin: number; pixelType: number }) {
		this.send(NeoPixelMessage.SET_CONFIG, [
			config.leds ?? this.config.leds,
			config.brightness ?? this.config.brightness,
			config.pin ?? this.config.pin,
			config.pixelType ?? this.config.pixelType,
		])
		this.loadConfig()
	}

	public async getConfig(): Promise<Config> {
		if (!this.config) {
			await this.loadConfig()
		}

		return this.config
	}

	//////////////////////////////////////////

	public init() {
		return new Promise<void>((resolve, reject) => {
			this.ws = new WebSocket(this.url)

			this.ws.addEventListener("message", event => {
				const { message, data } = JSON.parse(event.data)

				if (message === NeoPixelMessage.LOG) {
					console.info("[LOG]", data)
				}

				this.listeners.forEach(listener => listener(message, data))
			})

			this.ws.addEventListener("open", async () => {
				await this.loadConfig()
				resolve()
			})
		})
	}

	private getArray(data, components = 4) {
		const len = data.length / components
		const final = new Uint8Array(len * 5)

		for (let i = 0; i < len; i++) {
			const r = data[i * components]
			const g = data[i * components + 1]
			const b = data[i * components + 2]

			final[i * 5] = i
			final[i * 5 + 1] = r
			final[i * 5 + 2] = g
			final[i * 5 + 3] = b
			final[i * 5 + 4] = components === 3 ? Math.max(r, g, b) : data[i * components + 3]
		}

		return final
	}

	public async setPixel(index: number, rgb: [number, number, number] | [number, number, number, number]) {
		if (this.lock) {
			return
		}
		this.lock = true
		const data = [rgb[0], rgb[1], rgb[2], rgb[3] ?? Math.max(rgb[0], rgb[1], rgb[2])]
		await this.send(NeoPixelMessage.SET_COLOR, new Uint8Array([index, data[0], data[1], data[2], data[3]]))
		this.lock = false
	}

	public async setColor(data, components = 4) {
		if (this.lock) {
			return
		}
		this.lock = true
		await this.send(NeoPixelMessage.SET_COLOR, this.getArray(data, components))
		this.lock = false
	}

	public async send(type, data: Uint8Array | Array<number> = new Uint8Array()) {
		const message = new Uint8Array([type, ...data])

		if (data.length > this.blockSize) {
			const blocks = Math.ceil(data.length / this.blockSize)

			for (let i = 0; i < blocks; i++) {
				const start = i * this.blockSize
				const end = Math.min((i + 1) * this.blockSize, data.length)
				const block = data.slice(start, end)
				const blockMessage = new Uint8Array([type, ...block])
				await new Promise((resolve, reject) => {
					this.once(blockMessage[0], resolve)
					this.ws.send(blockMessage)
				})
			}

			return Promise.resolve()
		}

		return new Promise((resolve, reject) => {
			this.once(message[0], resolve)
			this.ws.send(message)
		})
	}
}
