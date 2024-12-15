import { Color, ESP } from "@shared"
import { colorToHex } from "./utils"

export type Stripe = ESP & {
	color: Color
	colorHex: string

	leds: Uint8Array // [r, g, b, w, r, g, b, w, ...]
	code?: string
	orientation?: number
}

export function espToStripe(esp: ESP): Stripe {
	return {
		...esp,
		leds: new Uint8Array(esp.num_leds * 4),
		color: esp.color || [60, 60, 60, 255],
		colorHex: colorToHex(esp.color || [60, 60, 60, 255]),
	}
}
