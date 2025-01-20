import GydraLEDs from "@lib"
import { TConfig, TStripe, TStripeMap } from "@shared"
import { isInsideStripe } from "./utils"

type DragState = {
	isDragging: boolean
	startX: number
	startY: number
	dragMapInitial: TStripeMap | null
	dragStripe: TStripe | null
}

let dragState: DragState = {
	isDragging: false,
	startX: 0,
	startY: 0,
	dragMapInitial: null,
	dragStripe: null,
}

let selectedStripe: TStripe | null = null
let selectedMode: "move" | "scaleX" | "scaleY" | "rotate" | "default" = "move"

export function mappingEvents(
	canvas: HTMLCanvasElement,
	config: TConfig,
	update: (map: TStripeMap, stripe: TStripe) => void
) {
	const rect = canvas.getBoundingClientRect()

	let lastKey = ""

	const onKeyDown = (e: KeyboardEvent) => {
		lastKey = e.key
	}

	const onKeyUp = (e: KeyboardEvent) => {
		lastKey = ""
	}

	const onClick = (e: MouseEvent) => {
		const localX = e.clientX - rect.left
		const localY = e.clientY - rect.top
		const [cells, rows] = config.grid
		const cellWidth = rect.width / cells
		const cellHeight = rect.height / rows
		const ix = Math.floor(localX / cellWidth)
		const iy = Math.floor(localY / cellHeight)

		for (const stripe of config.stripes) {
			if (stripe.map?.visible === false) continue

			if (isInsideStripe(ix, iy, stripe)) {
				switch (lastKey) {
					case "d":
						selectedMode = "default"
						break
					case "x":
						selectedMode = "scaleX"
						break
					case "y":
						selectedMode = "scaleY"
						break
					case "r":
						selectedMode = "rotate"
						break
					default:
						selectedMode = "move"
						break
				}
				selectedStripe = stripe

				return
			}
		}

		selectedStripe = null
	}

	const onMouseDown = (e: MouseEvent) => {
		if (!selectedStripe) return

		const [cells, rows] = config.grid
		const cellWidth = rect.width / cells
		const cellHeight = rect.height / rows

		const localX = e.clientX - rect.left
		const localY = e.clientY - rect.top

		let newState: DragState = {
			...dragState,
			startX: localX,
			startY: localY,
			isDragging: false,
			dragMapInitial: null,
			dragStripe: null,
		}

		for (const stripe of config.stripes) {
			if (stripe.map?.visible === false) continue

			if (isInsideStripe(Math.floor(localX / cellWidth), Math.floor(localY / cellHeight), stripe)) {
				newState.isDragging = true
				newState.dragStripe = stripe
				newState.dragMapInitial = { ...stripe.map }
				break
			}
		}

		dragState = newState
	}

	const onMouseMove = (e: MouseEvent) => {
		const { isDragging, dragStripe, dragMapInitial, startX, startY } = dragState
		if (!isDragging || !dragStripe || !dragMapInitial || !rect) return

		const [cells, rows] = config.grid
		const cellWidth = rect.width / cells
		const cellHeight = rect.height / rows

		// Calcola lo spostamento rispetto al punto iniziale
		const deltaX = e.clientX - rect.left - startX
		const deltaY = e.clientY - rect.top - startY

		// Quantizza lo spostamento a passi di cella
		const gridDeltaX = Math.round(deltaX / cellWidth)
		const gridDeltaY = Math.round(deltaY / cellHeight)

		let stripeMap = {
			...dragStripe.map,
		}

		switch (selectedMode) {
			case "default":
				stripeMap.x0 = 0
				stripeMap.y0 = 0
				stripeMap.x1 = 1
				stripeMap.y1 = 0
				stripeMap.x2 = 1
				stripeMap.y2 = selectedStripe.num_leds
				stripeMap.x3 = 0
				stripeMap.y3 = selectedStripe.num_leds
				break
			case "rotate":
				const angle = Math.atan2(deltaY / rect.height, deltaX / rect.width)
				stripeMap = GydraLEDs.rotate(stripeMap, angle)
				break
			case "scaleY":
				stripeMap.x2 = dragMapInitial.x2 + gridDeltaX
				stripeMap.y2 = dragMapInitial.y2 + gridDeltaY
				stripeMap.x3 = dragMapInitial.x3 + gridDeltaX
				stripeMap.y3 = dragMapInitial.y3 + gridDeltaY
				break
			case "scaleX":
				stripeMap.x1 = dragMapInitial.x1 + gridDeltaX
				stripeMap.y1 = dragMapInitial.y1 + gridDeltaY
				stripeMap.x2 = dragMapInitial.x2 + gridDeltaX
				stripeMap.y2 = dragMapInitial.y2 + gridDeltaY
				break
			case "move":
				stripeMap.x0 = dragMapInitial.x0 + gridDeltaX
				stripeMap.y0 = dragMapInitial.y0 + gridDeltaY
				stripeMap.x1 = dragMapInitial.x1 + gridDeltaX
				stripeMap.y1 = dragMapInitial.y1 + gridDeltaY
				stripeMap.x2 = dragMapInitial.x2 + gridDeltaX
				stripeMap.y2 = dragMapInitial.y2 + gridDeltaY
				stripeMap.x3 = dragMapInitial.x3 + gridDeltaX
				stripeMap.y3 = dragMapInitial.y3 + gridDeltaY
				break
		}

		// round
		stripeMap.x0 = Math.round(stripeMap.x0 * 5) / 5
		stripeMap.y0 = Math.round(stripeMap.y0 * 5) / 5
		stripeMap.x1 = Math.round(stripeMap.x1 * 5) / 5
		stripeMap.y1 = Math.round(stripeMap.y1 * 5) / 5
		stripeMap.x2 = Math.round(stripeMap.x2 * 5) / 5
		stripeMap.y2 = Math.round(stripeMap.y2 * 5) / 5
		stripeMap.x3 = Math.round(stripeMap.x3 * 5) / 5
		stripeMap.y3 = Math.round(stripeMap.y3 * 5) / 5

		// Aggiorna solo se cambia cella
		if (JSON.stringify(stripeMap) !== JSON.stringify(dragStripe.map)) {
			update(stripeMap, dragStripe)
		}
	}

	const onMouseUp = () => {
		dragState = {
			...dragState,
			isDragging: false,
			dragStripe: null,
			dragMapInitial: null,
		}

		//selectedMode = "move"
	}

	document.addEventListener("keydown", onKeyDown)
	document.addEventListener("keyup", onKeyUp)
	canvas.addEventListener("mousedown", onMouseDown)
	canvas.addEventListener("mousemove", onMouseMove)
	canvas.addEventListener("mouseup", onMouseUp)
	canvas.addEventListener("click", onClick)

	return () => {
		document.removeEventListener("keydown", onKeyDown)
		document.removeEventListener("keyup", onKeyUp)
		canvas.removeEventListener("mousedown", onMouseDown)
		canvas.removeEventListener("mousemove", onMouseMove)
		canvas.removeEventListener("mouseup", onMouseUp)
		canvas.removeEventListener("click", onClick)
	}
}
