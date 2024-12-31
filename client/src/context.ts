import { TStripe } from "@shared"
import { createContext } from "react"
import { TMap } from "./lib/worker/mapping"

export type TAppContext = {
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
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
