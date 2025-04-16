import { createContext } from "react"

import { TConfig, TStripe } from "@shared"

export type TAppContext = {
	config: TConfig
	connected: boolean
	updateStripe: (stripe: TStripe) => void
	updateGrid: (grid: TConfig["grid"]) => void
	canvas: HTMLCanvasElement | OffscreenCanvas
}

const AppContext = createContext<TAppContext>(null)

export default AppContext
