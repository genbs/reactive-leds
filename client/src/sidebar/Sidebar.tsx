import EditableValue from "src/components/EditableValue"
import Stripe from "./Stripe"

export default function Sidebar({ stripes, connected, updateStripe, map, updateMap }) {
	return (
		<div>
			<div>
				{connected ? "Connected" : "Disconnected"} {stripes.length}
			</div>
			<div>
				grid
				<EditableValue
					value={map.gridSize[0]}
					onChange={gridSize => updateMap({ ...map, gridSize: [gridSize, map.gridSize[1]] })}
					type="number"
				/>
				<EditableValue
					value={map.gridSize[1]}
					onChange={gridSize => updateMap({ ...map, gridSize: [map.gridSize[0], gridSize] })}
					type="number"
				/>
			</div>
			{stripes.map(stripe => (
				<Stripe map={map} key={stripe.device.address} stripe={stripe} updateStripe={updateStripe} />
			))}
		</div>
	)
}
