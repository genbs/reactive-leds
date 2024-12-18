import proto from "@protocol"
import { EventEmitter, TESP } from "@shared"
import { ProtocolBoardConfig } from "src/protocol/types"

type ESPClientEvents = {
	onConnect: (self: ESPClient) => void
	onDisconnect: (self: ESPClient) => void
}

export class ESPClient extends EventEmitter<ESPClientEvents> implements TESP {
	static CHECK_ALIVE_INTERVAL = 10000
	static MAX_LAST_PING_TIME = 30000

	public address: string
	public online = false
	public port: number
	public id: number
	public num_leds: number
	public hostname: string
	public brightness: number

	public lastPing: number = 0

	/**
	 * The interval to check if the device is online.
	 *
	 * @private
	 * @type {NodeJS.Timeout}
	 */
	private checkAliveInterval: NodeJS.Timeout

	private checkAlive = true

	constructor(device: Partial<TESP>, checkAlive = true) {
		super()

		this.address = device.address
		this.port = device.port
		this.id = device.id
		this.num_leds = device.num_leds
		this.hostname = device.hostname
		this.brightness = device.brightness

		this.online = false
		this.checkAlive = checkAlive

		if (!checkAlive) return

		this.isAlive = this.isAlive.bind(this)

		this.loadConfig().then(() => {
			this.isAlive()
		})
	}

	/**
	 * Ping the device to check if it's online.
	 */
	async isAlive() {
		if (!this.checkAlive) return

		const online = await this.ping()

		if (online) this.lastPing = Date.now()

		if (this.online !== online) {
			this.online = online
			this.emit(this.online ? "onConnect" : "onDisconnect", this)
		}

		setTimeout(this.isAlive, ESPClient.CHECK_ALIVE_INTERVAL)
	}

	/**
	 * Syncronous ping the device to check if it's online.
	 */
	async ping() {
		return proto.ping(this.address, this.port)
	}

	/**
	 * Load the device configuration.
	 */
	async loadConfig() {
		const config = await proto.getConfig(this.address, this.port)
		if (!config) return

		Object.assign(this, config)
	}

	/**
	 * Set the device configuration.
	 */
	async setConfig(config: Partial<ProtocolBoardConfig>) {
		config.brightness = config.brightness ?? this.brightness
		config.num_leds = config.num_leds ?? this.num_leds
		config.port = config.port ?? this.port
		config.id = config.id ?? this.id
		config.hostname = config.hostname ?? this.hostname

		if (await proto.setConfig(this.address, this.port, config as ProtocolBoardConfig)) {
			Object.assign(this, config)

			return {
				port: this.port,
				id: this.id,
				num_leds: this.num_leds,
				hostname: this.hostname,
				brightness: this.brightness,
			}
		}

		return false
	}

	/**
	 * Asyncronous set the device LEDs color.
	 * Check with the current data and only send the differece.
	 *
	 * @param data [led_index, r, g, b, brightness / whiteness, led_index, r, g, b, brightness / whiteness, ...]
	 */
	setLEDs(data: Uint8Array) {
		return proto.setLEDs(this.address, this.port, data)
	}

	blink() {
		proto.blink(this.address, this.port)
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
		return `ESPClient [${this.id}] ${this.hostname} | ${this.address}:${this.port} | ${
			this.online ? "online" : "offline"
		}`
	}

	toObject(): TESP {
		return {
			id: this.id,
			address: this.address,
			hostname: this.hostname,
			port: this.port,
			brightness: this.brightness,
			num_leds: this.num_leds,
			online: this.online,
			lastPing: this.lastPing,
		}
	}
}
