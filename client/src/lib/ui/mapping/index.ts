import { TConfig, TStripe, TStripeMap } from "@shared"

import { mappingUIRender } from "../rendering"
import { mappingEvents } from "./events"

export function mappingUI(canvas: HTMLCanvasElement, config: TConfig, updateStripe: (stripe: TStripe) => void) {
	const ctx = canvas.getContext("2d")
	if (!ctx) return () => {}

	const unbind = mappingEvents(canvas, config, (map: TStripeMap, stripe: TStripe) => {
		updateStripe({ ...stripe, map })
	})

	mappingUIRender(ctx, config)

	return () => {
		unbind()
	}
}
