import { EStripeOrientation, TStripe, TStripeMap } from "@shared"
import { TMap } from "src/context"

export function drawCells(ctx: CanvasRenderingContext2D, gridSize: [number, number]) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height

	const cellWidth = width / gridSize[0]
	const cellHeight = height / gridSize[1]

	ctx.clearRect(0, 0, width, height)

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

			// Disegna la linea orizzontale
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

export function render(ctx: CanvasRenderingContext2D, map: TMap, stripes: TStripe[]) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height

	const [cols, rows] = map.gridSize
	const cellWidth = width / cols
	const cellHeight = height / rows

	ctx.clearRect(0, 0, width, height)
	drawCells(ctx, map.gridSize)

	for (const stripe of stripes) {
		// if (stripe.map && stripe.map.visible === false) continue

		drawStripe(ctx, stripe, cellWidth, cellHeight)
	}
}

const angleArrowMap = {
	[EStripeOrientation.Horizontal]: { angle: 0, direction: "→" },
	[EStripeOrientation.Vertical]: { angle: 90, direction: "↓" },
	[EStripeOrientation.HorizontalReverse]: { angle: 180, direction: "←" },
	[EStripeOrientation.VerticalReverse]: { angle: 270, direction: "↑" },
}

function drawStripe(ctx: CanvasRenderingContext2D, stripe: TStripe, cellWidth: number, cellHeight: number) {
	const color = stripe.map.visible ? stripe.color : [120, 120, 120, 255]
	const stripeMap = stripe.map

	const { direction } = angleArrowMap[stripeMap.orientation]
	const rect = stripeRect(stripe)

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
}

export function stripeRect(stripe: TStripe) {
	const [scaleX, scaleY] = stripe.map.scale
	const x = stripe.map.x
	const y = stripe.map.y
	const lengthX = stripe.device.num_leds * scaleX
	const lengthY = stripe.device.num_leds * scaleY

	switch (stripe.map.orientation) {
		case EStripeOrientation.Horizontal:
			// Orientamento orizzontale verso destra
			return { x1: x, y1: y, x2: x + lengthX, y2: y + scaleY }

		case EStripeOrientation.Vertical:
			// Orientamento verticale verso il basso
			return { x1: x, y1: y, x2: x + scaleX, y2: y + lengthY }

		case EStripeOrientation.HorizontalReverse:
			// Orientamento orizzontale verso sinistra
			return { x1: x - lengthX, y1: y, x2: x, y2: y + scaleY }

		case EStripeOrientation.VerticalReverse:
			// Orientamento verticale verso l'alto
			return { x1: x, y1: y - lengthY, x2: x + scaleX, y2: y }
	}
}

export function isInsideStripe(cell: number, row: number, stripe: TStripe) {
	const rect = stripeRect(stripe)

	if (cell >= rect.x1 && cell <= rect.x2 && row >= rect.y1 && row <= rect.y2) {
		return true
	}

	return false
}

export function updateStripeMap(map: TMap, stripeMap: TStripeMap, length: number) {
	const [cols, rows] = map.gridSize

	const horizontal =
		stripeMap.orientation === EStripeOrientation.Horizontal ||
		stripeMap.orientation === EStripeOrientation.HorizontalReverse
	const vertical =
		stripeMap.orientation === EStripeOrientation.Vertical ||
		stripeMap.orientation === EStripeOrientation.VerticalReverse

	const minX = stripeMap.orientation === EStripeOrientation.HorizontalReverse ? length : 0
	const maxX = stripeMap.orientation === EStripeOrientation.Horizontal ? cols - length : vertical ? cols - 1 : cols

	const minY = stripeMap.orientation === EStripeOrientation.VerticalReverse ? length : 0
	const maxY = stripeMap.orientation === EStripeOrientation.Vertical ? rows - length : horizontal ? rows - 1 : rows

	const newX = Math.max(minX, Math.min(stripeMap.x, maxX))
	const newY = Math.max(minY, Math.min(stripeMap.y, maxY))

	return {
		...stripeMap,
		x: newX,
		y: newY,
	}
}
