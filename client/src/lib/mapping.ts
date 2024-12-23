import { EStripeOrientation, TStripe } from "@shared"

/**
 * return oriented and scaled bounding
 * @param stripe TStripe
 */
export function stripeToRect(stripe: TStripe) {
	const [scaleX, scaleY] = stripe.map.scale
	const x = stripe.map.x
	const y = stripe.map.y
	const lengthX = stripe.device.num_leds * scaleX
	const lengthY = stripe.device.num_leds * scaleY

	switch (stripe.map.orientation) {
		case EStripeOrientation.Horizontal:
			return { x1: x, y1: y, x2: x + lengthX, y2: y + scaleY }

		case EStripeOrientation.Vertical:
			return { x1: x, y1: y, x2: x + scaleX, y2: y + lengthY }

		case EStripeOrientation.HorizontalReverse:
			return { x1: x - lengthX, y1: y, x2: x, y2: y + scaleY }

		case EStripeOrientation.VerticalReverse:
			return { x1: x, y1: y - lengthY, x2: x + scaleX, y2: y }
	}
}

/**
 *
 * @param data Uint8Array (image)
 * @param dataSize [number, number] image size
 * @param mpaGrid [number, number] pixelation
 * @param stripe TStripe
 *
 * @returns {pixels, width, height}
 */
export function mapStripeOnData(
	data: Uint8Array,
	dataSize: [number, number],
	mpaGrid: [number, number],
	stripe: TStripe
): { pixels: Uint8Array; width: number; height: number } {
	const [imgWidth, imgHeight] = dataSize
	const [cells, rows] = mpaGrid
	const { x1, y1, x2, y2 } = stripeToRect(stripe)

	const cellCountX = (x2 - x1) / stripe.map.scale[0]
	const cellCountY = (y2 - y1) / stripe.map.scale[1]

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

			if (
				stripe.map.orientation === EStripeOrientation.HorizontalReverse ||
				stripe.map.orientation === EStripeOrientation.VerticalReverse
			) {
				dstIndex = outSize - dstIndex - 4
			}

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
