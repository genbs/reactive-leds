import { TStripe, TStripeMap } from "@shared"
import { updateStripeMap } from "src/canvas/utils"
import Dropdown from "src/components/Dropdown"
import EditableValue from "src/components/EditableValue"
import { TMap } from "src/context"
import { colorToHex, hexToColor } from "src/utils"
import Scale from "./Scale"

export default function Stripe({
	stripe,
	updateStripe,
	map,
}: {
	stripe: TStripe
	updateStripe: (stripe: TStripe) => void
	map: TMap
}) {
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
							)
						</small>
					</div>
				</div>
				{!stripe.device.online && (
					<div>
						<div className="flex gap">
							<span
								onClick={() => updateStripe({ ...stripe, map: { ...stripe.map, visible: !stripe.map.visible } })}
								className="pointer unicode unicode--l pd--1"
							>
								{stripe.map.visible ? "⊡" : "⊠"}
							</span>
							<span
								onClick={() => {
									console.log(stripe.map.orientation)
									const stripeMap: TStripeMap = { ...stripe.map, orientation: (stripe.map.orientation + 1) % 4 }
									console.log(stripeMap)
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
						</div>
					</div>
				)}
			</Dropdown>
		</div>
	)
}
