import { useEffect, useState } from "react"

import GydraLEDs from "@lib"
import { TConfig, TStripe } from "@shared"

import Canvas from "@mapping/canvas/Canvas"
import Connection from "@mapping/connection/Connection"
import AppContext, { TAppContext } from "@mapping/context"
import Sidebar from "@mapping/sidebar/Sidebar"
import { hslToColor } from "./utils"

function App(props: TAppContext) {
	//return <Debug ws={props.ws} />
	return (
		<>
			<Connection />
			<main style={{ display: "grid", gridTemplateColumns: "3fr 1fr", height: "100%" }}>
				<Canvas {...props} />
				{/* {props.data && <Preview map={props.map} stripes={props.stripes} data={data} dataSize={[width, height]} />} */}

				<Sidebar {...props} />
			</main>
		</>
	)
}

const globalCanvas = document.createElement("canvas")
globalCanvas.width = 200
globalCanvas.height = 200
export default function Root() {
	const [lastStripes, setLastStripes] = useState<TStripe[]>([])
	const [config, setConfig] = useState<TConfig>({ grid: [0, 0], stripes: [] })
	const [connected, setConnected] = useState(false)

	useEffect(() => {
		GydraLEDs.begin("ws://localhost:4200")

		return GydraLEDs.onChangeState(state => {
			setConfig(state.config)
			setConnected(state.connected)
		})
	}, [])

	const context: TAppContext = {
		config,
		updateStripe: (stripe: TStripe) => {
			const stripes = config.stripes.map(s => (s.address === stripe.address ? stripe : s))

			GydraLEDs.setConfig({ ...config, stripes })
		},
		updateGrid: gridSize => {
			GydraLEDs.setConfig({ grid: gridSize })
		},
		connected,
		canvas: globalCanvas,
	}

	useEffect(() => {
		const stripeWithoutLeds = config.stripes.map(stripe => {
			const { leds, ...rest } = stripe
			return rest
		}) as TStripe[]

		if (JSON.stringify(stripeWithoutLeds) === JSON.stringify(lastStripes)) return

		const timeout = setTimeout(() => {
			setLastStripes(stripeWithoutLeds)
			stripeWithoutLeds.forEach(stripe => GydraLEDs.updateStripe(stripe.address, stripe))
		}, 0)

		return () => clearTimeout(timeout)
	}, [config.stripes, lastStripes])

	////////////////////////

	useEffect(() => {
		let rid = 0
		const width = context.canvas.width
		const height = context.canvas.height
		const data = new Uint8ClampedArray(width * height * 4)
		const imageData = new ImageData(data, width, height)
		const ctx = context.canvas.getContext("2d") as OffscreenCanvasRenderingContext2D

		function createImage(time) {
			for (let i = 0; i < height; i++) {
				for (let j = 0; j < width; j++) {
					const index = (i * width + j) * 4
					const iOffset = (i + 1) / height
					const jOffset = (j + 1) / width

					const angle = Math.atan2(iOffset, jOffset)
					const angle2 = Math.atan(jOffset / iOffset)
					let center = [Math.sin(time * 0.001), Math.cos(time * 0.001)]
					//let center = [0.5, 0.5]
					let distance = Math.sqrt((iOffset - center[0]) ** 2 + (jOffset - center[1]) ** 2)

					center = [0.5, 0.5]
					distance = distance + Math.sqrt((iOffset - center[0]) ** 2 + (jOffset - center[1]) ** 2) * 0.9

					const [r, g, b, a] = hslToColor(
						time * 0.1 + iOffset * 120,
						//((i * j) / (width * height)) * Math.cos(time * 0.001) ** 2,
						1,
						Math.round(time * 0.002 + iOffset * 4) % 2 === 0 ? 0.05 : 0
					)

					data[index] = r
					data[index + 1] = g
					data[index + 2] = b
					data[index + 3] = a
				}
			}

			imageData.data.set(data)
			ctx.putImageData(imageData, 0, 0)

			rid = requestAnimationFrame(createImage)
		}

		rid = requestAnimationFrame(createImage)

		return () => {
			cancelAnimationFrame(rid)
		}
	}, [])

	////////////////////////

	return (
		<AppContext.Provider value={context}>
			<AppContext.Consumer>{context => <App {...context} />}</AppContext.Consumer>
		</AppContext.Provider>
	)
}
