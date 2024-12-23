import { TStripe } from "@shared"
import { createContext } from "react"
import WS from "./lib/websocket"

export type TMap = {
	gridSize: [number, number]
}

export type TAppContext = {
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
	ws: WS
	connected: boolean
	map: TMap
	updateMap: (map: TMap) => void
	image: {
		data: Uint8Array
		size: [number, number]
	} | null
}

const AppContext = createContext<TAppContext>(null)

export default AppContext
