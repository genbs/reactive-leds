import * as rleds from "./reactive-leds.js"

const hue = Math.floor(Math.random() * 360)
document.documentElement.style.setProperty("--hue", hue)

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
		const li = document.createElement("li")
		li.className = "device-item"
		const label = config.hostname ? `${config.hostname} <span class="device-addr">${key}</span>` : key
		li.innerHTML =
			`<span class="device-ip">${label}</span>` +
			`<span class="device-meta">${config.num_leds} leds</span>` +
			`<span class="device-actions">` +
			`<button class="move-btn" data-dir="-1" ${idx === 0 ? "disabled" : ""}>↑</button>` +
			`<button class="move-btn" data-dir="1" ${idx === devices.length - 1 ? "disabled" : ""}>↓</button>` +
			`<button class="remove-btn">✕</button>` +
			`</span>`
		li.querySelectorAll(".move-btn").forEach(btn =>
			btn.addEventListener("click", () => moveDevice(key, parseInt(btn.dataset.dir)))
		)
		li.querySelector(".remove-btn").addEventListener("click", () => removeDevice(key))
		deviceList.appendChild(li)
	})
}

// add device
{
	const addBtn = document.getElementById("add-device-btn")
	const addInput = document.getElementById("add-device-input")
	const addMessage = document.getElementById("add-device-message")
	const addError = document.getElementById("add-device-error")

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

// proxy
const devicesSection = document.getElementById("devices-section")
{
	const urlInput = document.getElementById("address")
	const error = document.getElementById("proxy-error")
	const message = document.getElementById("proxy-message")
	const beginBtn = document.getElementById("begin-btn")
	let url = localStorage.getItem("proxyUrl") || "ws://localhost:8000"
	let wasConnected = false
	let heartbeat = null
	urlInput.value = url

	async function connect() {
		error.textContent = ""
		message.textContent = t("proxy.connecting")
		const ok = await rleds.begin(url, false)
		message.textContent = ""
		if (!ok) error.textContent = `${t("proxy.cannot_reach")} ${url}`
	}

	urlInput.addEventListener("keydown", e => {
		if (e.key === "Enter") beginBtn.click()
	})
	beginBtn.addEventListener("click", () => {
		url = urlInput.value
		connect()
	})

	connect()

	rleds.onConnectionChange(async connected => {
		document.getElementById("status").className = connected ? "online" : "offline"
		if (connected) {
			error.textContent = ""
			localStorage.setItem("proxyUrl", url)
			wasConnected = true
			devicesSection.removeAttribute("inert")
			await renderDevices()
			//heartbeat = setInterval(heartbeatDevices, 5000)
		} else {
			clearInterval(heartbeat)
			heartbeat = null
			if (wasConnected) error.textContent = t("proxy.lost")
			devicesSection.setAttribute("inert", "")
			examplesPanel.setAttribute("inert", "")
			renderDevices()
		}
	})
}

// strip renderer
const STRIP_PAD = 16,
	STRIP_GAP = 3,
	STRIP_CELL = 24

function hslToRgb(h, s, l) {
	h /= 360
	s /= 100
	l /= 100
	const k = n => (n + h * 12) % 12
	const a = s * Math.min(l, 1 - l)
	const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
	return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const STRIP_LABEL_W = 80

function drawStrips(ctx, devices, colors, orientation = window.stripOrientation ?? "v", width = ctx.canvas.width, yOffset = STRIP_PAD) {
	const entries = [...devices.entries()]
	const maxLeds = Math.max(...entries.map(([, c]) => c.num_leds), 1)
	const labelColor = getComputedStyle(document.documentElement).getPropertyValue("--color-dim").trim()
	ctx.font = `10px "Space Mono", monospace`

	if (orientation === "h") {
		const ledsX = STRIP_PAD + STRIP_LABEL_W
		const cellW = (width - ledsX - STRIP_PAD - (maxLeds - 1) * STRIP_GAP) / maxLeds
		entries.forEach(([ip, config], s) => {
			const y = yOffset + s * (STRIP_CELL + STRIP_GAP)
			ctx.fillStyle = labelColor
			ctx.textAlign = "right"
			ctx.textBaseline = "middle"
			ctx.fillText(config.hostname || ip, ledsX - STRIP_GAP * 2, y + STRIP_CELL / 2, STRIP_LABEL_W - STRIP_GAP * 2)
			const leds = colors.get(ip) ?? []
			for (let i = 0; i < config.num_leds; i++) {
				const [r, g, b, w = 0] = leds[i] ?? [0, 0, 0, 0]
				const mix = w / 255
				ctx.fillStyle = `rgb(${Math.round(r + (255-r)*mix)},${Math.round(g + (255-g)*mix)},${Math.round(b + (255-b)*mix)})`
				ctx.fillRect(ledsX + i * (cellW + STRIP_GAP), y, cellW, STRIP_CELL)
			}
		})
	} else {
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
				const [r, g, b, w = 0] = leds[i] ?? [0, 0, 0, 0]
				const mix = w / 255
				ctx.fillStyle = `rgb(${Math.round(r + (255-r)*mix)},${Math.round(g + (255-g)*mix)},${Math.round(b + (255-b)*mix)})`
				ctx.fillRect(x, ledsY + i * (cellH + STRIP_GAP), STRIP_CELL, cellH)
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
			height: STRIP_PAD * 2 + count * (STRIP_CELL + STRIP_GAP) - STRIP_GAP
		}
	}
	return {
		width: STRIP_PAD * 2 + count * (STRIP_CELL + STRIP_GAP) - STRIP_GAP,
		height: container.clientHeight
	}
}

window.drawStrips = drawStrips
window.sendLEDs = sendLEDs
window.hslToRgb = hslToRgb
window.stripsCanvasSize = stripsCanvasSize
window.STRIP_PAD = STRIP_PAD
window.STRIP_GAP = STRIP_GAP
window.STRIP_CELL = STRIP_CELL
window.STRIP_LABEL_W = STRIP_LABEL_W

document.getElementById("orientation-toggle").addEventListener("click", () => {
	window.stripOrientation = window.stripOrientation === "h" ? "v" : "h"
	localStorage.setItem("stripOrientation", window.stripOrientation)
	window.main?.()
})

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
			.querySelectorAll("#examples_list button[data-example]")
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

	document.getElementById("examples_list").addEventListener("click", e => {
		const name = e.target.dataset.example
		if (name) {
			localStorage.setItem("example", name)
			loadExample(name)
		}
	})

	document.getElementById("preview-dialog").addEventListener(
		"toggle",
		e => {
			if (e.newState === "open") loadExample(localStorage.getItem("example") || "color")
		},
		{ once: true }
	)
}
