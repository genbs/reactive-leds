import { useCallback, useEffect, useRef, useState } from "react"

export default function useClientRect<T extends HTMLElement>() {
	const [rect, setRect] = useState<DOMRectReadOnly | null>(null)
	const ref = useRef<T | null>(null)

	const handleResize = useCallback(() => {
		if (ref.current) {
			setRect(ref.current.getBoundingClientRect())
		}
	}, [])

	useEffect(() => {
		if (!ref.current) return

		handleResize() // Calcola le dimensioni iniziali
		window.addEventListener("resize", handleResize)

		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [handleResize])

	return [ref, rect] as const
}
