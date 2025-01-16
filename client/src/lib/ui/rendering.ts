import { TConfig, TStripe } from "@shared"
import { stripeToRect } from "./mapping/utils"

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

export function mappingUIRender(ctx: CanvasRenderingContext2D, config: TConfig) {
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
}

function drawStripe(ctx: CanvasRenderingContext2D, stripe: TStripe, cellWidth: number, cellHeight: number) {
	const color = stripe.map.visible ? stripe.color || [0, 255, 0, 255] : [255, 0, 0, 255]
	const stripeMap = stripe.map

	const { direction } = getOrientation(stripeMap.x1, stripeMap.y1, stripeMap.x2, stripeMap.y2)

	ctx.strokeStyle = `rgba(${color.join(",")})`
	ctx.lineWidth = 2

	ctx.font = "20px Arial"
	ctx.fillStyle = `rgba(${color.join(",")})`
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"

	const rect = stripeToRect(stripe)

	// ctx.fillText("→", x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2)
	// ctx.strokeRect(x * cellWidth, y * cellHeight, size * cellWidth, cellHeight)

	const x1 = stripe.map.x1 * cellWidth
	const y1 = stripe.map.y1 * cellHeight
	const x2 = stripe.map.x2 * cellWidth
	const y2 = stripe.map.y2 * cellHeight

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

	const leds = stripe.leds
	const reverse = false
	const width = rect.width
	const height = rect.height

	for (let i = 0; i < leds.length; i += 4) {
		const x = (i / 4) % width
		const y = Math.floor(i / 4 / width)

		const r = leds[i]
		const g = leds[i + 1]
		const b = leds[i + 2]
		const w = leds[i + 3]

		const warmWhite = [255, 238, 203]

		const wp = (w / 255) * 0

		const mix = [
			Math.round(r * (1 - wp) + warmWhite[0] * wp), // Miscelazione del rosso
			Math.round(g * (1 - wp) + warmWhite[1] * wp), // Miscelazione del verde
			Math.round(b * (1 - wp) + warmWhite[2] * wp), // Miscelazione del blu
		]

		const x0 = reverse ? (width - x - 1) * cellWidth + x1 : x * cellWidth + x1
		const y0 = reverse ? (height - y - 1) * cellHeight + y1 : y * cellHeight + y1

		ctx.fillStyle = `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, 255)`
		//ctx.fillRect(x0, y0, cellWidth * stripeMap.scale[0], cellHeight * stripeMap.scale[1])
		const pd = 1
		ctx.fillRect(x0 + pd, y0 + pd, cellWidth - pd * 2, cellHeight - pd * 2)

		// draw pixel index
		ctx.fillStyle = "black"
		const index = i / 4
		ctx.fillText(`${index}`, x0 + pd + 2, y0 + pd + 4)
	}
}

function getOrientation(x1, y1, x2, y2) {
	// Differenze
	const dx = x2 - x1
	const dy = y2 - y1

	// Angolo in radianti rispetto all’asse X, in senso antiorario
	// (Math.atan2 considera dx come asse X e dy come asse Y)
	let angleRad = Math.atan2(dy, dx)
	// Converti in gradi
	let angleDeg = angleRad * (180 / Math.PI)

	// Normalizza l’angolo in [0, 360)
	if (angleDeg < 0) {
		angleDeg += 360
	}

	// Calcola direzione approssimata a 4 direzioni
	// useremo soglie di 45° attorno alle 4 direzioni principali:
	//   → (0°)
	//   ↑ (90°)
	//   ← (180°)
	//   ↓ (270°)
	let approximateAngle
	let directionSymbol

	// Opzione 1: se vuoi cluster di 90° esatti
	// (ogni 90 gradi circa 45 gradi di offset)
	if (angleDeg >= 315 || angleDeg < 45) {
		approximateAngle = 0
		directionSymbol = "→"
	} else if (angleDeg >= 45 && angleDeg < 135) {
		approximateAngle = 90
		directionSymbol = "↑"
	} else if (angleDeg >= 135 && angleDeg < 225) {
		approximateAngle = 180
		directionSymbol = "←"
	} else {
		approximateAngle = 270
		directionSymbol = "↓"
	}

	return {
		angle: angleDeg, // Angolo reale in gradi
		approximateAngle, // Angolo approssimato (0,90,180,270)
		direction: directionSymbol, // Simbolo direzione
	}
}
