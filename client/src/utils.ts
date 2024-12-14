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
