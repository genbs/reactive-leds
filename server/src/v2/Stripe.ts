import { EStripeOrientation, TColor, TStripe, TStripeMap } from "@shared"
import { ESPClient } from "./ESPClient"

const default_map: TStripeMap = {
	x: 0,
	y: 0,
	scale: [1, 1],
	visible: true,
	orientation: EStripeOrientation.VerticalReverse,
}

export class Stripe extends ESPClient implements TStripe {
	name: string
	colorHex: string
	map: TStripeMap
	color: TColor
	leds: Uint8Array // [r, g, b, w, r, g, b, w, ...]

	constructor(options: Partial<TStripe>) {
		super({
			id: options.id,
			hostname: options.hostname,
			port: options.port,
			num_leds: options.num_leds,
			brightness: options.brightness,
			address: options.address,
		})

		this.name = options.name
		this.color = options.color
		this.map = { ...default_map, ...(options.map || {}) }
		this.leds = new Uint8Array(options.num_leds * 4)
	}

	async update(data: Partial<TStripe>) {
		this.name = data.name || this.name
		this.color = data.color || this.color
		this.leds = this.num_leds !== data.num_leds ? this.leds.slice(0, data.num_leds * 4) : this.leds
		this.map = { ...this.map, ...data.map }

		if (
			("id" in data && this.id !== data.id) ||
			("hostname" in data && this.hostname !== data.hostname) ||
			("port" in data && this.port !== data.port) ||
			("num_leds" in data && this.num_leds !== data.num_leds) ||
			("brightness" in data && this.brightness !== data.brightness)
		)
			return await this.setConfig({
				id: this.id,
				hostname: this.hostname,
				port: this.port,
				num_leds: this.num_leds,
				brightness: this.brightness,

				...data,
			})

		return true
	}

	setLEDs(data: Uint8Array /* [r,g,b,r,g,b] */) {
		const count = data.length / 4
		const ledsBuffer = new Uint8Array(count * 5)

		for (let i = 0; i < data.length; i += 5) {
			const led_index = data[i] * 4

			this.leds[led_index] = data[i + 1]
			this.leds[led_index + 1] = data[i + 2]
			this.leds[led_index + 2] = data[i + 3]
			this.leds[led_index + 3] = data[i + 4]

			ledsBuffer[i] = data[i]
			ledsBuffer[i + 1] = data[i + 1]
			ledsBuffer[i + 2] = data[i + 2]
			ledsBuffer[i + 3] = data[i + 3]
			ledsBuffer[i + 4] = data[i + 4]
		}

		return super.setLEDs(ledsBuffer)
	}

	toObject(): TStripe {
		return {
			id: this.id,
			hostname: this.hostname,
			port: this.port,
			num_leds: this.num_leds,
			brightness: this.brightness,
			name: this.name,
			color: this.color,
			map: this.map,
			leds: this.leds,
			address: this.address,
			online: this.online,
			lastPing: this.lastPing,
		}
	}
}
