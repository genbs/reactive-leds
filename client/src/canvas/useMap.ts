import { TStripe, TStripeMap } from "@shared"
import { useCallback, useState } from "react"
import { TMap } from "src/context"
import { isInsideStripe, updateStripeMap } from "./utils"

interface DragState {
	isDragging: boolean
	startX: number
	startY: number
	dragMapInitial: TStripeMap | null
	dragStripe: TStripe | null
}

export function useMap(
	rect: DOMRect | null,
	map: TMap,
	stripes: TStripe[],
	update: (map: TStripeMap, stripe: TStripe) => void,
	stripeAction?: (event: "click", stripe: TStripe) => void
) {
	const [dragState, setDragState] = useState<DragState>({
		isDragging: false,
		startX: 0,
		startY: 0,
		dragMapInitial: null,
		dragStripe: null,
	})

	const onClick = useCallback(
		(e: MouseEvent) => {
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
		},
		[rect, stripes]
	)

	const onMouseDown = useCallback(
		(e: MouseEvent) => {
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

			setDragState(newState)
		},
		[rect, map, stripes, dragState]
	)

	const onMouseMove = useCallback(
		(e: MouseEvent) => {
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
		},
		[dragState, rect, map, update]
	)

	const onMouseUp = useCallback(() => {
		setDragState({
			...dragState,
			isDragging: false,
			dragStripe: null,
			dragMapInitial: null,
		})
	}, [dragState])

	return { onMouseDown, onMouseMove, onMouseUp, onClick }
}
