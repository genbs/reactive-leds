import ESPService from "@services/ESPService"
import { ESPClient } from "@services/ESPService/ESPClient"
import { EventEmitter, logger, TStripe } from "@shared"
import fs from "fs"
import Stripe from "./Stripe"

export type StripeServiceEvents = {
	onUpdate: (stripe: Stripe) => void
}

export default class StripeService extends EventEmitter<StripeServiceEvents> {
	public espService: ESPService

	public stripes: Stripe[] = []

	constructor() {
		super()

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
	}

	byID(id: ESPClient["id"]) {
		return this.stripes.find(stripe => stripe.device.id === id)
	}

	byIP(ip: ESPClient["address"]) {
		return this.stripes.find(stripe => stripe.device.address === ip)
	}

	add(stripe: Partial<TStripe> & { device: ESPClient }) {
		if (
			!this.stripes.find(
				s =>
					s.device.address === stripe.device.address &&
					stripe.device.lastPing - Date.now() < ESPClient.MAX_LAST_PING_TIME
			)
		) {
			const device = this.espService.add(stripe.device)
			const newStripe = new Stripe(device, stripe)

			this.stripes.push(newStripe)
			newStripe.on("onUpdate", stripe => this.emit("onUpdate", stripe))
		}
	}

	load() {
		if (!fs.existsSync("stripes.json")) {
			fs.writeFileSync("stripes.json", "[]")
		}

		const data = fs.readFileSync("stripes.json", "utf8") || "[]"
		const stripes = JSON.parse(data)
		let loaded = 0

		stripes.forEach((JSONStripe: TStripe) => {
			// if (JSONStripe.device.lastPing - Date.now() > ESPClient.MAX_LAST_PING_TIME) return

			this.add(JSONStripe as TStripe & { device: ESPClient })

			loaded++
		})

		logger.info(`${loaded} Stripes loaded.`)
	}

	save() {
		fs.writeFileSync(
			"stripes.json",
			JSON.stringify(
				this.stripes.map(stripe => {
					const { leds, ...rest } = stripe.toJSON()
					return rest
				}),
				null,
				4
			)
		)

		logger.info("Stripes saved.")
	}
}
