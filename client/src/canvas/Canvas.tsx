import { TStripe, TStripeMap } from "@shared"
import { useEffect, useRef } from "react"

import { TMap } from "src/lib/worker/mapping"
import { render } from "src/lib/worker/rendering"
import useClientRect from "../hooks/useClientRect"
import { style } from "../utils"
import { useMap } from "./useMap"

interface CanvasProps {
	map: TMap
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
	image: { data: Uint8Array; size: [number, number] } | null
}

style(`
    .canvas {
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
    }
`)

export default function Canvas(props: CanvasProps) {
	const [ref, rect] = useClientRect<HTMLDivElement>()
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const mapEvents = useMap(rect, props.map, props.stripes, (map: TStripeMap, stripe: TStripe) => {
		props.updateStripe({ ...stripe, map })
	})

	useEffect(() => {
		if (!canvasRef.current) return

		const ctx = canvasRef.current.getContext("2d")
		if (!ctx) return

		canvasRef.current.width = rect.width
		canvasRef.current.height = rect.height

		let rid = 0

		canvasRef.current.addEventListener("mousedown", mapEvents.onMouseDown)
		canvasRef.current.addEventListener("mousemove", mapEvents.onMouseMove)
		canvasRef.current.addEventListener("mouseup", mapEvents.onMouseUp)
		canvasRef.current.addEventListener("click", mapEvents.onClick)

		rid = requestAnimationFrame(() => render(ctx, props.map, props.stripes, props.image))

		return () => {
			cancelAnimationFrame(rid)

			canvasRef.current?.removeEventListener("mousedown", mapEvents.onMouseDown)
			canvasRef.current?.removeEventListener("mousemove", mapEvents.onMouseMove)
			canvasRef.current?.removeEventListener("mouseup", mapEvents.onMouseUp)
		}
	}, [canvasRef.current, ref.current, rect, props.stripes, props.map.gridSize, mapEvents, props.image])

	return (
		<div ref={ref} className="canvas">
			{rect && <canvas className="expand" ref={canvasRef} width={rect.width} height={rect.height} />}
		</div>
	)
}
