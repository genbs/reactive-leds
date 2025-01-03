import { TStripe, TStripeMap } from "@shared"
import { isInsideStripe, TMap, updateStripeMap } from "./utils"

type DragState = {
	isDragging: boolean
	startX: number
	startY: number
	dragMapInitial: TStripeMap | null
	dragStripe: TStripe | null
}

let dragState = {
	isDragging: false,
	startX: 0,
	startY: 0,
	dragMapInitial: null,
	dragStripe: null,
}
export function mappingEvents(
	rect: DOMRect | null,
	map: TMap,
	stripes: TStripe[],
	update: (map: TStripeMap, stripe: TStripe) => void,
	stripeAction?: (event: "click", stripe: TStripe) => void
) {
	const onClick = (e: MouseEvent) => {
		// controlla se sto cliccando il rotate di una stripe
		if (!rect || !stripeAction) return

		const localX = e.clientX - rect.left
		const localY = e.clientY - rect.top
		const [cells, rows] = map.gridSize
		const cellWidth = rect.width / cells
		const cellHeight = rect.height / rows
		const ix = Math.floor(localX / cellWidth)
		const iy = Math.floor(localY / cellHeight)

		for (const stripe of stripes) {
			if (stripe.map?.visible === false) continue
			if (isInsideStripe(ix, iy, stripe)) {
				stripeAction("click", stripe)
			}
		}
	}

	const onMouseDown = (e: MouseEvent) => {
		if (!rect) return
		const [cells, rows] = map.gridSize
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

		for (const stripe of stripes) {
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

		const [cells, rows] = map.gridSize
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
			x: dragMapInitial.x + gridDeltaX,
			y: dragMapInitial.y + gridDeltaY,
		}
		// Nuova posizione basata sulla posizione iniziale
		const { x: newX, y: newY } = updateStripeMap(map, stripeMap, dragStripe.device.num_leds)

		// Aggiorna solo se cambia cella
		if (dragStripe.map.x !== newX || dragStripe.map.y !== newY) {
			update(
				{
					...dragStripe.map,
					x: newX,
					y: newY,
				},
				dragStripe
			)
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

	return { onMouseDown, onMouseMove, onMouseUp, onClick }
}
