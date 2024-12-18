import { TStripe, TWSRequest, TWSResponse } from "@shared"
import { createContext } from "react"
import WS from "./ws"

export type TMap = {
	gridSize: [number, number]
}

export type TAppContext = {
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
	ws: WS<TWSResponse, TWSRequest>
	connected: boolean
	map: TMap
	updateMap: (map: TMap) => void
}

const AppContext = createContext<TAppContext>(null)

export default AppContext
