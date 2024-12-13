import proto from "@protocol"
import EventEmitter from "@utils/EventEmitter"
import { ProtocolBoardConfig } from "src/protocol/types"

type ESPClientEvents = {
	onConnect: (self: ESPClient) => void
	onDisconnect: (self: ESPClient) => void
}

export class ESPClient extends EventEmitter<ESPClientEvents> {
	static CHECK_ALIVE_INTERVAL = 5000

	public name: string
	public address: string
	public host: string
	public online = false
	public config: ProtocolBoardConfig

	/**
	 * The current data of the LEDs.
	 *
	 * @private
	 * @type {Uint8Array}
	 */
	private ledsData: Uint8Array

	/**
	 * The difference between the current data and the new data.
	 *
	 * @private
	 * @type {Uint8Array}
	 */
	private ledsDataDiff: Uint8Array

	/**
	 * The interval to check if the device is online.
	 *
	 * @private
	 * @type {NodeJS.Timeout}
	 */
	private checkAliveInterval: NodeJS.Timeout

	constructor(name: string, address: string, host: string) {
		super()

		this.name = name
		this.address = address
		this.host = host

		this.isAlive()
		this.checkAliveInterval = setInterval(() => this.isAlive(), ESPClient.CHECK_ALIVE_INTERVAL)

		this.loadConfig().then(() => {
			this.ledsData = new Uint8Array(this.config.num_leds * 5)
			this.ledsDataDiff = new Uint8Array(this.config.num_leds * 5)
		})
	}

	/**
	 * Ping the device to check if it's online.
	 */
	async isAlive() {
		const online = await this.ping()

		if (this.online !== online) {
			this.online = online
			this.emit(this.online ? "onConnect" : "onDisconnect", this)
		}
	}

	/**
	 * Syncronous ping the device to check if it's online.
	 */
	async ping() {
		return proto.ping(this.address, this.config.port)
	}

	/**
	 * Load the device configuration.
	 */
	async loadConfig() {
		const config = await proto.getConfig(this.address, this.config.port)
		if (!config) return

		this.config = config
	}

	/**
	 * Set the device configuration.
	 */
	async setConfig(config: Partial<ProtocolBoardConfig>) {
		const newConfig = { ...this.config, ...config }
		if (await proto.setConfig(this.address, this.config.port, newConfig)) {
			this.config = newConfig
			return true
		}

		return false
	}

	/**
	 * Asyncronous set the device LEDs color.
	 * Check with the current data and only send the differece.
	 *
	 * @param data [led_index, r, g, b, brightness / whiteness, led_index, r, g, b, brightness / whiteness, ...]
	 */
	setLEDs(data: number[]) {
		let differenceLength = 0

		for (let i = 0; i < this.ledsData.length; i++) {
			if (
				this.ledsData[i + 1] !== data[i + 1] ||
				this.ledsData[i + 2] !== data[i + 2] ||
				this.ledsData[i + 3] !== data[i + 3] ||
				this.ledsData[i + 4] !== data[i + 4]
			) {
				this.ledsDataDiff[i] = i
				this.ledsDataDiff[i + 1] = data[i + 1]
				this.ledsDataDiff[i + 2] = data[i + 2]
				this.ledsDataDiff[i + 3] = data[i + 3]
				this.ledsDataDiff[i + 4] = data[i + 4]

				differenceLength++

				this.ledsData[i + 1] = data[i + 1]
				this.ledsData[i + 2] = data[i + 2]
				this.ledsData[i + 3] = data[i + 3]
				this.ledsData[i + 4] = data[i + 4]
			}
		}

		proto.setLEDs(this.address, this.config.port, this.ledsDataDiff.slice(0, differenceLength * 5))
	}

	/**
	 * Destroy the client.
	 */
	destroy() {
		clearInterval(this.checkAliveInterval)
		this.online = false
		this.removeAllListeners()
	}

	toString() {
		return `ESPClient ${this.name}@${this.host} | ${this.address}:${this.config.port} | ${
			this.online ? "online" : "offline"
		}}`
	}
}
