import { ESPClient } from "@services/ESPService/ESPClient"
import { EStripeOrientation, EventEmitter, TColor, TStripe, TStripeMap } from "@shared"

type StripeServiceEvents = {
	onUpdate: (stripe: Stripe) => void
}

const default_map: TStripeMap = {
	x: 0,
	y: 0,
	scale: [1, 1],
	visible: true,
	orientation: EStripeOrientation.VerticalReverse,
}

export default class Stripe extends EventEmitter<StripeServiceEvents> implements TStripe {
	name: string
	colorHex: string
	map: TStripeMap
	color: TColor
	device: ESPClient

	queue: Uint8Array = new Uint8Array(0)
	hasUpdate: boolean = false

	/**
	 * The current data of the LEDs.
	 * [r, g, b, brightness / whiteness, r, g, b, brightness / whiteness, ...]
	 *
	 * @type {Uint8Array}
	 */
	leds: Uint8Array

	lastSend: number = 0

	constructor(device: ESPClient, options: Partial<Omit<TStripe, "leds">>) {
		super()

		this.device = device

		this.name = options.name
		this.color = options.color
		this.map = { ...default_map, ...(options.map || {}) }

		this.leds = new Uint8Array(device.num_leds * 4)

		this.device.on("onConnect", () => {
			const new_leds = new Uint8Array(this.device.num_leds * 4)
			new_leds.set(this.leds.subarray(0, this.device.num_leds * 4))
			this.leds = new_leds

			this.emit("onUpdate", this)
		})
		this.device.on("onDisconnect", () => this.emit("onUpdate", this))
	}

	async update(data: Partial<TStripe>) {
		this.name = data.name || this.name
		this.color = data.color || this.color
		this.leds =
			this.device.num_leds !== data.device?.num_leds ? this.leds.slice(0, data.device.num_leds * 4) : this.leds
		this.map = { ...this.map, ...data.map }
		this.queue = new Uint8Array(this.device.num_leds * 5)

		if (data.device) {
			if (await this.device.setConfig(data.device)) {
				this.emit("onUpdate", this)
				return true
			} else {
				return false
			}
		}

		this.emit("onUpdate", this)
		return Promise.resolve()
	}

	destroy() {
		this.device.destroy()
	}

	updateLEDs(data: Uint8Array) {
		this.queue = data

		this.hasUpdate = true
	}

	tick() {
		if (!this.hasUpdate) return

		const data = this.queue

		for (let i = 0; i < data.length; i += 5) {
			const led_index = data[i] * 4

			this.leds[led_index] = data[i + 1]
			this.leds[led_index + 1] = data[i + 2]
			this.leds[led_index + 2] = data[i + 3]
			this.leds[led_index + 3] = data[i + 4]
		}

		this.device.setLEDs(data)

		this.hasUpdate = false

		this.emit("onUpdate", this)
	}

	toJSON(): TStripe {
		return {
			name: this.name,
			color: this.color,
			device: this.device.toObject(),
			leds: this.leds,
			map: this.map,
		}
	}

	toString(): string {
		return JSON.stringify(this.toJSON())
	}
}
