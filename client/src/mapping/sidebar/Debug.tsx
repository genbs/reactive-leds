import { TColor, TStripe } from "@shared"

export default function Debug(props: { stripe: TStripe; updateStripe: (stripe: TStripe) => void }) {
	const selected = props.stripe.leds.subarray(0, 4) as TColor

	function setStripeColor(color: TColor) {
		const newLeds = new Uint8Array(props.stripe.leds.length)
		for (let i = 0; i < props.stripe.leds.length; i += 4) {
			newLeds.set(color, i)
		}

		props.updateStripe({ ...props.stripe, leds: newLeds })
	}

	return (
		<div>
			<h2>Debug</h2>
			<DebugColor selected={selected} onChange={setStripeColor} />
		</div>
	)
}

function DebugColor(props: { selected: TColor; onChange: (color: TColor) => void }) {
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
