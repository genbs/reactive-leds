export function draw(
	canvasRef: React.RefObject<HTMLCanvasElement>,
	data: TexImageSource | Uint8Array,
	dataSize: [number, number]
) {
	const canvas = canvasRef.current
	if (!canvas) return

	const ctx = canvas.getContext("2d")
	if (!ctx) return

	const [width, height] = dataSize
	canvas.width = width
	canvas.height = height
	canvas.style.width = "100%"
	canvas.style.height = "100%"

	ctx.clearRect(0, 0, width, height)

	if (data instanceof Uint8Array) {
		const clampedArray = new Uint8ClampedArray(data.buffer)
		const imageData = new ImageData(clampedArray, width, height)
		ctx.putImageData(imageData, 0, 0)
	} else {
		if (data instanceof ImageData) {
			ctx.putImageData(data, 0, 0)
		} else {
			ctx.drawImage(data, 0, 0, canvas.width, canvas.height)
		}
	}
}

export function extractStripeData(
	data: Uint8Array,
	dataSize: [number, number],
	mpaGrid: [number, number],
	stripeRect: { x1: number; y1: number; x2: number; y2: number },
	stripeScale: [number, number]
): { pixels: Uint8Array; width: number; height: number } {
	const [imgWidth, imgHeight] = dataSize
	const [cells, rows] = mpaGrid
	const { x1, y1, x2, y2 } = stripeRect

	const cellCountX = (x2 - x1) / stripeScale[0]
	const cellCountY = (y2 - y1) / stripeScale[1]

	const cellWidth = imgWidth / cells
	const cellHeight = imgHeight / rows

	const outWidth = cellCountX
	const outHeight = cellCountY

	const output = new Uint8Array(outWidth * outHeight * 4)

	const outWidth4 = outWidth * 4

	let py = 0
	for (let cy = y1; cy < y2; cy++) {
		const pyOffset = py * outWidth4
		const centerY = ((cy + 0.5) * cellHeight) | 0

		let px = 0
		for (let cx = x1; cx < x2; cx++) {
			const centerX = ((cx + 0.5) * cellWidth) | 0

			const srcIndex = (centerY * imgWidth + centerX) * 4
			const dstIndex = pyOffset + px * 4

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
