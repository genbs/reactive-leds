/**
 * Utility functions for mapping pixels to LEDs
 */

type WhiteChannel = number | boolean | ((r: number, g: number, b: number) => number)
type Polygon = [number, number, number, number, number, number, number, number]

/** Linear interpolation between two points — used for bilinear quad mapping */
function step(t: number, xStart: number, yStart: number, xEnd: number, yEnd: number): [number, number] {
	const x = (1 - t) * xStart + t * xEnd
	const y = (1 - t) * yStart + t * yEnd
	return [x, y]
}

/**
 * Core sampler shared by every mapping strategy.
 *
 * For each LED `i`, `uvAt(i)` returns its fractional position `[u, v]` (0–1)
 * inside the polygon; this reads the source pixel under that point (via bilinear
 * interpolation of the quad) and writes [index, r, g, b, w] into `output`. The
 * strategy decides the wiring; this function knows nothing about it.
 */
function sampleLEDs(
	pixels: Uint8Array,
	pixelsSize: [number, number],
	grid: [number, number],
	polygon: Polygon,
	steps: number,
	wa: WhiteChannel,
	output: Uint8Array,
	uvAt: (i: number) => [number, number]
): Uint8Array {
	const [imgWidth, imgHeight] = pixelsSize
	const [cells, rows] = grid

	// Vertices in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	// Physical size of one grid cell in pixels
	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	for (let i = 0; i < steps; i++) {
		const [u, v] = uvAt(i)

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
					? wa(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
					: wa === true
						? pixels[srcIndex + 3] // source alpha
						: 0
	}

	return output
}

/**
 * Maps pixels from a source image to a LED strip arranged in a 2D serpentine grid.
 *
 * The strip is treated as a grid of `ledCols x ledRows` LEDs, where the number of
 * columns and rows is derived from the physical aspect ratio of the polygon.
 * Odd rows are wired right-to-left (serpentine), matching the physical layout of LED panels.
 *
 * Use this when the strip physically snakes back and forth to fill an area. For a
 * straight run of LEDs (a single line), use {@link sampleStrip} instead.
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
export function sampleMatrix(
	pixels: Uint8Array,
	pixelsSize: [number, number],
	grid: [number, number],
	polygon: Polygon,
	steps: number,
	wa: WhiteChannel = 0,
	output = new Uint8Array(steps * 5)
): Uint8Array {
	const [imgWidth, imgHeight] = pixelsSize
	const [cells, rows] = grid
	const [x0, y0, x1, , , , , y3] = polygon

	// Derive the 2D LED grid dimensions from the physical aspect ratio of the polygon.
	// Using pixel coordinates (not grid coords) ensures correct proportions
	// when cells are not square.
	const physicalWidth = (x1 - x0) * (imgWidth / cells)
	const physicalHeight = (y3 - y0) * (imgHeight / rows)
	const aspectRatio = physicalHeight > 0 ? physicalWidth / physicalHeight : 1
	const ledCols = Math.max(1, Math.round(Math.sqrt(steps * aspectRatio)))
	// ceil ensures v never exceeds 1.0 even when steps is not divisible by ledCols
	const ledRows = Math.ceil(steps / ledCols)

	return sampleLEDs(pixels, pixelsSize, grid, polygon, steps, wa, output, i => {
		const ledRow = Math.floor(i / ledCols)
		let ledCol = i % ledCols
		// Serpentine: reverse column direction on odd rows to match physical wiring
		if (ledRow % 2 === 1) ledCol = ledCols - 1 - ledCol
		return [(ledCol + 0.5) / ledCols, (ledRow + 0.5) / ledRows]
	})
}

/**
 * Maps pixels onto a straight run of LEDs — a single line from the polygon's
 * start edge (TL→TR) to its end edge (BL→BR), sampled along the centerline.
 *
 * This is the no-serpentine counterpart of {@link sampleMatrix}: the strip is always
 * one LED wide, so the result is independent of the polygon's aspect ratio (and of
 * the canvas resolution). Use it whenever the LEDs form a single line rather than a
 * back-and-forth panel.
 *
 * Parameters are identical to {@link sampleMatrix}.
 */
export function sampleStrip(
	pixels: Uint8Array,
	pixelsSize: [number, number],
	grid: [number, number],
	polygon: Polygon,
	steps: number,
	wa: WhiteChannel = 0,
	output = new Uint8Array(steps * 5)
): Uint8Array {
	return sampleLEDs(pixels, pixelsSize, grid, polygon, steps, wa, output, i => [0.5, (i + 0.5) / steps])
}
