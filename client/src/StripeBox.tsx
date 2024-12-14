import { Stripe } from "@shared"
import EditableValue from "./components/EditableValue"
import { classname, style } from "./utils"

export type StripeProps = {
	stripe: Stripe
	onChange: (stripe: Stripe) => void
}

style(`
	.stripe-box {
		padding: 1rem;
		border: 1px solid;
		border-radius: .4rem;
	}	
	.stripe-box__id {
		border: 1px solid;
		padding: .2rem .4rem;
		border-radius: .2rem;
	}	
	.stripe-box__status {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}
	.stripe-box__status--online {
		background-color: green;
	}
	.stripe-box__status--offline {
		background-color: red;
	}
	.stripe-box__address {
		color: #626;
	}
	.stripe-box__port {
		color: #aa0;
	}
`)

export default function StripeBox({ stripe, onChange }: StripeProps) {
	const color = stripe.color ? stripe.color : [120, 120, 120, 255]
	const rgbaColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`

	return (
		<div
			style={{
				borderColor: rgbaColor,
				color: rgbaColor,
			}}
			className="stripe-box"
		>
			<div className="flex">
				<div style={{ borderColor: rgbaColor }} className="stripe-box__id">
					<EditableValue
						value={stripe.id}
						onChange={id => onChange({ ...stripe, id })}
						min={0}
						max={255}
						type="number"
					/>
				</div>
				<div className="flex-1 flex stripe-box__name">
					<EditableValue
						value={stripe.name}
						onChange={name => onChange({ ...stripe, name })}
						min={0}
						max={255}
						type="text"
					/>
					(
					<EditableValue
						value={stripe.num_leds}
						onChange={num_leds => onChange({ ...stripe, num_leds })}
						type="number"
						min={0}
						max={255}
					/>
					|
					<EditableValue
						value={stripe.brightness}
						onChange={brightness => onChange({ ...stripe, brightness })}
						type="number"
						min={0}
						max={255}
					/>
					)
				</div>
				<div>
					<span className="stripe-box__address">{stripe.address}</span>:
					<span className="stripe-box__port">{stripe.port}</span>@{stripe.hostname}
				</div>
				<div
					className={classname("stripe-box__status", `stripe-box__status--${stripe.online ? "online" : "offline"}`)}
				></div>
			</div>
		</div>
	)
}
