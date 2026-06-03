/**
 * Utility functions for mapping pixels to LEDs
 */

/** Linear interpolation between two points — used for bilinear quad mapping */
function step(t: number, xStart: number, yStart: number, xEnd: number, yEnd: number): [number, number] {
	const x = (1 - t) * xStart + t * xEnd
	const y = (1 - t) * yStart + t * yEnd
	return [x, y]
}

/**
 * Maps pixels from a source image to a LED strip arranged in a 2D serpentine grid.
 *
 * The strip is treated as a grid of `ledCols x ledRows` LEDs, where the number of
 * columns and rows is derived from the physical aspect ratio of the polygon.
 * Odd rows are wired right-to-left (serpentine), matching the physical layout of LED panels.
 *
 * The polygon maps a region of the source grid to the LED layout using bilinear
 * interpolation, so it works correctly even for skewed or rotated quadrilaterals.
 *
 * @param pixels source pixels (RGBA, 4 bytes per pixel)
 * @param pixelsSize source image size [width, height] in pixels
 * @param grid how the source image is divided [cols, rows] — defines cell size
 * @param polygon region of the grid to map onto the LEDs [TL, TR, BR, BL] as (x0,y0, x1,y1, x2,y2, x3,y3) in grid coordinates
 * @param steps number of LEDs
 * @param wa white/brightness channel: fixed number, true = use source alpha, or a function(r,g,b) => w
 * @param output output buffer [led_index, r, g, b, w, ...] — allocated automatically if not provided
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

	// Vertices in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	// Physical size of one grid cell in pixels
	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	// Derive the 2D LED grid dimensions from the physical aspect ratio of the polygon.
	// Using pixel coordinates (not grid coords) ensures correct proportions
	// when cells are not square.
	const physicalWidth = (x1 - x0) * cellWidth
	const physicalHeight = (y3 - y0) * cellHeight
	const aspectRatio = physicalHeight > 0 ? physicalWidth / physicalHeight : 1
	const ledCols = Math.max(1, Math.round(Math.sqrt(steps * aspectRatio)))
	// ceil ensures v never exceeds 1.0 even when steps is not divisible by ledCols
	const ledRows = Math.ceil(steps / ledCols)

	for (let i = 0; i < steps; i++) {
		let ledRow = Math.floor(i / ledCols)
		let ledCol = i % ledCols

		// Serpentine: reverse column direction on odd rows to match physical wiring
		if (ledRow % 2 === 1) {
			ledCol = ledCols - 1 - ledCol
		}

		// Fractional position of the LED center within the polygon (0.0 – 1.0)
		const u = (ledCol + 0.5) / ledCols
		const v = (ledRow + 0.5) / ledRows

		// Bilinear interpolation: find the point (gridX, gridY) inside the quadrilateral
		// by interpolating along the top and bottom edges, then vertically between them
		const [topX, topY] = step(u, x0, y0, x1, y1)
		const [botX, botY] = step(u, x3, y3, x2, y2)
		const [gridX, gridY] = step(v, topX, topY, botX, botY)

		// Convert grid coordinates to source image pixel coordinates, clamped to bounds
		let sx = Math.floor(gridX * cellWidth)
		let sy = Math.floor(gridY * cellHeight)
		if (sx < 0) sx = 0
		else if (sx >= imgWidth) sx = imgWidth - 1
		if (sy < 0) sy = 0
		else if (sy >= imgHeight) sy = imgHeight - 1

		const srcIndex = (sy * imgWidth + sx) << 2 // 4 bytes per pixel (RGBA)
		const dstIndex = i * 5                      // 5 bytes per LED (index, R, G, B, W)

		output[dstIndex] = i
		output[dstIndex + 1] = pixels[srcIndex]
		output[dstIndex + 2] = pixels[srcIndex + 1]
		output[dstIndex + 3] = pixels[srcIndex + 2]
		output[dstIndex + 4] =
			typeof wa === "number"
				? wa
				: typeof wa === "function"
					? (wa as Function)(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
					: wa === true
						? pixels[srcIndex + 3] // source alpha
						: 0
	}

	return output
}
