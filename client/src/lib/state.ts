import { TNetClient, TStripe } from "@shared"

export type GydraLEDState = {
	stripes: TStripe[]
	clients: TNetClient[]
	connected: boolean
}

const state: GydraLEDState = {
	stripes: [],
	clients: [],
	connected: false,
}

const onChangeStateListeners = []

export function onChangeState(callback: (state: GydraLEDState) => void) {
	callback(state)
	onChangeStateListeners.push(callback)

	return () => {
		const index = onChangeStateListeners.indexOf(callback)
		onChangeStateListeners.splice(index, 1)
	}
}

export function updateState(newState: Partial<GydraLEDState>) {
	Object.assign(state, newState)

	onChangeStateListeners.forEach(callback => {
		callback(state)
	})
}

export function getState() {
	return state
}
