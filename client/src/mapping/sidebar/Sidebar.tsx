import { useEffect, useRef, useState } from "react"

import GydraLEDs from "@lib"

import EditableValue from "@mapping/components/EditableValue"
import NetClients from "@mapping/sidebar/NetClients"
import Stripe from "@mapping/sidebar/Stripe"
import { TConfig, TStripe } from "@shared"

interface SidebarProps {
	config: TConfig
	connected: boolean
	updateStripe: (stripe: TConfig["stripes"][0]) => void
	updateGrid: (gridSize: [number, number]) => void
	canvas: HTMLCanvasElement | OffscreenCanvas
}

export default function Sidebar(props: SidebarProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [watched, setWatched] = useState<TStripe[]>([])

	useEffect(() => {
		if (!props.canvas || !canvasRef.current) return

		const srcctx = props.canvas.getContext("2d")
		const dstctx = canvasRef.current.getContext("2d")
		if (!dstctx || !srcctx) return

		const { width, height } = props.canvas
		canvasRef.current.width = width
		canvasRef.current.height = height
		canvasRef.current.style.width = "100%"
		canvasRef.current.style.height = "100%"

		let rid = 0
		function render() {
			dstctx.clearRect(0, 0, width, height)
			dstctx.drawImage(props.canvas, 0, 0)
			GydraLEDs.drawGrid(dstctx, props.config.grid)
			rid = requestAnimationFrame(render)
		}

		render()

		return () => cancelAnimationFrame(rid)
	}, [canvasRef.current, props.canvas])

	useEffect(() => {
		if (!GydraLEDs.isConnected()) return

		console.log("watched", watched)
		return GydraLEDs.watch(
			props.canvas,
			watched.map(w => w.id)
		)
	}, [props.canvas, watched])

	function onWatch(stripe: TStripe) {
		if (watched.find(w => w.id === stripe.id)) {
			setWatched(watched.filter(w => w.id !== stripe.id))
		} else {
			setWatched([...watched, stripe])
		}
	}

	return (
		<aside style={{ display: "flex", flexDirection: "column", maxHeight: "100%", overflow: "auto" }}>
			<section>
				<div>
					{props.connected ? "Connected" : "Disconnected"} {props.config.stripes.length}
				</div>
				<div>
					grid
					<EditableValue
						value={props.config.grid[0]}
						onChange={gridSize => props.updateGrid([gridSize, props.config.grid[1]])}
						type="number"
					/>
					<EditableValue
						value={props.config.grid[1]}
						onChange={gridSize => props.updateGrid([props.config.grid[0], gridSize])}
						type="number"
					/>
				</div>
				{props.config.stripes.map(stripe => (
					<Stripe
						grid={props.config.grid}
						key={stripe.address}
						stripe={stripe}
						updateStripe={props.updateStripe}
						onWatch={onWatch}
					/>
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
