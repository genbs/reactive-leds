import { useEffect, useRef } from "react"
import EditableValue from "src/components/EditableValue"
import { drawGrid } from "src/lib/rendering"
import Stripe from "./Stripe"

export default function Sidebar({ stripes, connected, ws, updateStripe, map, updateMap, image }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (!image || !canvasRef.current) return

		const canvas = canvasRef.current
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		const [width, height] = image.size
		canvas.width = width
		canvas.height = height
		canvas.style.width = "100%"
		canvas.style.height = "100%"

		ctx.clearRect(0, 0, width, height)

		const clampedArray = new Uint8ClampedArray(image.data.buffer)
		const imageData = new ImageData(clampedArray, width, height)
		ctx.putImageData(imageData, 0, 0)
		drawGrid(ctx, map.gridSize)
	}, [canvasRef.current, image])

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
					<Stripe
						map={map}
						key={stripe.device.address}
						stripe={stripe}
						updateStripe={updateStripe}
						ws={ws}
						image={image}
					/>
				))}
			</section>
			<section style={{ marginTop: "auto" }}>
				<canvas ref={canvasRef} />
			</section>
		</aside>
	)
}
