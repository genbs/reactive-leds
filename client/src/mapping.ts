/**
 * Canvas-to-LED sampling.
 */

type WhiteChannel = number | boolean | ((r: number, g: number, b: number) => number)
type Polygon = [number, number, number, number, number, number, number, number]
type Point = [number, number]

/** Linear interpolation between two points — used for bilinear quad mapping */
function step(t: number, xStart: number, yStart: number, xEnd: number, yEnd: number, out: Point): void {
	out[0] = (1 - t) * xStart + t * xEnd
	out[1] = (1 - t) * yStart + t * yEnd
}

/**
 * Samples a canvas frame onto a straight LED strip.
 *
 * The strip is a single line running from the polygon's start edge (TL→TR) to
 * its end edge (BL→BR), sampled along the centerline: for each LED `i` the
 * source pixel under its point is read via bilinear interpolation of the
 * quadrilateral, and `[index, r, g, b, w]` is written into `output`. The
 * polygon's width doesn't matter — only the centerline is read. To run the
 * strip horizontally, rotate the polygon (start edge on the left). Skewed,
 * rotated or perspective-distorted polygons all work — the sampling follows
 * the quad.
 *
 * @param pixels source pixels (RGBA, 4 bytes per pixel)
 * @param pixelsSize source image size [width, height] in pixels
 * @param grid how the source image is divided [cols, rows] — defines cell size
 * @param polygon region of the grid to map onto the LEDs [TL, TR, BR, BL] as (x0,y0, x1,y1, x2,y2, x3,y3) in grid coordinates
 * @param steps number of LEDs
 * @param wa white/brightness channel: fixed number, true = use source alpha, or a function(r,g,b) => w
 * @param output output buffer [led_index, r, g, b, w, ...] — allocated automatically if not provided
 */
export function sample(
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

	// Vertices in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	// Physical size of one grid cell in pixels
	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	// Midpoints of the start (TL-TR) and end (BL-BR) edges: the centerline
	const top: Point = [0, 0]
	const bot: Point = [0, 0]
	const point: Point = [0, 0]
	step(0.5, x0, y0, x1, y1, top)
	step(0.5, x3, y3, x2, y2, bot)

	const fixedW = typeof wa === "number" ? wa : 0
	const whiteFn = typeof wa === "function" ? wa : null
	const useAlpha = wa === true

	for (let i = 0; i < steps; i++) {
		step((i + 0.5) / steps, top[0], top[1], bot[0], bot[1], point)

		// Convert grid coordinates to source image pixel coordinates, clamped to bounds
		let sx = Math.floor(point[0] * cellWidth)
		let sy = Math.floor(point[1] * cellHeight)
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
			whiteFn
				? whiteFn(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
				: useAlpha
					? pixels[srcIndex + 3] // source alpha
					: fixedW
	}

	return output
}
