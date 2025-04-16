import { TConfig, TNetClient } from "@shared"

export type GydraLEDState = {
	config: TConfig
	clients: TNetClient[]
	connected: boolean
}

const state: GydraLEDState = {
	config: {
		stripes: [],
		grid: [0, 0],
	},
	clients: [],
	connected: false,
}

const onChangeStateListeners = []

export function onChangeState(callback: (state: GydraLEDState) => void) {
	callback(getState())
	onChangeStateListeners.push(callback)

	return () => {
		const index = onChangeStateListeners.indexOf(callback)
		onChangeStateListeners.splice(index, 1)
	}
}

export function updateState(newState: Partial<GydraLEDState> | ((state: GydraLEDState) => Partial<GydraLEDState>)) {
	if (typeof newState === "function") {
		newState = newState(state)
	}

	Object.assign(state, newState)

	onChangeStateListeners.forEach(callback => {
		callback(state)
	})
}

export function getState() {
	return JSON.parse(JSON.stringify(state)) as GydraLEDState
}

export function isConnected() {
	return state.connected
}
