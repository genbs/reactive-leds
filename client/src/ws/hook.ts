import { useEffect, useState } from "react"

import WS from "./index"

let globalWSInstance: WS | null

export type WSState = [WS | null, boolean]

export default function useWS(url: string, debug?: boolean): WSState {
	const [ws, setWS] = useState<WS | null>(null)
	const [connected, setConnected] = useState(false)

	useEffect(() => {
		if (!globalWSInstance) {
			globalWSInstance = new WS({
				url,
				debug: typeof debug !== "undefined" ? debug : process.env.NODE_ENV === "development",
				onConnect: () => setConnected(true),
				onDisconnect: () => setConnected(false),
			})
		}

		setWS(globalWSInstance)
		setConnected(globalWSInstance.connected)
	}, [url])

	return [ws, connected]
}
