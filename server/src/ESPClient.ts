import proto from "@protocol"
import { TESP } from "@shared"
import { ProtocolBoardConfig } from "src/protocol/types"

export class ESPClient implements TESP {
	public address: string
	public online = false
	public port: number
	public id: number
	public num_leds: number
	public hostname: string
	public brightness: number
	public lastPing: number = 0

	constructor(device: Partial<TESP>) {
		this.address = device.address
		this.port = device.port
		this.id = device.id
		this.num_leds = device.num_leds
		this.hostname = device.hostname
		this.brightness = device.brightness

		this.online = false
	}

	async connect(): Promise<boolean> {
		await this.isAlive()

		if (this.online) {
			await this.loadConfig()
		}

		return this.online
	}

	/**
	 * Ping the device to check if it's online.
	 */
	async isAlive() {
		this.online = await this.ping()

		if (this.online) this.lastPing = Date.now()

		setTimeout(() => this.isAlive(), 10000)
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

		if (
			config.brightness === this.brightness &&
			config.num_leds === this.num_leds &&
			config.port === this.port &&
			config.id === this.id &&
			config.hostname === this.hostname
		)
			return true

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
		this.online = false
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
