import { createContext } from "react"

import { TMap } from "@lib"
import { TStripe } from "@shared"

export type TAppContext = {
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
	connected: boolean
	map: TMap
	updateMap: (map: TMap) => void
	canvas: HTMLCanvasElement | OffscreenCanvas
}

const AppContext = createContext<TAppContext>(null)

export default AppContext
