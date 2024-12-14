import { EWSRequestByteType, Stripe } from "@shared"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import useStripes from "./hooks/useStripes"
import useWS from "./hooks/useWS"
import StripeBox from "./StripeBox"
import { style } from "./utils"

const main = document.getElementById("root")!

const root = createRoot(main)

style(`
	.stripes {
	}
	.stripes > * {
		width: 100%;
	}
`)

function App() {
	const [ws, connected] = useWS()

	const stripes = useStripes(ws)

	function onChange(color: { r: number; g: number; b: number; w: number }) {
		for (const stripe of stripes) {
			const data: Uint8Array = new Uint8Array(1 /* message_type */ + 1 /* stripe_id */ + stripe.num_leds * 5)

			data[0] = EWSRequestByteType.SetLEDs
			data[1] = stripe.id
			for (let i = 0; i < stripe.num_leds; i++) {
				data[i * 5 + 2] = color.r
				data[i * 5 + 3] = color.g
				data[i * 5 + 4] = color.b
				data[i * 5 + 5] = color.w
			}

			ws.send(data)
		}
	}

	function updateStripe(stripe: Stripe) {
		ws.send({
			type: "update_stripe",
			data: {
				id: stripe.id,
				name: stripe.name,
				brightness: stripe.brightness,
				port: stripe.port,
				num_leds: stripe.num_leds,
				color: stripe.color,
			},
		})
	}

	return (
		<>
			<h1>Hello, world!</h1>
			<p>
				{connected ? "Connected" : "Disconnected"} {stripes.length}
			</p>
			{connected && (
				<div>
					<Color onChange={onChange} />

					<div className="flex flex--column gap-m stripes">
						{stripes.map(stripe => (
							<StripeBox key={stripe.id} stripe={stripe} onChange={updateStripe} />
						))}
					</div>
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
