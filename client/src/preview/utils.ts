export function draw(canvasRef: React.RefObject<HTMLCanvasElement>, data: Uint8Array, dataSize: [number, number]) {
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

	const clampedArray = new Uint8ClampedArray(data.buffer)
	const imageData = new ImageData(clampedArray, width, height)
	ctx.putImageData(imageData, 0, 0)
}
