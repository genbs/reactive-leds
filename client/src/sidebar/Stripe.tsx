import { EWSRequestByteType, TStripe, TStripeMap } from "@shared"
import { updateStripeMap } from "src/canvas/utils"
import Dropdown from "src/components/Dropdown"
import EditableValue from "src/components/EditableValue"
import { TAppContext, TMap } from "src/context"

import { useEffect, useState } from "react"
import { mapStripeOnData } from "src/lib/mapping"
import WS from "src/lib/websocket"
import { colorToHex, hexToColor } from "src/utils"
import Debug from "./Debug"
import Scale from "./Scale"

interface StripeProps {
	stripe: TStripe
	updateStripe: (stripe: TStripe) => void
	map: TMap
	ws: WS
	image: TAppContext["image"]
}

export default function Stripe({ stripe, updateStripe, map, ws, image }: StripeProps) {
	const [prevPixel, setPrevPixel] = useState<Uint8Array>(new Uint8Array(0))
	const [prevUpdate, setPrevUpdate] = useState(0)

	useEffect(() => {
		const now = performance.now()
		if (!stripe || !image || now - prevUpdate < 1000) return

		const { pixels } = mapStripeOnData(image.data, image.size, map.gridSize, stripe)

		for (let i = 0; i < stripe.device.num_leds; i += 4) {
			pixels[i + 3] = 0
		}
		// check equal
		if (prevPixel.length === pixels.length && prevPixel.every((v, i) => v === pixels[i])) return

		setPrevPixel(pixels)
		setPrevUpdate(now)
		setLeds(pixels)
	}, [stripe, image, prevPixel, prevUpdate])

	function setLeds(colors: Uint8Array) {
		const data = new Uint8Array(1 /* message_type */ + 1 /* stripe_id */ + stripe.device.num_leds * 5)
		data[0] = EWSRequestByteType.SetLEDs
		data[1] = stripe.device.id
		for (let i = 0; i < stripe.device.num_leds; i++) {
			stripe.leds[i * 4] = colors[i * 4]
			stripe.leds[i * 4 + 1] = colors[i * 4 + 1]
			stripe.leds[i * 4 + 2] = colors[i * 4 + 2]
			stripe.leds[i * 4 + 3] = colors[i * 4 + 3]
			stripe.leds[i * 4 + 3] = 0

			data[i * 5 + 2] = i
			data[i * 5 + 3] = colors[i * 4]
			data[i * 5 + 4] = colors[i * 4 + 1]
			data[i * 5 + 5] = colors[i * 4 + 2]
			data[i * 5 + 6] = colors[i * 4 + 3]
			data[i * 5 + 6] = 0
		}

		ws.send(data)

		//updateStripe(stripe)
	}

	function sendColor(stripe: TStripe) {
		const colors = new Uint8Array(stripe.device.num_leds * 4)
		for (let i = 0; i < stripe.device.num_leds; i++) {
			colors[i * 4] = stripe.leds[0]
			colors[i * 4 + 1] = stripe.leds[1]
			colors[i * 4 + 2] = stripe.leds[2]
			colors[i * 4 + 3] = stripe.leds[3]
		}

		setLeds(colors)
	}

	function onChangeBrightness(b) {
		const v = parseInt(b.target.value)
		console.log(v)

		ws.send({
			type: "update_stripe",
			data: { ...stripe, device: { ...stripe.device, brightness: v } },
			ip: stripe.device.address,
		})
	}

	return (
		<div key={stripe.device.address}>
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
					<span className="unicode">{stripe.device.online ? "●" : "○"}</span>
					<div className="flex flex--column">
						<EditableValue
							value={stripe.device.id}
							onChange={id => updateStripe({ ...stripe, device: { ...stripe.device, id } })}
							min={0}
							max={255}
							type="number"
						/>
						<span>{stripe.device.address}</span>
						<small>
							:
							<EditableValue
								value={stripe.device.port}
								onChange={port => updateStripe({ ...stripe, device: { ...stripe.device, port } })}
								min={4000}
								max={4300}
								type="number"
							/>
							(
							<EditableValue
								value={stripe.device.hostname}
								onChange={hostname => updateStripe({ ...stripe, device: { ...stripe.device, hostname } })}
								type="text"
							/>
							:
							<EditableValue
								value={stripe.device.num_leds}
								onChange={num_leds => updateStripe({ ...stripe, device: { ...stripe.device, num_leds } })}
								min={0}
								max={255}
								type="number"
							/>
							)
						</small>
					</div>
				</div>
				<div>
					{(stripe.device.online || true) && (
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
									updateStripe({ ...stripe, map: updateStripeMap(map, stripeMap, stripe.device.num_leds) })
								}}
								className="pointer unicode unicode--l pd--1"
							>
								⟳
							</span>

							<div className="flex gap flex--v-center">
								<Scale stripe={stripe} updateStripe={updateStripe} map={map} ax="x" />
								<Scale stripe={stripe} updateStripe={updateStripe} map={map} ax="y" />
							</div>

							<div>
								<Debug stripe={stripe} updateStripe={sendColor} />

								<div>
									<span>Brightness {stripe.device.brightness}</span>
									<input
										type="range"
										value={stripe.device.brightness}
										onChange={onChangeBrightness}
										min={0}
										max={255}
										step={1}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</Dropdown>
		</div>
	)
}
