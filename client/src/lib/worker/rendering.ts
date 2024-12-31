import { EStripeOrientation, TStripe } from "@shared"
import { stripeToRect, TMap } from "./mapping"

/**
 * Draw pixelation grid in canvas
 *
 * @param ctx
 * @param gridSize
 */
export function drawGrid(ctx: CanvasRenderingContext2D, gridSize: [number, number]) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height

	const cellWidth = width / gridSize[0]
	const cellHeight = height / gridSize[1]

	ctx.strokeStyle = "#333"
	ctx.lineWidth = 1
	ctx.font = "8px Arial"
	ctx.fillStyle = "#666"

	for (let i = 0; i <= gridSize[0]; i++) {
		for (let j = 0; j <= gridSize[1]; j++) {
			if (i < gridSize[0]) {
				const x = i * cellWidth
				ctx.beginPath()
				ctx.moveTo(x, 0)
				ctx.lineTo(x, height)
				ctx.stroke()
			}

			if (j < gridSize[1]) {
				const y = j * cellHeight
				ctx.beginPath()
				ctx.moveTo(0, y)
				ctx.lineTo(width, y)
				ctx.stroke()
			}

			if (i < gridSize[0] && j < gridSize[1]) {
				ctx.textAlign = "left"
				ctx.textBaseline = "top"
				const xText = i * cellWidth
				const yText = j * cellHeight
				const pd = 5

				ctx.fillText(`${i.toString().padStart(2, "0")},${j.toString().padStart(2, "0")}`, xText + pd, yText + pd)
			}
		}
	}

	return [cellWidth, cellHeight]
}

export function render(
	ctx: CanvasRenderingContext2D,
	map: TMap,
	stripes: TStripe[],
	image: { data: Uint8Array; size: [number, number] } | null = null
) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height

	const [cols, rows] = map.gridSize
	const cellWidth = width / cols
	const cellHeight = height / rows

	ctx.clearRect(0, 0, width, height)
	drawGrid(ctx, map.gridSize)

	for (const stripe of stripes) {
		// if (stripe.map && stripe.map.visible === false) continue

		//drawStripe(ctx, stripe, cellWidth, cellHeight, map.gridSize, image)
		drawStripe(ctx, stripe, cellWidth, cellHeight, map.gridSize, image)
	}
}

const angleArrowMap = {
	[EStripeOrientation.Horizontal]: { angle: 0, direction: "→" },
	[EStripeOrientation.Vertical]: { angle: 90, direction: "↓" },
	[EStripeOrientation.HorizontalReverse]: { angle: 180, direction: "←" },
	[EStripeOrientation.VerticalReverse]: { angle: 270, direction: "↑" },
}

function drawStripe(
	ctx: CanvasRenderingContext2D,
	stripe: TStripe,
	cellWidth: number,
	cellHeight: number,
	gridSize: [number, number],
	image: { data: Uint8Array; size: [number, number] } | null = null
) {
	const color = stripe.map.visible ? stripe.color || [120, 120, 120, 255] : [120, 120, 120, 255]
	const stripeMap = stripe.map

	const { direction } = angleArrowMap[stripeMap.orientation]
	const rect = stripeToRect(stripe)

	ctx.strokeStyle = `rgba(${color.join(",")})`
	ctx.lineWidth = 2

	ctx.font = "20px Arial"
	ctx.fillStyle = `rgba(${color.join(",")})`
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"

	// ctx.fillText("→", x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2)
	// ctx.strokeRect(x * cellWidth, y * cellHeight, size * cellWidth, cellHeight)

	const x1 = rect.x1 * cellWidth
	const y1 = rect.y1 * cellHeight
	const x2 = rect.x2 * cellWidth
	const y2 = rect.y2 * cellHeight

	ctx.beginPath()
	ctx.moveTo(x1, y1)
	ctx.lineTo(x2, y1)
	ctx.lineTo(x2, y2)
	ctx.lineTo(x1, y2)
	ctx.closePath()
	ctx.stroke()

	ctx.fillText(direction, (x1 + x2) / 2, (y1 + y2) / 2)

	ctx.font = "16px Arial"
	ctx.textAlign = "left"
	ctx.textBaseline = "top"
	if (stripe.map.visible) {
		//const mapping = mapStripeOnData(image.data, image.size, gridSize, stripe)
		// const leds = mapping.pixels
		// const width = mapping.width
		// const height = mapping.height
		const leds = stripe.leds
		const width =
			stripe.map.orientation === EStripeOrientation.Horizontal ||
			stripe.map.orientation === EStripeOrientation.HorizontalReverse
				? stripe.device.num_leds
				: 1
		const height =
			stripe.map.orientation === EStripeOrientation.Vertical ||
			stripe.map.orientation === EStripeOrientation.VerticalReverse
				? stripe.device.num_leds
				: 1

		const reverse =
			stripe.map.orientation === EStripeOrientation.HorizontalReverse ||
			stripe.map.orientation === EStripeOrientation.VerticalReverse

		for (let i = 0; i < leds.length; i += 4) {
			const x = (i / 4) % width
			const y = Math.floor(i / 4 / width)

			const r = leds[i]
			const g = leds[i + 1]
			const b = leds[i + 2]
			const w = leds[i + 3]

			const color = [r, g, b]
			const warm_white = [255, 238, 203]
			const wp = w / 255
			const white = [warm_white[0] * wp, warm_white[1] * wp, warm_white[2] * wp, wp]
			const maxC = Math.max(...color)
			const mo = maxC / 255
			//const mix = [(color[0] + white[0] * wp) / 2, (color[1] + white[1] * wp) / 2, (color[2] + white[2] * wp) / 2, wp]
			const mix = [r, g, b, w]

			const x0 = reverse ? (width - x - 1) * cellWidth + x1 : x * cellWidth + x1
			const y0 = reverse ? (height - y - 1) * cellHeight + y1 : y * cellHeight + y1

			ctx.fillStyle = `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, 255)`
			//ctx.fillRect(x0, y0, cellWidth * stripeMap.scale[0], cellHeight * stripeMap.scale[1])
			const pd = 5
			ctx.fillRect(x0 + pd, y0 + pd, cellWidth * stripeMap.scale[0] - pd * 2, cellHeight * stripeMap.scale[1] - pd * 2)

			// draw pixel index
			ctx.fillStyle = "black"
			const index = i / 4
			ctx.fillText(`${index}`, x0 + 5 + pd, y0 + 5 + pd)
		}
	}
}
