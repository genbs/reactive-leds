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

export function mappingEvents(
	canvas: HTMLCanvasElement,
	config: TConfig,
	update: (map: TStripeMap, stripe: TStripe) => void
) {
	const rect = canvas.getBoundingClientRect()

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

		const stripeMap = {
			...dragStripe.map,
			x0: dragMapInitial.x0 + gridDeltaX,
			y0: dragMapInitial.y0 + gridDeltaY,
			x1: dragMapInitial.x1 + gridDeltaX,
			y1: dragMapInitial.y1 + gridDeltaY,
			x2: dragMapInitial.x2 + gridDeltaX,
			y2: dragMapInitial.y2 + gridDeltaY,
			x3: dragMapInitial.x3 + gridDeltaX,
			y3: dragMapInitial.y3 + gridDeltaY,
		}

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
	}

	canvas.addEventListener("mousedown", onMouseDown)
	canvas.addEventListener("mousemove", onMouseMove)
	canvas.addEventListener("mouseup", onMouseUp)
	canvas.addEventListener("click", onClick)

	return () => {
		canvas.removeEventListener("mousedown", onMouseDown)
		canvas.removeEventListener("mousemove", onMouseMove)
		canvas.removeEventListener("mouseup", onMouseUp)
		canvas.removeEventListener("click", onClick)
	}
}
