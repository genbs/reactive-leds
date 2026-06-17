import * as rleds from "./reactive-leds.js"

const hue = Math.floor(Math.random() * 360)
document.documentElement.style.setProperty("--hue", hue)
const cs = getComputedStyle(document.documentElement)
const colorError = cs.getPropertyValue("--color-error").trim()
const colorMedium = cs.getPropertyValue("--color-medium").trim()
const colorDark = cs.getPropertyValue("--color-dark").trim()
const colorLight = cs.getPropertyValue("--color-light").trim()
document.querySelector("meta[name='theme-color']").content = `hsl(${hue} 72% 59%)`

document.querySelector("link[rel='icon']").href = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 486 486"><path fill="hsl(${hue} 72% 59%)" d="M455.4 0c16.569 0 30 13.432 30 30v383.661a59.6 59.6 0 0 0-13.884-1.63c-32.853 0-59.485 26.632-59.485 59.485 0 4.781.565 9.43 1.63 13.884H30c-16.568 0-30-13.431-30-30V71.434a59.7 59.7 0 0 0 13.484 1.535c32.853 0 59.485-26.632 59.485-59.485 0-4.637-.53-9.151-1.534-13.484zM48.229 358.825C38.114 348.862 21 356.027 21 370.224V449c0 8.837 7.163 16 16 16h79.961c14.312 0 21.424-17.353 11.229-27.397zM243 90c-84.5 0-153 68.5-153 153s68.5 153 153 153 153-68.5 153-153S327.5 90 243 90m126.039-69c-14.312 0-21.424 17.353-11.229 27.398l79.961 78.777c10.114 9.963 27.229 2.798 27.229-11.399V37c0-8.837-7.163-16-16-16z"/></svg>`
)}`

if (Math.random() > 0.6) document.getElementById("logo-container").classList.add("fill")

document.fonts.ready.then(() => {
	document.body.style.opacity = "1"
})

window.rleds = rleds
window.devices = new Map()
window.stripOrientation = localStorage.getItem("stripOrientation") ?? "v"

// i18n
let strings = {}
let i18nCache = null

function applyStrings(root = document) {
	root.querySelectorAll("[data-i18n]").forEach(el => {
		el.innerHTML = strings[el.dataset.i18n] ?? el.innerHTML
	})
}

async function loadLang(l) {
	i18nCache ??= await fetch("i18n.json").then(r => r.json())
	strings = i18nCache[l] || i18nCache.en
	localStorage.setItem("lang", l)
	document.documentElement.lang = l
	applyStrings()
	const btn = document.getElementById("lang-btn")
	if (btn) btn.textContent = l === "en" ? "IT" : "EN"
}

function t(key) {
	return strings[key] ?? key
}

window.copy = async (id, btn) => {
	await navigator.clipboard.writeText(document.getElementById(id).textContent)
	const orig = btn.textContent
	btn.textContent = "✓"
	setTimeout(() => {
		btn.textContent = orig
	}, 1500)
}

const savedLang = localStorage.getItem("lang")
const browserLang = navigator.language.startsWith("it") ? "it" : "en"
loadLang(savedLang || browserLang)

document.getElementById("lang-btn").addEventListener("click", () => {
	loadLang(document.documentElement.lang === "en" ? "it" : "en")
})

function saveDevices() {
	localStorage.setItem("devices", JSON.stringify([...window.devices.keys()]))
}

async function getDevices() {
	const ips = JSON.parse(localStorage.getItem("devices") || "[]")
	const results = await Promise.all(
		ips.map(async ip => {
			const [address, p] = ip.split(":")
			const port = parseInt(p || "4210")
			const config = await rleds.getConfig(address, port)
			return config ? [ip, { ...config, address, port }] : null
		})
	)
	window.devices = new Map(results.filter(Boolean))
	saveDevices()
}

async function addDevice(address, port) {
	try {
		const config = await rleds.getConfig(address, port)
		if (!config) return false
		window.devices.set(`${address}:${port}`, { ...config, address, port })
		saveDevices()
		renderDevices()
		return true
	} catch {
		return false
	}
}

function removeDevice(key) {
	window.devices.delete(key)
	saveDevices()
	renderDevices()
}

function moveDevice(key, dir) {
	const entries = [...window.devices.entries()]
	const i = entries.findIndex(([k]) => k === key)
	const j = i + dir
	if (j < 0 || j >= entries.length) return
	;[entries[i], entries[j]] = [entries[j], entries[i]]
	window.devices = new Map(entries)
	saveDevices()
	renderDevices()
}

const deviceList = document.getElementById("device-list")
const deviceCount = document.getElementById("device-count")
const examplesPanel = document.getElementById("examples-panel")

// ping every device; drop the ones that stopped answering
async function heartbeatDevices() {
	const checks = await Promise.all(
		[...window.devices.entries()].map(async ([key, { address, port }]) => ({
			key,
			alive: await rleds.ping(address, port),
		}))
	)
	const dead = checks.filter(r => !r.alive)
	if (dead.length === 0) return
	dead.forEach(r => window.devices.delete(r.key))
	saveDevices()
	renderDevices()
}

async function renderDevices() {
	deviceList.innerHTML = ""
	await getDevices()
	const devices = [...window.devices.entries()]
	deviceCount.textContent = devices.length
	examplesPanel.toggleAttribute("inert", devices.length === 0)

	devices.forEach(([key, config], idx) => {
		const div = document.createElement("div")
		div.className = "device-item"
		const label = config.hostname ? `${config.hostname} <span class="text-xs color-medium">${key}</span>` : key
		div.innerHTML =
			`<span class="color-primary">›</span>` +
			`<span class="flex flex-col">${label}</span>` +
			`<span class="text-xs color-medium">${config.num_leds} leds</span>` +
			`<div class="flex gap-s">` +
			`<div class="flex">` +
			`<button class="small" data-action="move" data-dir="-1" ${idx === 0 ? "disabled" : ""}>↑</button>` +
			`<button class="small" data-action="move" data-dir="1" ${idx === devices.length - 1 ? "disabled" : ""}>↓</button>` +
			`</div>` +
			`<button class="small" data-action="remove">✕</button>` +
			`</div>`
		div
			.querySelectorAll("[data-action='move']")
			.forEach(btn => btn.addEventListener("click", () => moveDevice(key, parseInt(btn.dataset.dir))))
		div.querySelector("[data-action='remove']").addEventListener("click", () => removeDevice(key))
		deviceList.appendChild(div)
	})

	// let other views (e.g. the mapping editor) refresh when the device set changes
	window.dispatchEvent(new Event("devices-changed"))
}

// add device — one reusable widget, wired wherever a .add-device block appears
// (proxy panel + mapping dialog share the same markup, CSS and behaviour)
function initAddDevice(root) {
	const addBtn = root.querySelector(".add-device-btn")
	const addInput = root.querySelector(".add-device-input")
	const addMessage = root.querySelector(".add-device-message")
	const addError = root.querySelector(".add-device-error")

	addInput.addEventListener("keyup", e => {
		addError.textContent = ""
		const valid = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(addInput.value)
		addBtn.disabled = !valid
		if (e.key === "Enter" && valid) addBtn.click()
	})

	addBtn.addEventListener("click", async () => {
		const [address, p] = addInput.value.split(":")
		const port = parseInt(p || "4210")

		addInput.disabled = addBtn.disabled = true
		addMessage.textContent = t("device.looking")
		addError.textContent = ""

		const ok = await addDevice(address, port)
		addMessage.textContent = ""
		if (ok) addInput.value = ""
		else addError.textContent = `${t("device.cannot_reach")} ${address}:${port}`

		addInput.disabled = false
		addBtn.disabled = false
	})
}

document.querySelectorAll(".add-device").forEach(initAddDevice)

// proxy — a single connection mirrored across every .proxy-connect widget
// (live-preview + mapping dialog share the same markup, CSS and behaviour)
const devicesSectionList = document.getElementsByClassName("devices-section")
{
	const widgets = [...document.querySelectorAll(".proxy-connect")].map(root => ({
		input: root.querySelector(".proxy-address"),
		begin: root.querySelector(".proxy-begin"),
		message: root.querySelector(".proxy-message"),
		error: root.querySelector(".proxy-error"),
		status: root.querySelector(".proxy-status"),
	}))
	let url = localStorage.getItem("proxyUrl") || "ws://localhost:8000"
	let wasConnected = false

	const setUrl = value => {
		url = value
		widgets.forEach(w => (w.input.value = value))
	}

	async function connect() {
		widgets.forEach(w => {
			w.error.textContent = ""
			w.message.textContent = t("proxy.connecting")
		})
		const ok = await rleds.begin(url, false)
		widgets.forEach(w => {
			w.message.textContent = ""
			if (!ok) w.error.textContent = `${t("proxy.cannot_reach")} ${url}`
		})
	}

	widgets.forEach(w => {
		w.input.value = url
		w.input.addEventListener("keydown", e => {
			if (e.key === "Enter") w.begin.click()
		})
		w.begin.addEventListener("click", () => {
			setUrl(w.input.value)
			connect()
		})
	})

	connect()

	rleds.onConnectionChange(async connected => {
		widgets.forEach(w => (w.status.className = "proxy-status " + (connected ? "online" : "offline")))
		if (connected) {
			widgets.forEach(w => (w.error.textContent = ""))
			localStorage.setItem("proxyUrl", url)
			wasConnected = true
			Array.from(devicesSectionList).forEach(section => section.removeAttribute("inert"))
			await renderDevices()
		} else {
			if (wasConnected) widgets.forEach(w => (w.error.textContent = t("proxy.lost")))
			Array.from(devicesSectionList).forEach(section => section.setAttribute("inert", ""))
			examplesPanel.setAttribute("inert", "")
			renderDevices()
		}
	})
}

// strip renderer — layout constants (px)
const STRIP_PAD = 16, // outer padding
	STRIP_GAP = 3, // gap between LED cells and between strips
	STRIP_CELL = 24, // size of one LED cell
	STRIP_LABEL_W = 80 // room reserved for the hostname label

function hslToRgb(h, s, l) {
	h /= 360
	s /= 100
	l /= 100
	const k = n => (n + h * 12) % 12
	const a = s * Math.min(l, 1 - l)
	const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
	return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

// blend an RGBW LED down to a display rgb() string (white raises every channel toward 255)
function ledFill([r, g, b, w = 0] = [0, 0, 0, 0]) {
	const mix = w / 255
	return `rgb(${Math.round(r + (255 - r) * mix)},${Math.round(g + (255 - g) * mix)},${Math.round(b + (255 - b) * mix)})`
}

function drawStrips(
	ctx,
	devices,
	colors,
	orientation = window.stripOrientation ?? "v",
	width = ctx.canvas.width,
	yOffset = STRIP_PAD,
	rowSize = STRIP_CELL
) {
	const entries = [...devices.entries()]
	const maxLeds = Math.max(...entries.map(([, c]) => c.num_leds), 1)
	const labelColor = getComputedStyle(document.documentElement).getPropertyValue("--color-medium").trim() || "#888"

	if (orientation === "h") {
		ctx.font = `${Math.min(10, Math.round(rowSize * 0.6))}px "Space Mono", monospace`
		const ledsX = STRIP_PAD + STRIP_LABEL_W
		const cellW = (width - ledsX - STRIP_PAD - (maxLeds - 1) * STRIP_GAP) / maxLeds
		entries.forEach(([ip, config], s) => {
			const y = yOffset + s * (rowSize + STRIP_GAP)
			ctx.fillStyle = labelColor
			ctx.textAlign = "right"
			ctx.textBaseline = "middle"
			ctx.fillText(config.hostname || ip, ledsX - STRIP_GAP * 2, y + rowSize / 2, STRIP_LABEL_W - STRIP_GAP * 2)
			const leds = colors.get(ip) ?? []
			for (let i = 0; i < config.num_leds; i++) {
				ctx.fillStyle = ledFill(leds[i])
				ctx.fillRect(ledsX + i * (cellW + STRIP_GAP), y, cellW, rowSize)
			}
		})
	} else {
		ctx.font = `10px "Space Mono", monospace`
		const ledsY = yOffset + STRIP_LABEL_W
		const cellH = Math.max(1, (ctx.canvas.height - ledsY - STRIP_PAD - (maxLeds - 1) * STRIP_GAP) / maxLeds)
		entries.forEach(([ip, config], s) => {
			const x = STRIP_PAD + s * (STRIP_CELL + STRIP_GAP)
			ctx.fillStyle = labelColor
			ctx.textAlign = "center"
			ctx.textBaseline = "bottom"
			ctx.fillText(config.hostname || ip, x + STRIP_CELL / 2, ledsY - STRIP_GAP, STRIP_CELL + 20)
			const leds = colors.get(ip) ?? []
			for (let i = 0; i < config.num_leds; i++) {
				ctx.fillStyle = ledFill(leds[i])
				ctx.fillRect(x, ledsY + (config.num_leds - 1 - i) * (cellH + STRIP_GAP), STRIP_CELL, cellH)
			}
		})
	}
}

function sendLEDs(devices, colors) {
	for (const [ip, config] of devices.entries()) {
		const leds = colors.get(ip) ?? []
		const data = new Uint8Array(config.num_leds * 5)
		for (let i = 0; i < config.num_leds; i++) data.set([i, ...(leds[i] ?? [0, 0, 0, 0])], i * 5)
		window.rleds.setLEDs(config.address, config.port, data)
	}
}

function stripsCanvasSize(devices, container) {
	const count = Math.max(devices.size, 1)
	if (window.stripOrientation === "h") {
		return {
			width: container.clientWidth,
			height: STRIP_PAD * 2 + count * (STRIP_CELL + STRIP_GAP) - STRIP_GAP,
		}
	}
	return {
		width: STRIP_PAD * 2 + count * (STRIP_CELL + STRIP_GAP) - STRIP_GAP,
		height: container.clientHeight,
	}
}

// shared strip-preview canvas, used by every example fragment
const previewCanvas = document.getElementById("preview-canvas")
const previewCtx = previewCanvas?.getContext("2d")

// (re)size the shared preview to the current device count / orientation and clear
// it. Returns the context so an example can `const ctx = fitPreview()` and draw.
function fitPreview() {
	const size = stripsCanvasSize(window.devices, previewCanvas.parentElement)
	previewCanvas.width = size.width
	previewCanvas.height = size.height
	previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
	return previewCtx
}

// API the dynamically-loaded example fragments (color/chase/audio.html) rely on
Object.assign(window, {
	drawStrips,
	sendLEDs,
	hslToRgb,
	stripsCanvasSize,
	previewCanvas,
	previewCtx,
	fitPreview,
	STRIP_PAD,
	STRIP_GAP,
	STRIP_CELL,
})

document.getElementById("orientation-toggle").addEventListener("click", () => {
	window.stripOrientation = window.stripOrientation === "h" ? "v" : "h"
	localStorage.setItem("stripOrientation", window.stripOrientation)
	window.main?.()
})

// console helper: populate fake devices to preview the UI without hardware
window.mockDevices = (count = 4, num_leds = 16) => {
	window.devices = new Map(
		Array.from({ length: count }, (_, i) => {
			const ip = `192.168.1.${10 + i}:4210`
			return [ip, { address: `192.168.1.${10 + i}`, port: 4210, num_leds, hostname: `strip-${i + 1}`, pin: 18 }]
		})
	)
	examplesPanel.removeAttribute("inert")
	window.main?.()
}

// examples
{
	const container = document.getElementById("example-container")
	const sourceLink = document.getElementById("example-source")

	async function loadExample(name) {
		document
			.querySelectorAll("#examples-list button[data-example]")
			.forEach(btn => btn.classList.toggle("active", btn.dataset.example === name))
		window.example_cleanup?.()

		sourceLink.href = `https://github.com/genbs/reactive-leds/blob/master/docs/${name}.html`

		const html = await fetch(name + ".html").then(r => r.text())
		const doc = new DOMParser().parseFromString(html, "text/html")

		container.innerHTML = ""
		for (const node of doc.body.childNodes) if (node.nodeName !== "SCRIPT") container.appendChild(node.cloneNode(true))
		for (const src of doc.querySelectorAll("script")) {
			const s = document.createElement("script")
			s.textContent = `;(function(){${src.textContent}})()`
			container.appendChild(s)
		}

		applyStrings(container)
		window.main()
	}

	document.getElementById("examples-list").addEventListener("click", e => {
		const name = e.target.dataset.example
		if (name) {
			localStorage.setItem("example", name)
			loadExample(name)
		}
	})

	// load the example on first open; on later opens just re-fit the canvas to the current size
	const previewDialog = document.getElementById("live-preview-dialog")
	let loaded = false
	previewDialog.addEventListener("toggle", e => {
		if (e.newState !== "open") return
		if (loaded) return window.main?.()
		loaded = true
		loadExample(localStorage.getItem("example") || "color")
	})

	window.addEventListener("resize", () => {
		if (previewDialog.open) window.main?.()
	})
}

// mapping editor
{
	const dialog = document.getElementById("mapping-dialog")
	const canvas = document.getElementById("mapping-canvas")
	const ctx = canvas.getContext("2d")
	let presetCanvas = new OffscreenCanvas(1, 1)
	let presetCtx = presetCanvas.getContext("2d")
	let ledOutBuffers = new Map()

	function computeLEDColors() {
		ledOutBuffers.clear()
		if (!window.devices.size || !presetCanvas.width || !presetCanvas.height) return
		const imageData = presetCtx.getImageData(0, 0, presetCanvas.width, presetCanvas.height)
		for (const [ip, config] of window.devices.entries()) {
			const quad = maps.get(ip)
			if (!quad) continue
			const out = new Uint8Array(config.num_leds * 5)
			rleds.sampleStrip(
				imageData.data,
				[presetCanvas.width, presetCanvas.height],
				[cols, rows],
				quad,
				config.num_leds,
				0,
				out
			)
			ledOutBuffers.set(ip, out)
		}
	}

	// Mirror of sampleMatrix' internal layout: it samples `steps` LEDs as an
	// lCols×lRows serpentine grid sized from the quad's pixel aspect ratio.
	// lCols===1 or lRows===1 → linear strip; otherwise it zig-zags.
	function ledLayout(quad, steps) {
		const cellW = canvas.width / cols
		const cellH = canvas.height / rows
		const physW = (quad[2] - quad[0]) * cellW
		const physH = (quad[7] - quad[1]) * cellH
		const ar = physH > 0 ? physW / physH : 1
		const lCols = Math.max(1, Math.round(Math.sqrt(steps * ar)))
		const lRows = Math.ceil(steps / lCols)
		return [lCols, lRows]
	}

	function drawSampleDots() {
		const cellW = canvas.width / cols
		const cellH = canvas.height / rows
		ctx.lineWidth = 0.5
		for (const [ip, config] of window.devices.entries()) {
			const quad = maps.get(ip)
			const out = ledOutBuffers.get(ip)
			if (!quad || !out) continue
			const [x0, y0, x1, y1, x2, y2, x3, y3] = quad
			const [lCols, lRows] = ledLayout(quad, config.num_leds)
			for (let i = 0; i < config.num_leds; i++) {
				let lr = Math.floor(i / lCols)
				let lc = i % lCols
				if (lr % 2 === 1) lc = lCols - 1 - lc
				const u = (lc + 0.5) / lCols
				const v = (lr + 0.5) / lRows
				const tx = (1 - u) * x0 + u * x1,
					ty = (1 - u) * y0 + u * y1
				const bx = (1 - u) * x3 + u * x2,
					by = (1 - u) * y3 + u * y2
				const gx = (1 - v) * tx + v * bx,
					gy = (1 - v) * ty + v * by
				const px = gx * cellW,
					py = gy * cellH
				const r = out[i * 5 + 1],
					g = out[i * 5 + 2],
					b = out[i * 5 + 3]
				ctx.fillStyle = `rgb(${r},${g},${b})`
				ctx.strokeStyle = r + g + b < 200 ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.45)"
				ctx.beginPath()
				ctx.arc(px, py, 3, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()
			}
		}
	}
	const deviceListEl = document.getElementById("map-device-list")
	// rows are built once per device set; render() only refreshes the bits that
	// actually change per frame (selected highlight + serpentine/linear badge),
	// so the DOM isn't torn down and rebuilt on every drag/animation tick.
	const deviceRows = new Map() // ip -> { el, badge }
	let builtOrder = []

	function buildDeviceList() {
		const entries = [...window.devices.entries()]
		const n = entries.length
		deviceListEl.innerHTML = ""
		deviceRows.clear()
		entries.forEach(([ip, config], idx) => {
			const hue = (idx / n) * 360
			const div = document.createElement("div")
			div.className =
				"flex align-center nowrap text-overflow gap-s pd-s pointer" + (idx > 0 ? " border-top-primary-light" : "")
			div.innerHTML =
				`<span class="square" style="background:hsl(${hue},80%,65%)"></span>` +
				`<span>${config.hostname || ip}</span>` +
				`<span class="text-xs"></span>` +
				`<span class="text-xs color-medium">${config.num_leds} leds</span>`
			div.addEventListener("click", () => {
				selected = ip
				render()
			})
			deviceListEl.appendChild(div)
			deviceRows.set(ip, { el: div, badge: div.children[2] })
		})
		builtOrder = entries.map(([ip]) => ip)
	}

	function updateDeviceList() {
		const ips = [...window.devices.keys()]
		const sameSet = ips.length === builtOrder.length && ips.every((ip, i) => ip === builtOrder[i])
		if (!sameSet) buildDeviceList()
		for (const [ip, { el, badge }] of deviceRows) {
			const config = window.devices.get(ip)
			if (!config) continue
			const quad = maps.get(ip)
			const [lCols, lRows] = quad ? ledLayout(quad, config.num_leds) : [1, 1]
			const serpentine = lCols > 1 && lRows > 1
			el.classList.toggle("selected", ip === selected)
			const text = `${lCols}×${lRows} ${serpentine ? "serpentine" : "linear"}`
			if (badge.textContent !== text) badge.textContent = text
			const color = serpentine ? colorError : "inherit"
			if (badge.style.color !== color) badge.style.color = color
		}
	}

	const colsInput = document.getElementById("map-cols")
	const rowsInput = document.getElementById("map-rows")
	const resetBtn = document.getElementById("map-reset")
	const presetSelect = document.getElementById("map-preset")
	const snippetEl = document.getElementById("map-snippet")
	const copyBtn = document.getElementById("map-copy")

	let cols = parseInt(localStorage.getItem("map-cols") ?? "10")
	let rows = parseInt(localStorage.getItem("map-rows") ?? "10")
	let preset = localStorage.getItem("map-preset") ?? "col-row"
	if (preset === "none") preset = "col-row"
	let maps = new Map()
	let selected = null
	let dragState = null

	colsInput.value = cols
	rowsInput.value = rows
	presetSelect.value = preset

	window.gridSize = [cols, rows]
	window.mappings = []

	try {
		const saved = JSON.parse(localStorage.getItem("mappings") ?? "null")
		if (Array.isArray(saved)) maps = new Map(saved)
	} catch {}

	function ctp(cx, cy) {
		return [(cx * canvas.width) / cols, (cy * canvas.height) / rows]
	}
	function ptc(px, py) {
		return [(px * cols) / canvas.width, (py * rows) / canvas.height]
	}
	// pointer event -> canvas-internal pixels. offsetX/offsetY are in the canvas'
	// *displayed* size, which differs from its internal resolution whenever CSS
	// scales it (padding, flex shrink, HiDPI). Map through the real rect so hit
	// testing against ctp() coordinates stays correct.
	function eventPos(e) {
		const rect = canvas.getBoundingClientRect()
		return [
			((e.clientX - rect.left) / rect.width) * canvas.width,
			((e.clientY - rect.top) / rect.height) * canvas.height,
		]
	}

	function defaultMaps() {
		const entries = [...window.devices.entries()]
		const n = entries.length || 1
		maps = new Map()
		entries.forEach(([ip], i) => {
			const x0 = (i / n) * cols
			const x1 = ((i + 1) / n) * cols
			maps.set(ip, [x0, 0, x1, 0, x1, rows, x0, rows])
		})
		persist()
	}

	// give a default quad to any device that doesn't have one yet (e.g. just
	// added from the device input), without disturbing the existing maps.
	function ensureMaps() {
		const entries = [...window.devices.entries()]
		const n = entries.length || 1
		let added = false
		entries.forEach(([ip], i) => {
			if (maps.has(ip)) return
			const x0 = (i / n) * cols
			const x1 = ((i + 1) / n) * cols
			maps.set(ip, [x0, 0, x1, 0, x1, rows, x0, rows])
			added = true
		})
		if (added) persist()
	}

	function exportSnippet() {
		const devices = {}
		for (const [ip, config] of window.devices.entries()) {
			const q = maps.get(ip)
			if (q) devices[config.hostname || ip] = q
		}
		const obj = { grid: [cols, rows], devices }
		return JSON.stringify(obj, null, 2)
	}

	function persist() {
		const entries = [...window.devices.entries()]
		window.mappings = entries.map(([ip]) => maps.get(ip) ?? null)
		window.gridSize = [cols, rows]
		localStorage.setItem("mappings", JSON.stringify([...maps.entries()]))
		if (snippetEl) snippetEl.textContent = exportSnippet()
	}

	function isInsideQuad(px, py, quad) {
		const pts = []
		for (let i = 0; i < 4; i++) pts.push(ctp(quad[i * 2], quad[i * 2 + 1]))
		let inside = true
		for (let i = 0; i < 4; i++) {
			const [ax, ay] = pts[i],
				[bx, by] = pts[(i + 1) % 4]
			if ((bx - ax) * (py - ay) - (by - ay) * (px - ax) < 0) {
				inside = false
				break
			}
		}
		if (inside) return true
		// fallback for degenerate quads (zero area): padded bounding box
		const xs = pts.map(p => p[0]),
			ys = pts.map(p => p[1])
		const pad = 8
		return (
			px >= Math.min(...xs) - pad &&
			px <= Math.max(...xs) + pad &&
			py >= Math.min(...ys) - pad &&
			py <= Math.max(...ys) + pad
		)
	}

	function nearCorner(px, py, quad) {
		for (let i = 0; i < 4; i++) {
			const [cx, cy] = ctp(quad[i * 2], quad[i * 2 + 1])
			if (Math.hypot(px - cx, py - cy) < 10) return i
		}
		return -1
	}

	function rotateHandlePos(quad) {
		const [ex, ey] = ctp((quad[4] + quad[6]) / 2, (quad[5] + quad[7]) / 2)
		return [ex, ey]
	}

	function rotateQuad(quad) {
		const cx = (quad[0] + quad[2] + quad[4] + quad[6]) / 4
		const cy = (quad[1] + quad[3] + quad[5] + quad[7]) / 4
		const out = [...quad]
		for (let i = 0; i < 4; i++) {
			const dx = quad[i * 2] - cx,
				dy = quad[i * 2 + 1] - cy
			out[i * 2] = Math.round(cx - dy)
			out[i * 2 + 1] = Math.round(cy + dx)
		}
		// shift to keep within grid bounds
		const minX = Math.min(out[0], out[2], out[4], out[6])
		const maxX = Math.max(out[0], out[2], out[4], out[6])
		const minY = Math.min(out[1], out[3], out[5], out[7])
		const maxY = Math.max(out[1], out[3], out[5], out[7])
		const shiftX = minX < 0 ? -minX : maxX > cols ? cols - maxX : 0
		const shiftY = minY < 0 ? -minY : maxY > rows ? rows - maxY : 0
		for (let i = 0; i < 4; i++) {
			out[i * 2] += shiftX
			out[i * 2 + 1] += shiftY
		}
		return out
	}

	const previewCanvas = document.getElementById("mapping-preview")
	const previewCtx = previewCanvas.getContext("2d")

	let animTime = 0
	let animRaf = null

	function circleCenter() {
		const rx = (cols / 2) * 0.6,
			ry = (rows / 2) * 0.6
		return [cols / 2 + rx * Math.cos(animTime), rows / 2 + ry * Math.sin(animTime)]
	}

	function presetColor(i, j) {
		const u = i / cols,
			v = j / rows
		if (preset === "col-row") return [Math.round(u * 255), Math.round(v * 255), 0]
		if (preset === "cols") return [Math.round(u * 255), 0, Math.round((1 - u) * 255)]
		if (preset === "rows") return [0, Math.round(v * 255), Math.round((1 - v) * 255)]
		if (preset === "circle") {
			const [cx, cy] = circleCenter()
			return Math.hypot(i + 0.5 - cx, j + 0.5 - cy) < 2.5 ? [30, 30, 30] : [255, 255, 255]
		}
		return null
	}

	function drawPreset() {
		presetCtx.clearRect(0, 0, presetCanvas.width, presetCanvas.height)
		if (preset === "circle") {
			presetCtx.fillStyle = colorLight
			presetCtx.fillRect(0, 0, presetCanvas.width, presetCanvas.height)
			const cw = presetCanvas.width / cols,
				ch = presetCanvas.height / rows
			const [cx, cy] = circleCenter()
			presetCtx.beginPath()
			presetCtx.arc(cx * cw, cy * ch, 2.5 * Math.min(cw, ch), 0, Math.PI * 2)
			presetCtx.fillStyle = colorDark
			presetCtx.fill()
			return
		}
		const cw = presetCanvas.width / cols
		const ch = presetCanvas.height / rows
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const color = presetColor(i, j)
				if (!color) continue
				const [r, g, b] = color
				const x = Math.round(i * cw),
					y = Math.round(j * ch)
				const w = Math.round((i + 1) * cw) - x,
					h = Math.round((j + 1) * ch) - y
				presetCtx.fillStyle = `rgb(${r},${g},${b})`
				presetCtx.fillRect(x, y, w, h)
			}
		}
	}

	function updateAnim() {
		if (preset === "circle" && dialog.open && !animRaf) {
			const loop = () => {
				animTime += 0.012
				render()
				animRaf = preset === "circle" && dialog.open ? requestAnimationFrame(loop) : null
			}
			animRaf = requestAnimationFrame(loop)
		} else if (preset !== "circle" && animRaf) {
			cancelAnimationFrame(animRaf)
			animRaf = null
		}
	}

	function render() {
		const entries = [...window.devices.entries()]
		const n = entries.length

		drawPreset()
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.drawImage(presetCanvas, 0, 0)

		// grid
		const cellW = canvas.width / cols
		const cellH = canvas.height / rows
		ctx.lineWidth = 1
		for (let i = 0; i <= cols; i++) {
			const x = Math.round(i * cellW) + 0.5
			ctx.strokeStyle = i === 0 || i === cols ? colorMedium : `hsl(${hue} 5% 14%)`
			ctx.beginPath()
			ctx.moveTo(x, 0)
			ctx.lineTo(x, canvas.height)
			ctx.stroke()
		}
		for (let j = 0; j <= rows; j++) {
			const y = Math.round(j * cellH) + 0.5
			ctx.strokeStyle = j === 0 || j === rows ? colorMedium : `hsl(${hue} 5% 14%)`
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(canvas.width, y)
			ctx.stroke()
		}
		// cell coordinates
		ctx.fillStyle = colorMedium
		ctx.font = `${Math.max(8, Math.min(10, cellW * 0.3))}px "Space Mono", monospace`
		ctx.textAlign = "left"
		ctx.textBaseline = "top"
		if (cellW > 24 && cellH > 16) {
			for (let i = 0; i < cols; i++) {
				for (let j = 0; j < rows; j++) {
					ctx.fillText(`${i},${j}`, Math.round(i * cellW) + 2, Math.round(j * cellH) + 2)
				}
			}
		}

		// quad fills + outlines + labels
		entries.forEach(([ip, config], idx) => {
			const quad = maps.get(ip)
			if (!quad) return
			const hue = (idx / n) * 360
			const isSel = ip === selected
			const pts = []
			for (let i = 0; i < 4; i++) pts.push(ctp(quad[i * 2], quad[i * 2 + 1]))

			const col = `hsl(${hue},80%,65%)`

			// fill + outline
			ctx.beginPath()
			ctx.moveTo(...pts[0])
			for (let i = 1; i < 4; i++) ctx.lineTo(...pts[i])
			ctx.closePath()
			ctx.fillStyle = `hsla(${hue},80%,55%,${isSel ? 0.2 : 0.1})`
			ctx.fill()
			ctx.strokeStyle = col
			ctx.lineWidth = isSel ? 2 : 1
			ctx.stroke()

			const cx = pts.reduce((s, p) => s + p[0], 0) / 4
			const cy = pts.reduce((s, p) => s + p[1], 0) / 4
			const smx = (pts[0][0] + pts[1][0]) / 2,
				smy = (pts[0][1] + pts[1][1]) / 2
			const emx = (pts[2][0] + pts[3][0]) / 2,
				emy = (pts[2][1] + pts[3][1]) / 2
			const fullLen = Math.hypot(emx - smx, emy - smy)

			// label centered: LED layout badge above the hostname
			ctx.textAlign = "center"
			ctx.textBaseline = "middle"
			const oy = cy + 10
			const hostY = oy - (fullLen > 30 ? 10 : 0)

			const [lCols, lRows] = ledLayout(quad, config.num_leds)
			const serpentine = lCols > 1 && lRows > 1
			ctx.font = `9px "Space Mono", monospace`
			ctx.fillStyle = serpentine ? colorError : `hsl(${hue},55%,72%)`
			ctx.fillText(`${lCols}×${lRows} ${serpentine ? "serpentine" : "linear"}`, cx, hostY - 13)

			ctx.font = `11px "Space Mono", monospace`
			ctx.fillStyle = col
			ctx.fillText(config.hostname || ip, cx, hostY)

			// arrow centered, fixed small size
			if (fullLen > 30) {
				const ux = (emx - smx) / fullLen,
					uy = (emy - smy) / fullLen
				const half = 14
				const tx = cx + ux * half,
					ty = oy + uy * half + 14
				const bx = cx - ux * half,
					by = oy - uy * half + 14
				const hw = 4,
					hs = 8
				ctx.strokeStyle = col
				ctx.lineWidth = 1.5
				ctx.beginPath()
				ctx.moveTo(bx, by)
				ctx.lineTo(tx - ux * hs, ty - uy * hs)
				ctx.stroke()
				ctx.beginPath()
				ctx.moveTo(tx, ty)
				ctx.lineTo(tx - ux * hs - uy * hw, ty - uy * hs + ux * hw)
				ctx.lineTo(tx - ux * hs + uy * hw, ty - uy * hs - ux * hw)
				ctx.closePath()
				ctx.fillStyle = col
				ctx.fill()
			}
		})

		// corner handles + rotate handle (selected strip only)
		if (selected) {
			const selIdx = entries.findIndex(([ip]) => ip === selected)
			const quad = maps.get(selected)
			if (quad && selIdx >= 0) {
				const hue = (selIdx / n) * 360
				const col = `hsl(${hue},80%,65%)`
				for (let i = 0; i < 4; i++) {
					const [px, py] = ctp(quad[i * 2], quad[i * 2 + 1])
					ctx.fillStyle = col
					ctx.strokeStyle = "#000"
					ctx.lineWidth = 1
					ctx.beginPath()
					ctx.arc(px, py, 5, 0, Math.PI * 2)
					ctx.fill()
					ctx.stroke()
				}
				// rotate handle: square at end-edge midpoint (p2-p3)
				const [rx, ry] = rotateHandlePos(quad)
				const s = 7
				ctx.fillStyle = col
				ctx.strokeStyle = "#000"
				ctx.lineWidth = 1
				ctx.fillRect(rx - s, ry - s, s * 2, s * 2)
				ctx.strokeRect(rx - s, ry - s, s * 2, s * 2)
			}
		}
		computeLEDColors()
		drawSampleDots()
		renderPreview()
		updateDeviceList()
	}

	function renderPreview() {
		if (!window.devices.size) return
		const count = window.devices.size
		const host = previewCanvas.parentElement
		const availH = host.clientHeight
		// shrink each strip row so every strip fits the available height at once
		// (no scroll), but never grow a row past its default size.
		let rowSize = Math.floor((availH - STRIP_PAD * 2 - (count - 1) * STRIP_GAP) / count)
		rowSize = Math.max(2, Math.min(STRIP_CELL, rowSize))
		// block display drops the inline-canvas baseline gap that would otherwise
		// overflow the host by a few px and trip the scrollbar.
		previewCanvas.style.display = "block"
		previewCanvas.width = host.clientWidth
		previewCanvas.height = Math.min(availH, STRIP_PAD * 2 + count * (rowSize + STRIP_GAP) - STRIP_GAP)

		const colors = new Map()
		for (const [ip, config] of window.devices.entries()) {
			const out = ledOutBuffers.get(ip)
			if (!out) {
				colors.set(ip, [])
				continue
			}
			const leds = []
			for (let i = 0; i < config.num_leds; i++)
				leds.push([out[i * 5 + 1], out[i * 5 + 2], out[i * 5 + 3], out[i * 5 + 4]])
			colors.set(ip, leds)
		}

		previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
		window.drawStrips(previewCtx, window.devices, colors, "h", previewCanvas.width, STRIP_PAD, rowSize)
	}

	canvas.addEventListener("mousedown", e => {
		const [px, py] = eventPos(e)
		if (selected) {
			const quad = maps.get(selected)
			if (quad) {
				// rotate handle hit
				const [rx, ry] = rotateHandlePos(quad)
				if (Math.abs(px - rx) <= 7 && Math.abs(py - ry) <= 7) {
					maps.set(selected, rotateQuad(quad))
					persist()
					render()
					return
				}
				const c = nearCorner(px, py, quad)
				if (c >= 0) {
					dragState = { corner: c, startPX: px, startPY: py, initMap: [...quad] }
					return
				}
			}
		}
		for (const [ip] of window.devices.entries()) {
			const quad = maps.get(ip)
			if (quad && isInsideQuad(px, py, quad)) {
				selected = ip
				dragState = { corner: -1, startPX: px, startPY: py, initMap: [...quad] }
				render()
				return
			}
		}
		selected = null
		dragState = null
		render()
	})

	canvas.addEventListener("mousemove", e => {
		const [px, py] = eventPos(e)
		const [cx, cy] = ptc(px, py)

		if (!dragState || !selected) return
		const [dcx, dcy] = ptc(px - dragState.startPX, py - dragState.startPY)
		const sdx = Math.round(dcx),
			sdy = Math.round(dcy)
		const init = dragState.initMap
		const quad = [...init]
		if (dragState.corner >= 0 && !e.shiftKey) {
			// scale: opposite corner stays fixed, all 4 points scale from it
			const c = dragState.corner
			const opp = c ^ 2
			const fixX = init[opp * 2],
				fixY = init[opp * 2 + 1]
			const oldDX = init[c * 2] - fixX,
				oldDY = init[c * 2 + 1] - fixY
			const newDX = oldDX + sdx,
				newDY = oldDY + sdy
			const sx = oldDX !== 0 ? newDX / oldDX : 1
			const sy = oldDY !== 0 ? newDY / oldDY : 1
			for (let i = 0; i < 4; i++) {
				quad[i * 2] = Math.round(fixX + (init[i * 2] - fixX) * sx)
				quad[i * 2 + 1] = Math.round(fixY + (init[i * 2 + 1] - fixY) * sy)
			}
		} else if (dragState.corner >= 0) {
			const c = dragState.corner
			quad[c * 2] = init[c * 2] + sdx
			quad[c * 2 + 1] = init[c * 2 + 1] + sdy
		} else {
			for (let i = 0; i < 4; i++) {
				quad[i * 2] = init[i * 2] + sdx
				quad[i * 2 + 1] = init[i * 2 + 1] + sdy
			}
		}
		// clamp to grid bounds
		for (let i = 0; i < 4; i++) {
			quad[i * 2] = Math.max(0, Math.min(cols, quad[i * 2]))
			quad[i * 2 + 1] = Math.max(0, Math.min(rows, quad[i * 2 + 1]))
		}
		// enforce minimum 1-cell span on each axis
		// quad: p0=start-left, p1=start-right, p2=end-right, p3=end-left
		// X: left side = p0(0), p3(6); right side = p1(2), p2(4)
		// Y: start side = p0(1), p1(3); end side = p2(5), p3(7)
		if (Math.max(quad[0], quad[2], quad[4], quad[6]) - Math.min(quad[0], quad[2], quad[4], quad[6]) < 1) {
			const base = Math.min(Math.min(quad[0], quad[6]), cols - 1)
			quad[0] = base
			quad[6] = base
			quad[2] = base + 1
			quad[4] = base + 1
		}
		if (Math.max(quad[1], quad[3], quad[5], quad[7]) - Math.min(quad[1], quad[3], quad[5], quad[7]) < 1) {
			const base = Math.min(Math.min(quad[1], quad[3]), rows - 1)
			quad[1] = base
			quad[3] = base
			quad[5] = base + 1
			quad[7] = base + 1
		}
		maps.set(selected, quad)
		persist()
		render()
	})

	canvas.addEventListener("mouseleave", () => {
		dragState = null
	})
	canvas.addEventListener("mouseup", () => {
		dragState = null
	})

	colsInput.addEventListener("change", () => {
		cols = Math.max(1, parseInt(colsInput.value) || 10)
		localStorage.setItem("map-cols", cols)
		persist()
		render()
	})
	rowsInput.addEventListener("change", () => {
		rows = Math.max(1, parseInt(rowsInput.value) || 10)
		localStorage.setItem("map-rows", rows)
		persist()
		render()
	})

	resetBtn.addEventListener("click", () => {
		defaultMaps()
		render()
	})

	presetSelect.addEventListener("change", () => {
		preset = presetSelect.value
		localStorage.setItem("map-preset", preset)
		updateAnim()
		render()
	})

	copyBtn.addEventListener("click", () => {
		navigator.clipboard.writeText(exportSnippet()).then(() => {
			copyBtn.textContent = "Copied!"
			setTimeout(() => {
				copyBtn.textContent = "Copy"
			}, 1500)
		})
	})

	function resizeMapping() {
		if (!dialog.open) return
		const wrap = canvas.parentElement
		// reserve room for the strip preview below, then give the rest to the
		// background canvas, which keeps the window's aspect ratio (letterboxed).
		// the reservation is capped so a long device list can't squeeze the
		// canvas away — renderPreview() shrinks the rows to fit that area.
		const count = Math.max(window.devices.size, 1)
		const fullPreviewH = STRIP_PAD * 2 + count * (STRIP_CELL + STRIP_GAP) - STRIP_GAP
		const previewH = Math.min(fullPreviewH, Math.round(wrap.clientHeight * 0.4))
		const availW = wrap.clientWidth
		const availH = Math.max(1, wrap.clientHeight - previewH)
		const ar = window.innerWidth / window.innerHeight
		let w = availW
		let h = w / ar
		if (h > availH) {
			h = availH
			w = h * ar
		}
		w = Math.round(w)
		h = Math.round(h)
		canvas.width = presetCanvas.width = w
		canvas.height = presetCanvas.height = h
		persist()
		render()
	}

	dialog.addEventListener("toggle", e => {
		if (e.newState === "close") {
			cancelAnimationFrame(animRaf)
			animRaf = null
			return
		}
		requestAnimationFrame(() => {
			ensureMaps()
			resizeMapping()
			updateAnim()
		})
	})

	// a device added/removed elsewhere (e.g. the shared add-device input) should
	// refresh the editor live, not only on reopen.
	window.addEventListener("devices-changed", () => {
		if (!dialog.open) return
		ensureMaps()
		render()
	})

	window.addEventListener("resize", resizeMapping)
}
