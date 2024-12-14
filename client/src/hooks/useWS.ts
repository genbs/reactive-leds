import { useEffect, useState } from "react"

import { TWSRequest, TWSResponse } from "@shared"
import WebSocket from "../ws/index"

type WS = WebSocket<TWSResponse, TWSRequest>

let globalWSInstance: WS | null

export type WSState = [WS | null, boolean]

export default function useWS(
	url: string = "ws://localhost:8080",
	autoConnect: boolean = true,
	debug: boolean = true
): WSState {
	const [ws, setWS] = useState<WS | null>(globalWSInstance)
	const [connected, setConnected] = useState(globalWSInstance?.connected)

	useEffect(() => {
		if (!globalWSInstance) {
			globalWSInstance = new WebSocket<TWSResponse, TWSRequest>({
				url,
				autoConnect,
				debug: typeof debug !== "undefined" ? debug : process.env.NODE_ENV === "development",
			})
		}

		setWS(globalWSInstance)
		setConnected(globalWSInstance.connected)

		return globalWSInstance.on("connectionChange", setConnected)
	}, [url])

	return [ws, connected]
}
