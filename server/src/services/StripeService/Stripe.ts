import { ESPClient } from "@services/ESPService/ESPClient"
import { EventEmitter, TColor, TStripe } from "@shared"

type StripeServiceEvents = {
	onUpdate: (stripe: Stripe) => void
}

export default class Stripe extends EventEmitter<StripeServiceEvents> implements TStripe {
	name: string
	colorHex: string
	orientation?: number
	color: TColor
	device: ESPClient

	/**
	 * The current data of the LEDs.
	 * [r, g, b, brightness / whiteness, r, g, b, brightness / whiteness, ...]
	 *
	 * @type {Uint8Array}
	 */
	leds: Uint8Array

	constructor(device: ESPClient, options: Omit<TStripe, "leds">) {
		super()

		this.device = device

		this.name = options.name
		this.color = options.color
		this.colorHex = options.colorHex
		this.orientation = options.orientation
		this.leds = new Uint8Array(device.num_leds * 4)

		this.device.on("onConnect", () => {
			const num_leds = this.device.num_leds
			const new_leds = new Uint8Array(num_leds * 4)
			new_leds.set(this.leds)
			this.leds = new_leds
			this.emit("onUpdate", this)
		})
		this.device.on("onDisconnect", () => this.emit("onUpdate", this))
	}

	async update(data: Partial<TStripe>) {
		this.name = data.name || this.name
		this.color = data.color || this.color
		this.colorHex = data.colorHex || this.colorHex
		this.leds =
			this.device.num_leds !== data.device?.num_leds ? this.leds.slice(0, data.device.num_leds * 4) : this.leds
		this.orientation = data.orientation || this.orientation
		if (data.device && (await this.device.setConfig(data.device))) {
			this.emit("onUpdate", this)
			return true
		}

		this.emit("onUpdate", this)
		return Promise.resolve()
	}

	updateLEDs(data: Uint8Array) {
		for (let i = 0; i < data.length; i += 5) {
			const led_index = data[i] * 4

			this.leds[led_index] = data[i + 1]
			this.leds[led_index + 1] = data[i + 2]
			this.leds[led_index + 2] = data[i + 3]
			this.leds[led_index + 3] = data[i + 4]
		}

		this.device.setLEDs(data)
	}

	toJSON(): TStripe {
		return {
			name: this.name,
			color: this.color,
			colorHex: this.colorHex,
			orientation: this.orientation,
			device: this.device.toObject(),
			leds: this.leds,
		}
	}

	toString(): string {
		return JSON.stringify(this.toJSON())
	}
}
