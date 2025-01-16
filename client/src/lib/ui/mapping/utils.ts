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
 *
 * @param data Uint8Array (image)
 * @param dataSize [number, number] image size
 * @param mapGrid [number, number] pixelation
 * @param stripe TStripe
 *
 * @returns {pixels, width, height}
 */
export function mapStripeOnData(
	data: Uint8Array | Uint8ClampedArray | ImageBitmap,
	dataSize: [number, number],
	mapGrid: [number, number],
	stripe: TStripe
): { pixels: Uint8Array; width: number; height: number } {
	const [imgWidth, imgHeight] = dataSize
	const [cells, rows] = mapGrid
	const { x1, y1, x2, y2 } = stripe.map

	const cellCountX = x2 - x1
	const cellCountY = y2 - y1

	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	const outWidth = cellCountX
	const outHeight = cellCountY

	const outSize = outWidth * outHeight * 4
	const output = new Uint8Array(outSize)

	const outWidth4 = outWidth * 4

	let py = 0
	for (let cy = y1; cy < y2; cy++) {
		const pyOffset = py * outWidth4
		const centerY = ((cy + 0.5) * cellHeight) | 0

		let px = 0
		for (let cx = x1; cx < x2; cx++) {
			const centerX = ((cx + 0.5) * cellWidth) | 0

			const srcIndex = (centerY * imgWidth + centerX) * 4
			let dstIndex = pyOffset + px * 4

			// if (
			// 	stripe.map.orientation === EStripeOrientation.HorizontalReverse ||
			// 	stripe.map.orientation === EStripeOrientation.VerticalReverse
			// ) {
			// 	dstIndex = outSize - dstIndex - 4
			// }

			output[dstIndex] = data[srcIndex]
			output[dstIndex + 1] = data[srcIndex + 1]
			output[dstIndex + 2] = data[srcIndex + 2]
			output[dstIndex + 3] = data[srcIndex + 3]

			px++
		}
		py++
	}

	return {
		pixels: output,
		width: outWidth,
		height: outHeight,
	}
}

export function isInsideStripe(cell: number, row: number, stripe: TStripe) {
	if (cell >= stripe.map.x1 && cell <= stripe.map.x2 && row >= stripe.map.y1 && row <= stripe.map.y2) {
		return true
	}

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
