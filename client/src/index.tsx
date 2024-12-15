import { Color, EWSRequestByteType } from "@shared"
import { createRoot } from "react-dom/client"
import core from "./core"
import useStripes from "./hooks/useStripes"
import useWS from "./hooks/useWS"
import { Stripe } from "./Stripe"
import StripeBox from "./StripeBox"
import StripeEditor from "./StripeEditor"
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
	const [ws, connected] = useWS("ws://localhost:8080", true, false)

	const [stripes, localStripeUpdate] = useStripes(ws)

	function onChange(stripe: Stripe, color: Color) {
		const data: Uint8Array = new Uint8Array(1 /* message_type */ + 1 /* stripe_id */ + stripe.num_leds * 5)

		data[0] = EWSRequestByteType.SetLEDs
		data[1] = stripe.id
		for (let i = 0; i < stripe.num_leds; i++) {
			data[i * 5 + 2] = i
			data[i * 5 + 3] = color[0]
			data[i * 5 + 4] = color[1]
			data[i * 5 + 5] = color[2]
			data[i * 5 + 6] = color[3]

			stripe.leds[i * 4] = color[0]
			stripe.leds[i * 4 + 1] = color[1]
			stripe.leds[i * 4 + 2] = color[2]
			stripe.leds[i * 4 + 3] = color[3]
		}

		// update stripe color
		localStripeUpdate([stripe])

		ws.send(data)
	}

	core.setWS(ws)
	core.setStripes(stripes)

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

	function chunckArray<T>(arr: T[], size: number): T[][] {
		return arr.reduce((acc, val, i) => {
			if (i % size === 0) {
				acc.push([])
			}
			acc[acc.length - 1].push(val)
			return acc
		}, [] as T[][])
	}

	function runCode() {
		core.start()
	}

	function stopCode() {
		core.stop()
	}

	return (
		<>
			<h1>Hello, world!</h1>
			<p>
				{connected ? "Connected" : "Disconnected"} {stripes.length}
			</p>
			{connected && (
				<div>
					<div className="flex flex--column gap-m stripes">
						{stripes.map(stripe => (
							<StripeBox key={stripe.id} stripe={stripe} onChange={updateStripe}>
								<div className="flex flex--column gap-m">
									<Color
										selected={[stripe.leds[0], stripe.leds[1], stripe.leds[2], stripe.leds[3]]}
										onChange={color => onChange(stripe, color)}
									/>

									<div className="flex gap-m">
										{chunckArray([...stripe.leds], 4).map((led, i) => (
											<div key={i} className="flex">
												<div
													style={{
														width: "2rem",
														height: "2rem",
														background: `rgb(${led[0] * (led[3] / 255)}, ${led[1] * (led[3] / 255)}, ${
															led[2] * (led[3] / 255)
														})`,
													}}
												></div>
												<div
													style={{
														width: "1rem",
														height: "2rem",
														background: `rgba(${led[3]}, ${led[3]}, ${led[3]}, ${led[3] / 255})`,
													}}
												></div>
											</div>
										))}
									</div>

									<div>
										<StripeEditor stripe={stripe} />
									</div>
								</div>
							</StripeBox>
						))}
					</div>

					<div>
						<button onClick={runCode}>Run Code</button>
						<button onClick={stopCode}>Run Code</button>
					</div>
				</div>
			)}
		</>
	)
}

function Color(props: { selected: Color; onChange: (color: Color) => void }) {
	function colorChange(index: number) {
		return function (e) {
			const value = parseInt(e.target.value)

			const color = [...props.selected] as Color
			color[index] = value

			props.onChange(color)
		}
	}

	return (
		<div>
			<span>R</span>
			<input type="range" value={props.selected[0]} onChange={colorChange(0)} min={0} max={255} step={1} />
			<span>G</span>
			<input type="range" value={props.selected[1]} onChange={colorChange(1)} min={0} max={255} step={1} />
			<span>B</span>
			<input type="range" value={props.selected[2]} onChange={colorChange(2)} min={0} max={255} step={1} />
			<span>W</span>
			<input type="range" value={props.selected[3]} onChange={colorChange(3)} min={0} max={255} step={1} />
		</div>
	)
}

root.render(<App />)
