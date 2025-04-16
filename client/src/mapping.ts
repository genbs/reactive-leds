/**
 * Utility functions for mapping pixels to LEDs
 */

function step(t: number, xStart: number, yStart: number, xEnd: number, yEnd: number): [number, number] {
	const x = (1 - t) * xStart + t * xEnd
	const y = (1 - t) * yStart + t * yEnd
	return [x, y]
}

/**
 *
 * @param pixels source pixels data
 * @param pixelsSize source pixels image size [width, height]
 * @param grid destination grid size [cells, rows]
 * @param polygon mapping (x0, y0, x1, y1, x2, y2, x3, y3) on destination grid
 * @param steps number of LEDs to map
 * @param w if w is number is white/brightness mapping function or value, if boolean is alpha value
 * @param output output buffer, if not provided a new one will be created
 * @returns
 */
// export function mapPixels(
// 	pixels: Uint8Array,
// 	pixelsSize: [number, number],
// 	grid: [number, number],
// 	polygon: [number, number, number, number, number, number, number, number],
// 	steps: number,
// 	wa: number | boolean | ((r: number, g: number, b: number) => number) = 0,
// 	output = new Uint8Array(steps * 5)
// ): Uint8Array {
// 	const [imgWidth, imgHeight] = pixelsSize
// 	const [cells, rows] = grid

// 	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

// 	const cellWidth = imgWidth / cells
// 	const cellHeight = imgHeight / rows

// 	const invSteps = 1 / steps

// 	for (let i = 0; i < steps; i++) {
// 		const offset1 = i * invSteps
// 		const offset2 = (i + 1) * invSteps

// 		// linear interpolation
// 		const [px0, py0] = step(offset1, x0, y0, x3, y3)
// 		const [px1, py1] = step(offset2, x1, y1, x2, y2)

// 		const px = px0 + (px1 - px0) * 0.5
// 		const py = py0 + (py1 - py0) * 0.5

// 		let sx = Math.round(px * cellWidth)
// 		let sy = Math.round(py * cellHeight)

// 		if (sx < 0) sx = 0
// 		else if (sx >= imgWidth) sx = imgWidth - 1
// 		if (sy < 0) sy = 0
// 		else if (sy >= imgHeight) sy = imgHeight - 1

// 		const srcIndex = (sy * imgWidth + sx) << 2
// 		const dstIndex = i * 5

// 		output[dstIndex] = i
// 		output[dstIndex + 1] = pixels[srcIndex]
// 		output[dstIndex + 2] = pixels[srcIndex + 1]
// 		output[dstIndex + 3] = pixels[srcIndex + 2]
// 		output[dstIndex + 4] =
// 			typeof wa === "number"
// 				? wa
// 				: typeof wa === "function"
// 				? (wa as Function)(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
// 				: wa === true
// 				? pixels[srcIndex + 3]
// 				: 0
// 	}
// 	return output
// }
/**
 *
 * @param pixels source pixels data
 * @param pixelsSize source pixels image size [width, height]
 * @param grid destination grid size [cells, rows]
 * @param polygon mapping (x0, y0, x1, y1, x2, y2, x3, y3) on destination grid [TL, TR, BR, BL]
 * @param steps number of LEDs to map
 * @param wa if w is number is white/brightness mapping function or value, if boolean is alpha value
 * @param output output buffer, if not provided a new one will be created
 * @returns
 */
export function mapPixels(
	pixels: Uint8Array,
	pixelsSize: [number, number],
	grid: [number, number],
	polygon: [number, number, number, number, number, number, number, number],
	steps: number,
	wa: number | boolean | ((r: number, g: number, b: number) => number) = 0,
	output = new Uint8Array(steps * 5)
): Uint8Array {
	const [imgWidth, imgHeight] = pixelsSize
	const [cells, rows] = grid

	// Assume polygon vertices are in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	for (let i = 0; i < steps; i++) {
		// Calculate parameter 't' for the center of the i-th segment
		// This represents the fractional distance along the shape.
		const t = (i + 0.5) / steps

		const [ptx, pty] = step(t, x0, y0, x1, y1)
		const [pbx, pby] = step(t, x3, y3, x2, y2)

		const px = (ptx + pbx) * 0.5
		const py = (pty + pby) * 0.5

		// Convert grid coordinates (px, py) to source image pixel coordinates (sx, sy)
		let sx = Math.floor(px * cellWidth)
		let sy = Math.floor(py * cellHeight)

		// Clamp coordinates to valid image bounds
		if (sx < 0) sx = 0
		else if (sx >= imgWidth) sx = imgWidth - 1
		if (sy < 0) sy = 0
		else if (sy >= imgHeight) sy = imgHeight - 1 // Important for 1-pixel high images!

		// Calculate source pixel index (4 bytes per pixel: R, G, B, A)
		const srcIndex = (sy * imgWidth + sx) << 2 // << 2 is faster multiply by 4
		// Calculate destination index in the output buffer (5 bytes per LED: index, R, G, B, W)
		const dstIndex = i * 5

		// Assign LED data to the output buffer
		output[dstIndex] = i // LED index
		output[dstIndex + 1] = pixels[srcIndex] // Red
		output[dstIndex + 2] = pixels[srcIndex + 1] // Green
		output[dstIndex + 3] = pixels[srcIndex + 2] // Blue

		// Calculate and assign the White/Brightness value based on the 'wa' parameter
		output[dstIndex + 4] =
			typeof wa === "number"
				? wa // Use fixed number if 'wa' is a number
				: typeof wa === "function"
				? (wa as Function)(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2]) // Use function if 'wa' is a function
				: wa === true
				? pixels[srcIndex + 3] // Use source Alpha if 'wa' is true
				: 0 // Default to 0 otherwise
	}
	return output
}
