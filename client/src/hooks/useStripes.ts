import { useEffect, useState } from "react"

import { Stripe, TWSResponse } from "@shared"
import WS from "src/ws"

export default function useStripes(ws: WS | null) {
	const [stripes, setStripes] = useState<Stripe[]>([])

	useEffect(() => {
		if (!ws) return

		return ws.on("message", message => {
			if (typeof message !== "string") return

			const { event, data } = JSON.parse(message) as TWSResponse
			if (event === "get_stripe") setStripes(data)
		})
	}, [ws])

	return stripes
}
