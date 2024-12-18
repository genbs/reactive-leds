import { useEffect, useState } from "react"

import { TStripe, TWSResponse } from "@shared"
import WS from "src/ws"

export default function useStripes(ws?: WS) {
	const [stripes, setStripes] = useState<(TStripe & { code: string })[]>([])

	useEffect(() => {
		if (!ws) return

		return ws.on("message", message => {
			if (typeof message !== "string") return

			const { event, data } = JSON.parse(message) as TWSResponse
			if (event === "get_stripe") {
				setStripes(
					data.map(stripe => {
						return {
							...stripe,
							leds: new Uint8Array(Object.values(stripe.leds)),
							code: "",
						}
					})
				)
			}
		})
	}, [ws])

	function updateStripes(newStripes) {
		const updated = [...stripes]

		for (const newStripe of newStripes) {
			const index = updated.findIndex(stripe => stripe.device.id === newStripe.device.id)

			if (index === -1) {
				updated.push(newStripe)
			} else {
				updated[index] = newStripe
			}
		}

		setStripes(updated)
	}

	return [stripes, updateStripes] as const
}
