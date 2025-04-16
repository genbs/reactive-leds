import { TConfig, TStripe, TStripeMap } from "@shared"
import { mappingEvents } from "./mapping/events"

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
	ctx.font = "6px Arial"
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
				const pd = 2

				ctx.fillText(`${i.toString().padStart(2, "0")},${j.toString().padStart(2, "0")}`, xText + pd, yText + pd)
			}
		}
	}

	return [cellWidth, cellHeight]
}

export function mappingUIRender(
	ctx: CanvasRenderingContext2D,
	config: TConfig,
	update: (map: TStripeMap, stripe: TStripe) => void
) {
	const unbind = mappingEvents(ctx.canvas, config, update)

	const width = ctx.canvas.width
	const height = ctx.canvas.height

	const [cols, rows] = config.grid
	const cellWidth = width / cols
	const cellHeight = height / rows

	ctx.clearRect(0, 0, width, height)
	drawGrid(ctx, config.grid)

	for (const stripe of config.stripes) {
		if (stripe.map && stripe.map.visible === false) continue

		drawStripe(ctx, stripe, cellWidth, cellHeight)
	}

	return unbind
}

function drawStripe(ctx: CanvasRenderingContext2D, stripe: TStripe, cellWidth: number, cellHeight: number) {
	const color = stripe.map.visible ? stripe.color || [0, 255, 0, 255] : [255, 0, 0, 255]
	const stripeMap = stripe.map

	const angle = getAngle(stripeMap) // se serve un angolo (altrimenti toglilo)

	ctx.strokeStyle = `rgba(${color.join(",")})`
	ctx.lineWidth = 2

	ctx.font = "20px Arial"
	ctx.fillStyle = `rgba(${color.join(",")}`
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"

	// Estraggo i 4 punti (in CELLE) e li converto in PIXEL
	const x0 = stripeMap.x0 * cellWidth
	const y0 = stripeMap.y0 * cellHeight
	const x1 = stripeMap.x1 * cellWidth
	const y1 = stripeMap.y1 * cellHeight
	const x2 = stripeMap.x2 * cellWidth
	const y2 = stripeMap.y2 * cellHeight
	const x3 = stripeMap.x3 * cellWidth
	const y3 = stripeMap.y3 * cellHeight

	// Disegno contorno quadrilatero
	ctx.beginPath()
	ctx.moveTo(x0, y0)
	ctx.lineTo(x1, y1)
	ctx.lineTo(x2, y2)
	ctx.lineTo(x3, y3)
	ctx.closePath()
	ctx.stroke()

	// Disegno i 4 punti
	function drawPoint(px: number, py: number, c: string) {
		ctx.beginPath()
		ctx.arc(px, py, 5, 0, Math.PI * 2)
		ctx.fillStyle = c
		ctx.fill()
	}
	drawPoint(x0, y0, "red")
	drawPoint(x1, y1, "blue")
	drawPoint(x2, y2, "green")
	drawPoint(x3, y3, "purple")

	// Se vuoi disegnare un simbolo in mezzo (→)
	ctx.save()
	ctx.translate((x0 + x2) / 2, (y0 + y2) / 2)
	ctx.rotate(angle)
	ctx.fillText("→", 0, 0)
	ctx.restore()

	// Ora disegno i LED usando l'interpolazione bilineare 2D
	const leds = stripe.leds

	ctx.font = "14px Arial"
	ctx.textAlign = "left"
	ctx.textBaseline = "top"

	const steps = stripe.num_leds

	for (let i = 0; i < stripe.num_leds; i++) {
		const ledindex = i * 4
		const r = leds[ledindex]
		const g = leds[ledindex + 1]
		const b = leds[ledindex + 2]
		const w = leds[ledindex + 3]

		// Miscelo con warm white (facoltativo)
		const warmWhite = [255, 238, 203]
		const wp = (w / 255) * 0
		const mix = [
			Math.round(r * (1 - wp) + warmWhite[0] * wp),
			Math.round(g * (1 - wp) + warmWhite[1] * wp),
			Math.round(b * (1 - wp) + warmWhite[2] * wp),
		]

		const offset1 = i / steps
		const offset2 = (i + 1) / steps
		const [px0, py0] = step(offset1, x0, y0, x3, y3)
		const [px1, py1] = step(offset2, x1, y1, x2, y2)
		const px = px0 + (px1 - px0) / 2
		const py = py0 + (py1 - py0) / 2

		//draw rect px0, py0, px1, py1
		ctx.fillStyle = `rgba(${mix.join(",")})`
		ctx.fillRect(px0, py0, px1 - px0, py1 - py0)
	}
}
function step(offset, x0, y0, x1, y1) {
	const x = x0 + offset * (x1 - x0)
	const y = y0 + offset * (y1 - y0)
	return [x, y]
}

export function getAngle(stripeMap: TStripeMap) {
	const { x0, y0, x1, y1, x2, y2, x3, y3 } = stripeMap

	const anglesRad = [
		Math.atan2(y1 - y0, x1 - x0),
		Math.atan2(y2 - y1, x2 - x1),
		Math.atan2(y3 - y2, x3 - x2),
		Math.atan2(y0 - y3, x0 - x3),
	]

	let sumX = 0
	let sumY = 0
	for (const rad of anglesRad) {
		sumX += Math.cos(rad)
		sumY += Math.sin(rad)
	}

	let angleDeg = Math.atan2(sumY, sumX) + Math.PI

	if (angleDeg < 0) {
		angleDeg += Math.PI * 2
	}

	return angleDeg
}
