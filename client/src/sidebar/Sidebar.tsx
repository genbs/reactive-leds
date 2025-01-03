import { useEffect, useRef } from "react"
import EditableValue from "src/components/EditableValue"
import { drawGrid } from "src/lib/ui/rendering"
import NetClients from "./NetClients"
import Stripe from "./Stripe"

export default function Sidebar({ stripes, connected, updateStripe, map, updateMap, canvas }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (!canvas || !canvasRef.current) return

		const srcctx = canvas.getContext("2d")
		const dstctx = canvasRef.current.getContext("2d")
		if (!dstctx || !srcctx) return

		const { width, height } = canvas
		canvasRef.current.width = width
		canvasRef.current.height = height
		canvasRef.current.style.width = "100%"
		canvasRef.current.style.height = "100%"

		let rid = 0
		function render() {
			dstctx.clearRect(0, 0, width, height)
			dstctx.drawImage(canvas, 0, 0)
			drawGrid(dstctx, map.gridSize)
			rid = requestAnimationFrame(render)
		}

		render()

		return () => cancelAnimationFrame(rid)
	}, [canvasRef.current, canvas])

	return (
		<aside style={{ display: "flex", flexDirection: "column" }}>
			<section>
				<div>
					{connected ? "Connected" : "Disconnected"} {stripes.length}
				</div>
				<div>
					grid
					<EditableValue
						value={map.gridSize[0]}
						onChange={gridSize => updateMap({ ...map, gridSize: [gridSize, map.gridSize[1]] })}
						type="number"
					/>
					<EditableValue
						value={map.gridSize[1]}
						onChange={gridSize => updateMap({ ...map, gridSize: [map.gridSize[0], gridSize] })}
						type="number"
					/>
				</div>
				{stripes.map(stripe => (
					<Stripe map={map} key={stripe.device.address} stripe={stripe} updateStripe={updateStripe} />
				))}
			</section>

			<section style={{ marginTop: "auto" }}>
				<NetClients />
			</section>
			<section>
				<canvas ref={canvasRef} />
			</section>
		</aside>
	)
}
