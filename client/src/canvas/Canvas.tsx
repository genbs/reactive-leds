import { TStripe, TStripeMap } from "@shared"
import { useEffect, useRef } from "react"
import { TMap } from "../context"
import useClientRect from "../hooks/useClientRect"
import { style } from "../utils"
import { useMap } from "./useMap"
import { render } from "./utils"

interface CanvasProps {
	map: TMap
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
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

		rid = requestAnimationFrame(() => render(ctx, props.map, props.stripes))

		return () => {
			cancelAnimationFrame(rid)

			canvasRef.current?.removeEventListener("mousedown", mapEvents.onMouseDown)
			canvasRef.current?.removeEventListener("mousemove", mapEvents.onMouseMove)
			canvasRef.current?.removeEventListener("mouseup", mapEvents.onMouseUp)
		}
	}, [canvasRef.current, ref.current, rect, props.stripes, props.map.gridSize, mapEvents])

	return (
		<div ref={ref} className="canvas" style={{ height: "50vh" }}>
			{rect && <canvas ref={canvasRef} width={rect.width} height={rect.height} />}
		</div>
	)
}
