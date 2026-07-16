/**
 * Canvas-to-LED sampling.
 */

import type { Grid, Pixels, Polygon, WhiteChannel } from "./types"

/**
 * Samples a canvas frame onto a straight LED strip.
 *
 * The strip is a single line running from the polygon's start edge (TL→TR) to
 * its end edge (BL→BR), sampled along the centerline: for each LED `i` the
 * source pixel under its point is read via bilinear interpolation of the
 * quadrilateral, and `[r, g, b, w]` is written into `output`. The
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
 * @param output output buffer [r, g, b, w, ...] — allocated automatically if not provided
 */
export function sample(
	pixels: Pixels,
	pixelsSize: [number, number],
	grid: Grid,
	polygon: Polygon,
	steps: number,
	wa: WhiteChannel = 0,
	output: Uint8Array = new Uint8Array(steps * 4)
): Uint8Array {
	const [imgWidth, imgHeight] = pixelsSize
	const [cells, rows] = grid

	// Vertices in order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
	const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon

	// Physical size of one grid cell in pixels
	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	// Midpoints of the start (TL-TR) and end (BL-BR) edges: the centerline.
	// Scalars keep the hot path allocation-free when an output buffer is reused.
	const topX = (x0 + x1) * 0.5
	const topY = (y0 + y1) * 0.5
	const botX = (x3 + x2) * 0.5
	const botY = (y3 + y2) * 0.5

	const fixedW = typeof wa === "number" ? wa : 0
	const whiteFn = typeof wa === "function" ? wa : null
	const useAlpha = wa === true

	for (let i = 0; i < steps; i++) {
		const t = (i + 0.5) / steps
		const pointX = (1 - t) * topX + t * botX
		const pointY = (1 - t) * topY + t * botY

		// Convert grid coordinates to source image pixel coordinates, clamped to bounds
		let sx = Math.floor(pointX * cellWidth)
		let sy = Math.floor(pointY * cellHeight)
		if (sx < 0) sx = 0
		else if (sx >= imgWidth) sx = imgWidth - 1
		if (sy < 0) sy = 0
		else if (sy >= imgHeight) sy = imgHeight - 1

		const srcIndex = (sy * imgWidth + sx) << 2 // 4 bytes per pixel (RGBA)
		const dstIndex = i * 4                      // 4 bytes per LED (R, G, B, W)

		output[dstIndex] = pixels[srcIndex]
		output[dstIndex + 1] = pixels[srcIndex + 1]
		output[dstIndex + 2] = pixels[srcIndex + 2]
		output[dstIndex + 3] =
			whiteFn
				? whiteFn(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2])
				: useAlpha
					? pixels[srcIndex + 3] // source alpha
					: fixedW
	}

	return output
}
