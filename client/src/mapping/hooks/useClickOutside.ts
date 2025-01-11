import { useEffect } from "react"

export default function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent) => void) {
	function handleClickOutside(event: MouseEvent) {
		if (ref.current && !ref.current.contains(event.target as Node)) {
			handler(event)
		}
	}

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [ref])
}
