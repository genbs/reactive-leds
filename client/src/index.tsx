import { EStripeOrientation, EWSRequestByteType, TColor, TStripe } from "@shared"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import core from "./core"
import useStripes from "./hooks/useStripes"
import useWS, { getWS } from "./hooks/useWS"

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

	const [stripes, updateStripes] = useStripes(ws)

	function onChange(stripe: TStripe, color: TColor) {
		const data: Uint8Array = new Uint8Array(1 /* message_type */ + 1 /* stripe_id */ + stripe.device.num_leds * 5)

		data[0] = EWSRequestByteType.SetLEDs
		data[1] = stripe.device.id
		for (let i = 0; i < stripe.device.num_leds; i++) {
			stripe.leds[i * 4] = color[0]
			stripe.leds[i * 4 + 1] = color[1]
			stripe.leds[i * 4 + 2] = color[2]
			stripe.leds[i * 4 + 3] = color[3]

			data[i * 5 + 2] = i
			data[i * 5 + 3] = color[0]
			data[i * 5 + 4] = color[1]
			data[i * 5 + 5] = color[2]
			data[i * 5 + 6] = color[3]
		}

		updateStripes([stripe])

		ws.send(data)
	}

	core.setWS(ws)

	core.setStripes(stripes)

	function updateStripe(stripe_id: TStripe["device"]["id"], stripe: TStripe) {
		ws.send({
			type: "update_stripe",
			data: stripe,
			id: stripe_id,
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
					<Find />
					<div className="flex flex--column gap-m stripes">
						{stripes.map(stripe => (
							<StripeBox
								key={stripe.device.id}
								stripe={stripe}
								onChange={update => updateStripe(stripe.device.id, update)}
							>
								<div className="flex flex--column gap-m">
									<Color
										selected={[stripe.leds[0], stripe.leds[1], stripe.leds[2], stripe.leds[3]]}
										onChange={color => onChange(stripe, color)}
									/>

									<div
										className="flex"
										style={{
											flexDirection:
												stripe.orientation === EStripeOrientation.Vertical
													? "column-reverse"
													: stripe.orientation === EStripeOrientation.VerticalReverse
													? "column"
													: "row",
										}}
									>
										{chunckArray([...stripe.leds], 4).map((led, i) => {
											const color = `rgb(${led[0]}, ${led[1]}, ${led[2]})`
											const warm_white = [255, 238, 203]
											const wp = led[3] / 255
											const white = `rgba(${warm_white[0] * wp}, ${warm_white[1] * wp}, ${warm_white[2] * wp}, ${wp})`
											const mix = `color-mix(in srgb, ${color} ${100 - wp * 50}%, ${white} ${wp * 50}%)`
											return (
												<div
													key={i}
													className="flex"
													style={{
														borderRadius: "0.25rem",
														width: "3.16rem",
														height: "2rem",
														overflow: "hidden",
													}}
												>
													<div
														style={{
															width: "2rem",
															height: "2rem",
															//background: `color-mix(in srgb, ${color} ${100 - wp * 50}%, ${white} ${wp * 50}%)`,
															background: color,
														}}
													>
														{i}
													</div>
													<div
														style={{
															width: "1rem",
															height: "2rem",
															background: white,
														}}
													></div>
												</div>
											)
										})}
									</div>

									<div>
										<StripeEditor stripe={stripe} updateStripe={s => updateStripes([s])} />
									</div>
								</div>
							</StripeBox>
						))}
					</div>

					<div>
						<button onClick={runCode}>Run Code</button>
						<button onClick={stopCode}>Stop Code</button>
					</div>
				</div>
			)}
		</>
	)
}

function Color(props: { selected: TColor; onChange: (color: TColor) => void }) {
	function colorChange(index: number) {
		return function (e) {
			const value = parseInt(e.target.value)

			const color = [...props.selected] as TColor
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

function Find() {
	const [search, setSearch] = useState("192.168.")

	function find() {
		getWS()!.send({
			type: "find",
			ip: search,
		})
	}

	return (
		<div>
			FIND: <input type="text" value={search} onChange={e => setSearch(e.target.value)} />
			<button onClick={find}>OK</button>
		</div>
	)
}
