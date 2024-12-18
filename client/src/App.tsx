import { TStripe, TWSRequest, TWSResponse } from "@shared"
import { useCallback, useEffect, useRef, useState } from "react"
import Canvas from "./canvas/Canvas"
import AppContext, { TAppContext, TMap } from "./context"
import Preview from "./preview/Preview"
import Sidebar from "./sidebar/Sidebar"
import { hslToColor } from "./utils"
import WS from "./ws"

function App(props: TAppContext) {
	const width = 100
	const height = 100
	const data = new Uint8Array(width * height * 4)

	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			const index = (i * width + j) * 4

			const [r, g, b, a] = hslToColor(i + j, (i * j) / (width * height), 0.5)

			data[index] = r
			data[index + 1] = g
			data[index + 2] = b
			data[index + 3] = a
		}
	}

	return (
		<main style={{ display: "grid", gridTemplateColumns: "3fr 1fr", height: "100%" }}>
			<div style={{ display: "grid", gridTemplateRows: "1fr 1fr", height: "100%" }}>
				<Canvas map={props.map} stripes={props.stripes} updateStripe={props.updateStripe} />
				<Preview map={props.map} stripes={props.stripes} data={data} dataSize={[width, height]} />
			</div>

			<Sidebar {...props} />
		</main>
	)
}

const initialState = localStorage.getItem("state")
	? JSON.parse(localStorage.getItem("state"))
	: {
			map: { gridSize: [10, 10] },
	  }

export default function Root() {
	const [stripes, setStripes] = useState<TStripe[]>([])
	const [lastStripes, setLastStripes] = useState<TStripe[]>([])
	const [map, setMap] = useState<TMap>(initialState.map)
	const [connected, setConnected] = useState(false)

	// Usa un useRef per mantenere una singola istanza di WS
	const wsRef = useRef(
		new WS<TWSResponse, TWSRequest>({
			url: "ws://localhost:8080",
			debug: false,
			autoConnect: false,
		})
	)

	const ws = wsRef.current

	const context: TAppContext = {
		stripes,
		updateStripe: (stripe: TStripe) => {
			setStripes(prev => {
				const newStripes = prev.map(s => (s.device.id === stripe.device.id ? stripe : s))
				if (newStripes !== prev) return newStripes

				return prev
			})
		},
		map,
		updateMap: map => {
			setMap(map)
			localStorage.setItem("state", JSON.stringify({ map }))
		},
		ws,
		connected,
	}

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (JSON.stringify(stripes) === JSON.stringify(lastStripes)) return
			setLastStripes(stripes)
			stripes.forEach(stripe => {
				ws.send({
					type: "update_stripe",
					data: stripe,
					ip: stripe.device.address,
				})
			})
		}, 300)

		return () => clearTimeout(timeout)
	}, [stripes, lastStripes])

	const handleWsMessage = useCallback((message: any) => {
		if (typeof message !== "string") return

		const { event, data } = JSON.parse(message) as TWSResponse
		if (event === "get_stripe") {
			setStripes(
				data.map(stripe => ({
					...stripe,
					leds: new Uint8Array(Object.values(stripe.leds)),
					code: "",
				}))
			)
		}
	}, [])

	const handleConnectionChange = useCallback((isConnected: boolean) => setConnected(isConnected), [])

	useEffect(() => {
		if (!ws.connected) ws.connect()

		ws.on("message", handleWsMessage)
		ws.on("connectionChange", handleConnectionChange)

		return () => {
			ws.off("message", handleWsMessage)
			ws.off("connectionChange", handleConnectionChange)
		}
	}, [ws, handleWsMessage, handleConnectionChange])

	return (
		<AppContext.Provider value={context}>
			<AppContext.Consumer>{context => <App {...context} />}</AppContext.Consumer>
		</AppContext.Provider>
	)
}
