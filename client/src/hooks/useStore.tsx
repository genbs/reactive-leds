import { useEffect, useState } from "react"
import store from "src/store"

export function useStore() {
	const [state, setState] = useState(store.state)

	useEffect(() => {
		return store.on("update", setState)
	}, [])

	return state
}
