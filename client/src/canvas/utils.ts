import { EStripeOrientation, TStripe, TStripeMap } from "@shared"

import { stripeToRect, TMap } from "src/lib/worker/mapping"

export function isInsideStripe(cell: number, row: number, stripe: TStripe) {
	const rect = stripeToRect(stripe)

	if (cell >= rect.x1 && cell <= rect.x2 && row >= rect.y1 && row <= rect.y2) {
		return true
	}

	return false
}

export function updateStripeMap(map: TMap, stripeMap: TStripeMap, length: number) {
	const [cols, rows] = map.gridSize

	const horizontal =
		stripeMap.orientation === EStripeOrientation.Horizontal ||
		stripeMap.orientation === EStripeOrientation.HorizontalReverse
	const vertical =
		stripeMap.orientation === EStripeOrientation.Vertical ||
		stripeMap.orientation === EStripeOrientation.VerticalReverse

	const minX = stripeMap.orientation === EStripeOrientation.HorizontalReverse ? length : 0
	const maxX = stripeMap.orientation === EStripeOrientation.Horizontal ? cols - length : vertical ? cols - 1 : cols

	const minY = stripeMap.orientation === EStripeOrientation.VerticalReverse ? length : 0
	const maxY = stripeMap.orientation === EStripeOrientation.Vertical ? rows - length : horizontal ? rows - 1 : rows

	const newX = Math.max(minX, Math.min(stripeMap.x, maxX))
	const newY = Math.max(minY, Math.min(stripeMap.y, maxY))

	return {
		...stripeMap,
		x: newX,
		y: newY,
	}
}
