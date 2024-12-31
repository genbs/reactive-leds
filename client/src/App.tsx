import gydraLEDs, { TMap } from "@lib"
import { TStripe } from "@shared"
import { useEffect, useState } from "react"
import Canvas from "./canvas/Canvas"
import Connection from "./connection/Connection"
import AppContext, { TAppContext } from "./context"
import Sidebar from "./sidebar/Sidebar"
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

const initialState = localStorage.getItem("state")
	? JSON.parse(localStorage.getItem("state"))
	: {
			map: { gridSize: [10, 10] },
	  }

const globalCanvas = document.createElement("canvas")
globalCanvas.width = 400
globalCanvas.height = 400
export default function Root() {
	const [stripes, setStripes] = useState<TStripe[]>([])
	const [lastStripes, setLastStripes] = useState<TStripe[]>([])
	const [map, setMap] = useState<TMap>(initialState.map)
	const [connected, setConnected] = useState(false)

	useEffect(() => {
		gydraLEDs.begin("ws://localhost:8080")

		const unbindWatch = gydraLEDs.watch(globalCanvas, map.gridSize)

		const unbindCS = gydraLEDs.onChangeState(state => {
			setStripes(state.stripes)
			setConnected(state.connected)
		})

		return () => {
			unbindWatch()
			unbindCS()
		}
	}, [])

	const context: TAppContext = {
		stripes,
		updateStripe: (stripe: TStripe) => {
			setStripes(prev => prev.map(s => (s.device.address === stripe.device.address ? stripe : s)))
		},
		map,
		updateMap: map => {
			setMap(map)
			localStorage.setItem("state", JSON.stringify({ map }))
		},
		connected,
		canvas: globalCanvas,
	}

	useEffect(() => {
		const stripeWithoutLeds = stripes.map(stripe => {
			const { leds, ...rest } = stripe
			return rest
		}) as TStripe[]

		if (JSON.stringify(stripeWithoutLeds) === JSON.stringify(lastStripes)) return

		const timeout = setTimeout(() => {
			setLastStripes(stripeWithoutLeds)
			stripeWithoutLeds.forEach(stripe => gydraLEDs.updateStripe(stripe.device.address, stripe))
		}, 300)

		return () => clearTimeout(timeout)
	}, [stripes, lastStripes])

	////////////////////////

	useEffect(() => {
		let rid = 0
		const width = context.canvas.width
		const height = context.canvas.height

		function createImage(time) {
			const data = new Uint8ClampedArray(width * height * 4)

			for (let i = 0; i < height; i++) {
				for (let j = 0; j < width; j++) {
					const index = (i * width + j) * 4
					const iOffset = (i + 1) / height
					const jOffset = (j + 1) / width

					const angle = Math.atan2(iOffset, jOffset)
					const angle2 = Math.atan(jOffset / iOffset)
					let center = [Math.sin(time * 0.001), Math.cos(time * 0.001)]
					let distance = Math.sqrt((iOffset - center[0]) ** 2 + (jOffset - center[1]) ** 2)

					center = [0.5, 0.5]
					distance = distance + Math.sqrt((iOffset - center[0]) ** 2 + (jOffset - center[1]) ** 2) * 0.9

					const [r, g, b, a] = hslToColor(
						distance * 360,
						//((i * j) / (width * height)) * Math.cos(time * 0.001) ** 2,
						0.5,
						0.5
					)

					data[index] = r
					data[index + 1] = g
					data[index + 2] = b
					data[index + 3] = a
				}
			}

			const ctx = context.canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
			ctx.putImageData(new ImageData(data, width, height), 0, 0)

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
