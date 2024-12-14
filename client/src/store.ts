import { ESP, EventEmitter } from "@shared"
import { espToStripe, Stripe } from "./Stripe"

export type State = {
	stripes: Stripe[]
}

class Store extends EventEmitter<{ update: (state: State) => void }> {
	private _state: State

	constructor(initialState: State) {
		super()

		this._state = initialState
	}

	get state() {
		return this._state
	}

	set state(state: State) {
		this._state = state
		this.emit("update", this._state)
	}

	update(state: State) {
		this.state = { ...this.state, ...state }

		localStorage.setItem("state", JSON.stringify(this.state))
	}

	updateStripes(stripes: Stripe[]) {
		for (const stripe of stripes) {
			const index = this.state.stripes.findIndex(s => s.id === stripe.id)
			if (index === -1) continue
			const newStripesCopy = [...this.state.stripes]
			newStripesCopy[index] = { ...newStripesCopy[index], ...stripe }
			this.update({
				stripes: newStripesCopy,
			})
		}
	}

	fromESPDevices(devices: ESP[]) {
		const stripes = [...this.state.stripes]

		for (const device of devices) {
			const index = stripes.findIndex(s => s.id === device.id)
			if (index === -1) {
				stripes.push(espToStripe(device))
			} else {
				stripes[index] = {
					...espToStripe(device),
					...stripes[index],
				}
			}
		}
		this.update({ stripes })
	}
}

if (!localStorage.getItem("state")) localStorage.setItem("state", JSON.stringify({ stripes: [] }))

const localState = JSON.parse(localStorage.getItem("state")!) as State
debugger
for (const stripe_index in localState.stripes) {
	const stripe = localState.stripes[stripe_index]
	const empty = new Uint8Array(stripe.num_leds * 4)
	const old = new Uint8Array(Object.values(stripe.leds))

	// merge stripe.leds with empty
	for (let i = 0; i < stripe.num_leds * 4; i++) {
		empty[i] = i < old.length ? old[i] : empty[i]
	}
	localState.stripes[stripe_index].leds = empty
}
const store = new Store(localState)

export default store
