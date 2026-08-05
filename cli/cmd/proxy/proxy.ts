import {
	bufferToConfig,
	configToBuffer,
	deviceInfoToBuffer,
	PacketType,
	PacketTypeMap,
	statusToBuffer,
} from "@reactive-leds/shared"
import { WebSocketServer } from "ws"
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http"
import { readFileSync, statSync } from "node:fs"
import { extname, join, normalize, resolve, sep } from "node:path"
import { awdlIsActive, awdlWarningLines } from "../../awdl"
import { Command } from "../../cmd"
import proto from "../../protocol"
import { debug, validateDevicePort, validateHost, validatePort } from "../../utils"
import { formatDevice, scan, ScanResult } from "../wifi"

const SCAN_INTERVAL = 10_000
const MAX_PROXY_PAYLOAD = 1029 // 8-byte proxy header + start index + 255 RGBW pixels
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])

/**
 * Prevent a remote web page from driving the unauthenticated local proxy.
 * Native WebSocket clients normally omit Origin and remain compatible.
 * The `"*"` entry in allowedOrigins permits any remote origin (trusted-LAN or
 * public-page use); it is the caller's explicit opt-in.
 */
export function isAllowedWebSocketOrigin(origin: string | undefined, allowedOrigins: string[] = []): boolean {
	if (!origin) return true
	try {
		const parsed = new URL(origin)
		return (
			LOOPBACK_HOSTS.has(parsed.hostname) ||
			allowedOrigins.includes("*") ||
			allowedOrigins.includes(parsed.origin)
		)
	} catch {
		return false
	}
}

/**
 * Parse the --origin flag: comma-separated origins, or a wildcard for any
 * origin. The wildcard accepts both "*" and "all" — "*" globs in interactive
 * shells, "all" is quote-free.
 */
export function parseAllowedOrigins(origin?: string): string[] {
	if (!origin) return []
	return origin
		.split(",")
		.map(value => value.trim().toLowerCase())
		.filter(Boolean)
		.map(value => (value === "*" || value === "all" ? "*" : new URL(value).origin))
}
function status(requestId: number, ok: boolean): Uint8Array {
	return new Uint8Array([requestId, ok ? 1 : 0])
}

function withPayload(requestId: number, payload: Uint8Array): Uint8Array {
	const response = new Uint8Array(1 + payload.length)
	response[0] = requestId
	response.set(payload, 1)
	return response
}

export const proxyCommand: Command = {
	name: "proxy",
	description:
		"Start the WebSocket proxy between browser clients and the firmware.\nScans the LAN every 10 seconds and shows discovered devices, updating live in the terminal.\nOn macOS it warns when AWDL (AirDrop/AirPlay) is active, since it can cause micro-lag when streaming over WiFi.",
	args: [
		{ required: false, name: "host", type: String, default: "127.0.0.1", validator: validateHost },
		{ required: false, name: "port", type: Number, default: 8000, validator: validatePort },
		{ required: false, name: "device_port", type: Number, default: 4210, validator: validateDevicePort },
		{ required: false, name: "ui", flag: "--ui", type: Boolean, default: false },
		{ required: false, name: "origin", flag: "--origin", type: String },
	],
	examples: [
		"proxy --ui",
		"proxy --origin https://genbs.github.io",
		"proxy --origin all",
	],
	execute: async (host: string, port: number, devicePort: number, ui: boolean, origin?: string) =>
		proxy(host, port, devicePort, { ui, allowedOrigins: parseAllowedOrigins(origin) }),
}

/** Handle one proxy request and dispatch it to the reactive-leds backend. */
export async function handleProxyMessage(payload: Uint8Array): Promise<Uint8Array | null> {
	const requestId = payload[0] ?? 0

	if (payload.length < 8) {
		console.warn(`Invalid proxy payload: ${payload.length} bytes`)
		return status(requestId, false)
	}

	const ip = payload[1] + "." + payload[2] + "." + payload[3] + "." + payload[4]
	const port = (payload[5] << 8) | payload[6]
	const packetType = payload[7] as PacketType
	const packet = payload.subarray(8)

	debug("proxy", `IP: ${ip}, Port: ${port}, Packet type: ${PacketTypeMap[packetType]}`)

	if (!validateDevicePort(String(port))) {
		console.warn(`Invalid proxy target port: ${port}`)
		return status(requestId, false)
	}

	if (!(packetType in PacketTypeMap)) {
		console.warn(`Unhandled packet type: ${packetType}`)
		return status(requestId, false)
	}

	if (packetType === PacketType.SET_LEDS && (packet.length < 5 || (packet.length - 1) % 4 !== 0)) {
		console.warn(`Invalid SET_LEDS payload: ${packet.length} bytes`)
		return null
	}

	switch (packetType) {
		case PacketType.PING:
			return status(requestId, await proto.ping(ip, port))

		case PacketType.SET_CONFIG:
			if (packet.length < 4) {
				console.warn(`Invalid SET_CONFIG payload: ${packet.length} bytes`)
				return status(requestId, false)
			}
			return status(requestId, await proto.setConfig(ip, port, bufferToConfig(packet)))

		case PacketType.GET_CONFIG: {
			const config = await proto.getConfig(ip, port)
			return config ? withPayload(requestId, configToBuffer(config)) : status(requestId, false)
		}

		case PacketType.SET_LEDS:
			proto.setLEDs(ip, port, packet.subarray(1), packet[0])
			return null

		case PacketType.GET_INFO: {
			const info = await proto.getInfo(ip, port)
			return info ? withPayload(requestId, deviceInfoToBuffer(info)) : status(requestId, false)
		}

		case PacketType.GET_STATUS: {
			const deviceStatus = await proto.getStatus(ip, port)
			return deviceStatus ? withPayload(requestId, statusToBuffer(deviceStatus)) : status(requestId, false)
		}

		case PacketType.RESET_WIFI:
			return status(requestId, await proto.resetWifi(ip, port))
	}
}

export interface ProxyOptions {
	ui?: boolean
	allowedOrigins?: string[]
}

const MIME_TYPES: Record<string, string> = {
	".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json",
}

export function resolveUiDirectory(): string {
	const candidates = [join(__dirname, "ui"), resolve(__dirname, "../../../docs")]
	const found = candidates.find(candidate => { try { return statSync(join(candidate, "index.html")).isFile() } catch { return false } })
	if (!found) throw new Error("UI assets not found. Reinstall or rebuild @reactive-leds/cli.")
	return found
}

export function serveUi(uiDirectory: string, request: IncomingMessage, response: ServerResponse): void {
	let pathname: string
	try { pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname) } catch {
		response.writeHead(400).end("Bad request")
		return
	}
	const relativePath = normalize(pathname === "/" ? "index.html" : pathname.slice(1))
	const filePath = resolve(uiDirectory, relativePath)
	if (!filePath.startsWith(resolve(uiDirectory) + sep)) {
		response.writeHead(403).end("Forbidden")
		return
	}
	try {
		const body = readFileSync(filePath)
		response.writeHead(200, { "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(body)
	} catch {
		response.writeHead(404).end("Not found")
	}
}

export async function proxy(host = "127.0.0.1", port = 8000, devicePort = 4210, options: ProxyOptions = {}) {
	const uiDirectory = options.ui ? resolveUiDirectory() : undefined
	const requestHandler = (request: IncomingMessage, response: ServerResponse) => {
		if (uiDirectory) serveUi(uiDirectory, request, response)
		else response.writeHead(404).end("Not found")
	}
	const server = createHttpServer(requestHandler)

	return new Promise<void>(resolve => {
		const wss = new WebSocketServer({
			server,
			perMessageDeflate: false,
			maxPayload: MAX_PROXY_PAYLOAD,
			verifyClient: (info: { origin: string }) => isAllowedWebSocketOrigin(info.origin, options.allowedOrigins),
		})

		wss.on("connection", ws => {
			debug("proxy", "New connection established")

			ws.on("message", async (payload: Uint8Array) => {
				try {
					const response = await handleProxyMessage(payload)
					if (response) ws.send(response)
				} catch (err) {
					console.error("[Proxy Error]:", err)
					ws.send(new Uint8Array([payload[0] ?? 0, 0]))
				}
			})

			ws.on("close", () => debug("proxy", "Connection closed"))
		})

		let scanTimer: ReturnType<typeof setInterval>
		let rendering = false
		async function render() {
			if (rendering) return
			rendering = true
			try {
				const showAwdlWarning = await awdlIsActive()
				const showAwdlWarningLine = showAwdlWarning ? ["", ...awdlWarningLines("proxy").map(line => "  " + line)] : []

				const devices = await scan(devicePort, { useCache: false, verbose: false })
				const statuses = await Promise.all(devices.map(d => proto.getStatus(d.ip, d.port).catch(() => null)))
				const lines = [
					`  Proxy: ws://${host}:${port}  devices: ${devices.length}   `,
					...(uiDirectory ? [`  UI:    http://${host}:${port}`] : []),
					...showAwdlWarningLine,
					"",
					...devices.map((device, index) => "  " + formatProxyDevice(device, statuses[index]?.rssi)),
				]
				process.stdout.write(`\x1b[H${lines.join("\x1b[K\n")}\x1b[J`)
			} finally {
				rendering = false
			}
		}

		function shutdown() {
			clearInterval(scanTimer)
			process.stdout.write("\nShutting down proxy server...\n")
			resolve()
			wss.close(() => server.close(() => process.stdout.write("Proxy server closed\n")))
		}

		process.on("SIGINT", shutdown)
		process.on("SIGTERM", shutdown)

		server.on("listening", async () => {
			process.stdout.write(`\x1b[H  Proxy: ws://${host}:${port}  ● scanning...\x1b[J`)
			await render()
			scanTimer = setInterval(render, SCAN_INTERVAL)
		})

		server.listen(port, host)
	})
}

function formatProxyDevice(device: ScanResult, rssi?: number): string {
	const rssiStr = rssi !== undefined && rssi !== 0 ? `  rssi ${rssi} dBm` : ""
	return formatDevice(device) + rssiStr
}
