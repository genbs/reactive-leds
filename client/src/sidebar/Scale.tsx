import { TStripe, TStripeMap } from "@shared"
import { updateStripeMap } from "src/canvas/utils"
import EditableValue from "src/components/EditableValue"
import { TMap } from "src/context"

interface ScaleProps {
	stripe: TStripe
	updateStripe: (stripe: TStripe) => void
	map: TMap
	ax: "x" | "y"
}

export default function Scale({ stripe, updateStripe, map, ax }: ScaleProps) {
	const max = ax === "x" ? map.gridSize[0] : map.gridSize[1]
	const currentScale = ax === "x" ? stripe.map.scale[0] : stripe.map.scale[1]

	function setScale(newScale: number) {
		const newScaleArray = [...stripe.map.scale] as [number, number]

		if (ax === "x") {
			newScaleArray[0] = newScale
		} else {
			newScaleArray[1] = newScale
		}

		const stripeMap: TStripeMap = {
			...stripe.map,
			scale: newScaleArray,
		}

		updateStripe({
			...stripe,
			map: updateStripeMap(map, stripeMap, stripe.device.num_leds),
		})
	}

	return (
		<>
			<span onClick={() => setScale(Math.max(1, currentScale - 0.5))} className="pointer unicode unicode--l pd--1">
				-
			</span>
			<span>
				<EditableValue
					value={currentScale}
					onChange={scale => setScale(scale)}
					min={1}
					max={max}
					step={0.1}
					type="number"
				/>
			</span>
			<span onClick={() => setScale(Math.min(max, currentScale + 0.5))} className="pointer unicode unicode--l pd--1">
				+
			</span>
		</>
	)
}
