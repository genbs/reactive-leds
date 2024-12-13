import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import useWS from "./ws/hook"

const main = document.getElementById("root")!

const root = createRoot(main)

type Device = {
	id: number
	name: string
	address: string
	hostname: string
	num_leds: number
}

function App() {
	const [ws, connected] = useWS("ws://localhost:8080", true)
	const [devices, setDevices] = useState<Device[]>([])

	useEffect(() => {
		if (!ws) return

		ws.onMessage(data => {
			// @ts-ignore
			if (data.event === "devices") {
				// @ts-ignore
				setDevices(data.data)
			} else {
				console.log(data)
			}
		})

		if (connected) {
			ws.send({ type: "hello" })
		}
	}, [ws, connected])

	function onChange(color: { r: number; g: number; b: number; w: number }) {
		const data = []

		const maxLedCount = Math.max(...devices.map(d => d.num_leds))

		for (let i = 0; i < maxLedCount; i++) {
			data.push(i, color.r, color.g, color.b, color.w)
		}

		ws.send({ event: "set-color", data })
	}

	return (
		<>
			<h1>Hello, world!</h1>
			<p>
				{connected ? "Connected" : "Disconnected"} {devices.length}
			</p>
			{connected && (
				<div>
					<Color onChange={onChange} />
				</div>
			)}
		</>
	)
}

function Color(props) {
	const [state, setState] = useState({ r: 0, g: 0, b: 0, w: 0 })

	function colorChange(color: "r" | "g" | "b" | "w") {
		return function (e) {
			const value = e.target.value
			setState({ ...state, [color]: parseInt(value) })
		}
	}

	useEffect(() => {
		props.onChange(state)
	}, [state])

	return (
		<div>
			<span>R</span>
			<input type="range" value={state.r} onChange={colorChange("r")} min={0} max={255} step={1} />
			<span>G</span>
			<input type="range" value={state.g} onChange={colorChange("g")} min={0} max={255} step={1} />
			<span>B</span>
			<input type="range" value={state.b} onChange={colorChange("b")} min={0} max={255} step={1} />
			<span>W</span>
			<input type="range" value={state.w} onChange={colorChange("w")} min={0} max={255} step={1} />
		</div>
	)
}

root.render(<App />)
