import { TStripe } from "@shared"

export type TMap = {
	gridSize: [number, number]
}

/**
 * return oriented and scaled bounding
 * @param stripe TStripe
 */
export function stripeToRect(stripe: TStripe) {
	const { x1, y1, x2, y2 } = stripe.map

	// calculate bounding rect
	let x, y, width, height

	x = Math.min(x1, x2)
	y = Math.min(y1, y2)
	width = Math.abs(x1 - x2)
	height = Math.abs(y1 - y2)

	return { x, y, width, height }
}

/**
 * Mappa i LED di una striscia su un quadrilatero definito da (x0,y0..x3,y3).
 * Per ogni LED i, prende come "centro" il punto mediano del trapezio [offset1..offset2].
 * Restituisce l'array (o number[]) con i valori RGBA dei LED aggiornati.
 */
export function mapStripeOnData(
	data: Uint8Array | Uint8ClampedArray,
	dataSize: [number, number],
	mapGrid: [number, number],
	stripe: TStripe
): Uint8Array | number[] {
	const [imgWidth, imgHeight] = dataSize
	const [cells, rows] = mapGrid

	const { x0, y0, x1, y1, x2, y2, x3, y3 } = stripe.map

	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	const output = stripe.leds
	const steps = stripe.num_leds

	for (let i = 0; i < steps; i++) {
		const offset1 = i / steps
		const offset2 = (i + 1) / steps
		const [px0, py0] = step(offset1, x0, y0, x3, y3)
		const [px1, py1] = step(offset2, x1, y1, x2, y2)

		const px = px0 + (px1 - px0) / 2
		const py = py0 + (py1 - py0) / 2

		let sx = Math.round(px * cellWidth)
		let sy = Math.round(py * cellHeight)

		if (sx < 0) sx = 0
		if (sx >= imgWidth) sx = imgWidth - 1
		if (sy < 0) sy = 0
		if (sy >= imgHeight) sy = imgHeight - 1

		const srcIndex = (sy * imgWidth + sx) * 4

		const dstIndex = i * 4

		output[dstIndex] = data[srcIndex]
		output[dstIndex + 1] = data[srcIndex + 1]
		output[dstIndex + 2] = data[srcIndex + 2]
		output[dstIndex + 3] = data[srcIndex + 3]
	}

	return output
}

export function step(offset, x0, y0, x1, y1) {
	const x = x0 + offset * (x1 - x0)
	const y = y0 + offset * (y1 - y0)
	return [x, y]
}

export function isInsideStripe(cell: number, row: number, stripe: TStripe) {
	const map = stripe.map

	const { x0, y0, x1, y1, x2, y2, x3, y3 } = map

	const x = cell
	const y = row

	const a = (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0)
	const b = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1)
	const c = (x3 - x2) * (y - y2) - (x - x2) * (y3 - y2)
	const d = (x0 - x3) * (y - y3) - (x - x3) * (y0 - y3)

	if (a >= 0 && b >= 0 && c >= 0 && d >= 0) return true

	return false
}

// export function updateStripeMap(grid: TConfig["grid"], stripeMap: TStripeMap, length: number) {
// 	const [cols, rows] = grid

// 	const horizontal =
// 		stripeMap.orientation === EStripeOrientation.Horizontal ||
// 		stripeMap.orientation === EStripeOrientation.HorizontalReverse
// 	const vertical =
// 		stripeMap.orientation === EStripeOrientation.Vertical ||
// 		stripeMap.orientation === EStripeOrientation.VerticalReverse

// 	const minX = stripeMap.orientation === EStripeOrientation.HorizontalReverse ? length : 0
// 	const maxX = stripeMap.orientation === EStripeOrientation.Horizontal ? cols - length : vertical ? cols - 1 : cols

// 	const minY = stripeMap.orientation === EStripeOrientation.VerticalReverse ? length : 0
// 	const maxY = stripeMap.orientation === EStripeOrientation.Vertical ? rows - length : horizontal ? rows - 1 : rows

// 	const newX = Math.max(minX, Math.min(stripeMap.x, maxX))
// 	const newY = Math.max(minY, Math.min(stripeMap.y, maxY))

// 	return {
// 		...stripeMap,
// 		x: newX,
// 		y: newY,
// 	}
// }
