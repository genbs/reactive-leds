import { useState } from "react"

import GydraLEDs from "@lib"
import { TConfig, TStripe, TStripeMap } from "@shared"

import Dropdown from "@mapping/components/Dropdown"
import EditableValue from "@mapping/components/EditableValue"
import Debug from "@mapping/sidebar/Debug"
import Scale from "@mapping/sidebar/Scale"
import { colorToHex, hexToColor } from "@mapping/utils"

interface StripeProps {
	stripe: TStripe
	updateStripe: (stripe: TStripe) => void
	grid: TConfig["grid"]
}

export default function Stripe({ stripe, updateStripe, grid }: StripeProps) {
	const [prevPixel, setPrevPixel] = useState<Uint8Array>(new Uint8Array(0))
	const [prevUpdate, setPrevUpdate] = useState(0)

	const [imageLeds, setImageLeds] = useState<boolean>(false)

	// useEffect(() => {
	// 	if (!imageLeds) return

	// 	const now = performance.now()
	// 	if (!stripe || !image || now - prevUpdate < 1000 / 60) return

	// 	const { pixels } = mapStripeOnData(image.data, image.size, map.gridSize, stripe)

	// 	for (let i = 0; i < stripe.num_leds; i += 4) {
	// 		pixels[i + 3] = 0
	// 	}
	// 	// check equal
	// 	if (prevPixel.length === pixels.length && prevPixel.every((v, i) => v === pixels[i])) return

	// 	setPrevPixel(pixels)
	// 	setPrevUpdate(now)

	// 	setLeds(pixels)
	// }, [imageLeds, stripe, image, prevPixel, prevUpdate])

	function setLeds(colors: Uint8Array) {
		const data = new Uint8Array(stripe.num_leds * 5)

		for (let i = 0; i < stripe.num_leds; i++) {
			data[i * 5] = i
			data[i * 5 + 1] = colors[i * 4]
			data[i * 5 + 2] = colors[i * 4 + 1]
			data[i * 5 + 3] = colors[i * 4 + 2]
			data[i * 5 + 4] = colors[i * 4 + 3]

			stripe.leds[i * 4] = data[i * 5 + 1]
			stripe.leds[i * 4 + 1] = data[i * 5 + 2]
			stripe.leds[i * 4 + 2] = data[i * 5 + 3]
			stripe.leds[i * 4 + 3] = data[i * 5 + 4]
		}

		GydraLEDs.setLEDs(stripe.id, data)

		updateStripe(stripe)
	}

	function sendColor(stripe: TStripe) {
		if (imageLeds) return

		const colors = new Uint8Array(stripe.num_leds * 4)
		for (let i = 0; i < stripe.num_leds; i++) {
			colors[i * 4] = stripe.leds[0]
			colors[i * 4 + 1] = stripe.leds[1]
			colors[i * 4 + 2] = stripe.leds[2]
			colors[i * 4 + 3] = stripe.leds[3]
		}

		setLeds(colors)
	}

	function onChangeBrightness(b) {
		const v = parseInt(b.target.value)

		GydraLEDs.updateStripe(stripe.address, { ...stripe, brightness: v })
	}

	return (
		<div key={stripe.address}>
			<Dropdown>
				<div className="flex gap">
					<EditableValue
						value={colorToHex(stripe.color)}
						onChange={color => updateStripe({ ...stripe, color: hexToColor(color) })}
						type="color"
						render={value => (
							<div
								style={{
									width: "1rem",
									height: "1rem",
									background: value,
								}}
							></div>
						)}
					/>
					<span className="unicode">{stripe.online ? "●" : "○"}</span>
					<div className="flex flex--column">
						<EditableValue
							value={stripe.id}
							onChange={id => updateStripe({ ...stripe, id })}
							min={0}
							max={255}
							type="number"
						/>
						<span>{stripe.address}</span>
						<small>
							:
							<EditableValue
								value={stripe.port}
								onChange={port => updateStripe({ ...stripe, port })}
								min={4000}
								max={4300}
								type="number"
							/>
							(
							<EditableValue
								value={stripe.hostname}
								onChange={hostname => updateStripe({ ...stripe, hostname })}
								type="text"
							/>
							:
							<EditableValue
								value={stripe.num_leds}
								onChange={num_leds => updateStripe({ ...stripe, num_leds })}
								min={0}
								max={255}
								type="number"
							/>
							)
						</small>
					</div>
				</div>
				<div>
					{(stripe.online || true) && (
						<div className="flex gap">
							<span
								onClick={() => updateStripe({ ...stripe, map: { ...stripe.map, visible: !stripe.map.visible } })}
								className="pointer unicode unicode--l pd--1"
							>
								{stripe.map.visible ? "⊡" : "⊠"}
							</span>
							<span
								onClick={() => {
									const stripeMap: TStripeMap = { ...stripe.map, orientation: (stripe.map.orientation + 1) % 4 }
									updateStripe({ ...stripe, map: GydraLEDs.updateStripeMap(grid, stripeMap, stripe.num_leds) })
								}}
								className="pointer unicode unicode--l pd--1"
							>
								⟳
							</span>

							<div className="flex gap flex--v-center">
								<Scale stripe={stripe} updateStripe={updateStripe} grid={grid} ax="x" />
								<Scale stripe={stripe} updateStripe={updateStripe} grid={grid} ax="y" />
							</div>

							<div>
								<div>
									<span>{imageLeds ? "Image mode" : "Color mode"}</span>
									<input type="checkbox" checked={imageLeds} onChange={() => setImageLeds(!imageLeds)} />
								</div>
								<Debug stripe={stripe} updateStripe={sendColor} />

								<div>
									<span>Brightness {stripe.brightness}</span>
									<input
										type="range"
										value={stripe.brightness}
										onChange={onChangeBrightness}
										min={0}
										max={255}
										step={1}
									/>
								</div>
							</div>
							<div>
								<button onClick={() => GydraLEDs.deleteStripe(stripe.address)}>Delete</button>
							</div>
						</div>
					)}
				</div>
			</Dropdown>
		</div>
	)
}
