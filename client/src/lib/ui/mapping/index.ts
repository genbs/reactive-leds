import { TStripe, TStripeMap } from "@shared"

import { mappingUIRender } from "../rendering"
import { mappingEvents } from "./events"
import { TMap } from "./utils"

export function mappingUI(
	canvas: HTMLCanvasElement,
	map: TMap,
	stripes: TStripe[],
	updateStripe: (stripe: TStripe) => void
) {
	const ctx = canvas.getContext("2d")
	if (!ctx) return () => {}

	const rect = canvas.getBoundingClientRect()
	const events = mappingEvents(rect, map, stripes, (map: TStripeMap, stripe: TStripe) => {
		updateStripe({ ...stripe, map })
	})

	let rid = 0

	canvas.addEventListener("mousedown", events.onMouseDown)
	canvas.addEventListener("mousemove", events.onMouseMove)
	canvas.addEventListener("mouseup", events.onMouseUp)
	canvas.addEventListener("click", events.onClick)

	rid = requestAnimationFrame(() => mappingUIRender(ctx, map, stripes))

	return () => {
		cancelAnimationFrame(rid)

		canvas.removeEventListener("mousedown", events.onMouseDown)
		canvas.removeEventListener("mousemove", events.onMouseMove)
		canvas.removeEventListener("mouseup", events.onMouseUp)
	}
}
