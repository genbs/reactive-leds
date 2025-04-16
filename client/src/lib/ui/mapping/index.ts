import { TConfig, TStripe, TStripeMap } from "@shared"

import { mappingUIRender } from "../rendering"

export function mappingUI(canvas: HTMLCanvasElement, config: TConfig, updateStripe: (stripe: TStripe) => void) {
	const ctx = canvas.getContext("2d")
	if (!ctx) return () => {}

	return mappingUIRender(ctx, config, (map: TStripeMap, stripe: TStripe) => {
		updateStripe({ ...stripe, map })
	})
}
