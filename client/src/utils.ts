import { TColor } from "@shared"

export function hash(str: string): string {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i)
		hash |= 0
	}
	return hash.toString(36).slice(-12)
}

export function style(css: string) {
	// append css to head
	const _hash = hash(css)

	// check if style tag already exists data-id
	if (document.querySelector(`style[data-id="${_hash}"]`)) return

	const style = document.createElement("style")
	style.setAttribute("data-id", _hash)
	style.textContent = css
	document.head.appendChild(style)
}

export function classname(...classes: (string | undefined)[]): string {
	return classes.filter(Boolean).join(" ")
}

export function colorToHex(color?: TColor): string {
	if (!color) return "#000000"

	return `#${color
		.slice(0, 3)
		.map(c => c.toString(16).padStart(2, "0"))
		.join("")}`
}

export function hexToColor(hex: string): TColor {
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	const a = 255
	return [r, g, b, a]
}
