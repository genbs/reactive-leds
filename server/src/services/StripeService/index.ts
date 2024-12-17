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
			this.add(client)
		})
	}

	start() {
		this.espService.start()

		this.load()
	}

	byID(id: ESPClient["id"]) {
		return this.stripes.find(stripe => stripe.device.id === id)
	}

	add(device: ESPClient) {
		if (
			!this.stripes.find(
				stripe =>
					stripe.device.address === device.address && device.lastPing - Date.now() < ESPClient.MAX_LAST_PING_TIME
			)
		) {
			const stripe = new Stripe(device, {
				name: device.hostname,
				color: [0, 0, 0, 0],
				colorHex: "#000000",
				device,
			})

			this.stripes.push(stripe)
			stripe.on("onUpdate", stripe => this.emit("onUpdate", stripe))
			this.save()
		}
	}

	load() {
		const data = fs.readFileSync("stripes.json", "utf8") || "[]"
		const stripes = JSON.parse(data)
		let loaded = 0

		stripes.forEach((JSONStripe: TStripe) => {
			if (JSONStripe.device.lastPing - Date.now() > ESPClient.MAX_LAST_PING_TIME) return

			const device = this.espService.add(JSONStripe.device.address, JSONStripe.device.port, JSONStripe.device.hostname)
			this.add(device)

			loaded++
		})

		logger.info("Loaded stripes", loaded)
	}

	save() {
		fs.writeFileSync("stripes.json", JSON.stringify(this.stripes.map(stripe => stripe.toJSON())))

		logger.info("Saved stripes")
	}
}
