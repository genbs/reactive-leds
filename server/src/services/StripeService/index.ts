import ConfigService from "@services/Config"
import ESPService from "@services/ESPService"
import { ESPClient } from "@services/ESPService/ESPClient"
import { EventEmitter, logger, TStripe } from "@shared"
import Stripe from "./Stripe"

export type StripeServiceEvents = {
	onUpdate: (stripes: Stripe[]) => void
}

export default class StripeService extends EventEmitter<StripeServiceEvents> {
	public espService: ESPService

	public stripes: Stripe[] = []

	private config: ConfigService

	constructor(config: ConfigService) {
		super()

		this.config = config
		this.espService = new ESPService()

		this.espService.on("espConnect", client => {
			this.add({
				device: client,
			})
		})
	}

	start() {
		this.espService.start()

		this.load()

		this.tick()
	}

	tick() {
		// this.stripes.forEach(stripe => {
		// 	stripe.tick()
		// })
		// setTimeout(() => this.tick(), 1000 / 60)
	}

	byID(id: ESPClient["id"]) {
		return this.stripes.find(stripe => stripe.device.id === id)
	}

	byIP(ip: ESPClient["address"]) {
		return this.stripes.find(stripe => stripe.device.address === ip)
	}

	add(stripe: Partial<TStripe> & { device: ESPClient }) {
		if (!this.stripes.find(s => s.device.address === stripe.device.address)) {
			const device = this.espService.add(stripe.device)
			const newStripe = new Stripe(device, stripe)

			this.stripes.push(newStripe)

			newStripe.on("onUpdate", () => {
				this.config.update({ stripes: this.stripes.map(s => s.toJSON()) })
				this.emit("onUpdate", this.stripes)
			})
		} else {
			const _stripe = this.byIP(stripe.device.address)
			_stripe.update(stripe)
		}
	}

	delete(ip: ESPClient["address"]) {
		const stripe = this.byIP(ip)

		if (stripe) {
			stripe.device.destroy()
			this.stripes = this.stripes.filter(s => s !== stripe)
			this.config.update({ stripes: this.stripes.map(s => s.toJSON()) })
			this.emit("onUpdate", this.stripes)
		}
	}

	load() {
		let loaded = 0
		const stripes = this.config.get().stripes

		stripes.forEach((JSONStripe: TStripe) => {
			this.add(JSONStripe as TStripe & { device: ESPClient })

			loaded++
		})

		logger.info(`${loaded} Stripes loaded.`)
	}
}
