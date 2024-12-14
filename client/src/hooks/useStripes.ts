import { useEffect } from "react"

import { TWSResponse } from "@shared"
import store from "src/store"
import WS from "src/ws"
import { Stripe } from "../Stripe"
import { useStore } from "./useStore"

export default function useStripes(ws?: WS) {
	const stripes = useStore().stripes

	useEffect(() => {
		if (!ws) return

		return ws.on("message", message => {
			if (typeof message !== "string") return

			const { event, data } = JSON.parse(message) as TWSResponse
			if (event === "get_stripe") store.fromESPDevices(data)
		})
	}, [ws])

	function localUpdate(newStripes: Stripe[]) {
		store.updateStripes(newStripes)
	}

	return [stripes, localUpdate] as const
}
