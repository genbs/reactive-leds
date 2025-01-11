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

export function debounce<T extends (...args: any[]) => unknown>(fn: T, wait: number) {
	let timeout: NodeJS.Timeout
	return (...args: Parameters<T>) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => fn(...args), wait)
	}
}

/**
 *
 * @param h  0-360
 * @param s  0-1
 * @param l  0-1
 * @param a  0-1
 * @returns
 */
export function hslToColor(h: number, s: number, l: number, a: number = 1): TColor {
	h = ((h % 360) + 360) % 360
	s = Math.max(0, Math.min(s, 1))
	l = Math.max(0, Math.min(l, 1))
	a = Math.max(0, Math.min(a, 1))

	const c = (1 - Math.abs(2 * l - 1)) * s
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
	const m = l - c / 2

	let r = 0,
		g = 0,
		b = 0

	if (h < 60) {
		r = c
		g = x
		b = 0
	} else if (h < 120) {
		r = x
		g = c
		b = 0
	} else if (h < 180) {
		r = 0
		g = c
		b = x
	} else if (h < 240) {
		r = 0
		g = x
		b = c
	} else if (h < 300) {
		r = x
		g = 0
		b = c
	} else {
		r = c
		g = 0
		b = x
	}

	// Convertiamo la gamma da [0,1] a [0,255]
	// Aggiungiamo m per riportare il nero al livello corretto
	r = Math.round((r + m) * 255)
	g = Math.round((g + m) * 255)
	b = Math.round((b + m) * 255)
	a = Math.round(a * 255)

	return [r, g, b, a]
}
