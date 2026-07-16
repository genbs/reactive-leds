import { bufferToConfig, configToBuffer, deviceInfoToBuffer, PacketType, PacketTypeMap, statusToBuffer } from "@reactive-leds/shared"
import { WebSocketServer } from "ws"
import { awdlIsActive, awdlWarningLines } from "../awdl"
import { Command } from "../cmd"
import proto from "../protocol"
import { debug, validateDevicePort, validateHost, validatePort } from "../utils"
import { formatDevice, scan, ScanResult } from "./wifi"

const SCAN_INTERVAL = 10_000
const MAX_PROXY_PAYLOAD = 1506 // 8-byte proxy header + 1498-byte UDP payload

export const proxyCommand: Command = {
	name: "proxy",
	description:
		"Start the WebSocket proxy between browser clients and the firmware.\nScans the LAN every 10 seconds and shows discovered devices, updating live in the terminal.\nOn macOS it warns when AWDL (AirDrop/AirPlay) is active, since it can cause micro-lag when streaming over WiFi.",
	examples: ["proxy"],
	args: [
		{ required: false, name: "host", type: String, default: "0.0.0.0", validator: validateHost },
		{ required: false, name: "port", type: Number, default: 8000, validator: validatePort },
		{ required: false, name: "device_port", type: Number, default: 4210, validator: validateDevicePort },
	],
	execute: async (host: string, port: number, devicePort: number) => proxy(host, port, devicePort),
}

/**
 * Handle one decoded proxy request and produce the WebSocket response bytes.
 *
 * Request layout: `[requestId, ip(4), port_h, port_l, packetType, ...data]`.
 * Returns `[requestId, ...payload]` (no PacketType byte — the browser correlates
 * by requestId), or `null` for fire-and-forget requests with no response (SET_LEDS).
 *
 * Exported so the dispatch can be unit-tested independently of the server.
 */
export async function handleProxyMessage(payload: Uint8Array): Promise<Uint8Array | null> {
	const requestId = payload[0] ?? 0
	const status = (ok: boolean) => new Uint8Array([requestId, ok ? 1 : 0])

	if (payload.length < 8) {
		console.warn(`Invalid proxy payload: ${payload.length} bytes`)
		return status(false)
	}

	const ip = payload[1] + "." + payload[2] + "." + payload[3] + "." + payload[4]
	const port = (payload[5] << 8) | payload[6]
	const packetType = payload[7] as PacketType
	const packet = payload.subarray(8)

	debug("proxy", `IP: ${ip}, Port: ${port}, Packet type: ${PacketTypeMap[packetType]}`)

	if (!validateDevicePort(String(port))) {
		console.warn(`Invalid proxy target port: ${port}`)
		return status(false)
	}

	if (!(packetType in PacketTypeMap)) {
		console.warn(`Unhandled packet type: ${packetType}`)
		return status(false)
	}

	if (packetType === PacketType.SET_LEDS && (packet.length < 5 || packet.length % 5 !== 0)) {
		console.warn(`Invalid SET_LEDS payload: ${packet.length} bytes`)
		return null
	}
	if (packetType === PacketType.SET_CONFIG && packet.length < 4) {
		console.warn(`Invalid SET_CONFIG payload: ${packet.length} bytes`)
		return status(false)
	}

	// A fresh buffer per response — never share a module-level Uint8Array across
	// concurrent in-flight messages.
	const withPayload = (buf: Uint8Array) => {
		const response = new Uint8Array(1 + buf.length)
		response[0] = requestId
		response.set(buf, 1)
		return response
	}

	switch (packetType) {
		case PacketType.PING:
			return status(await proto.ping(ip, port))

		case PacketType.SET_CONFIG:
			return status(await proto.setConfig(ip, port, bufferToConfig(packet)))

		case PacketType.GET_CONFIG: {
			const config = await proto.getConfig(ip, port)
			return config ? withPayload(configToBuffer(config)) : status(false)
		}

		case PacketType.SET_LEDS:
			proto.setLEDs(ip, port, packet)
			return null // fire-and-forget

		case PacketType.GET_INFO: {
			const info = await proto.getInfo(ip, port)
			return info ? withPayload(deviceInfoToBuffer(info)) : status(false)
		}

		case PacketType.GET_STATUS: {
			const s = await proto.getStatus(ip, port)
			return s ? withPayload(statusToBuffer(s)) : status(false)
		}

		case PacketType.RESET_WIFI:
			return status(await proto.resetWifi(ip, port))
	}
}


export async function proxy(host = "0.0.0.0", port = 8000, devicePort = 4210) {
	return new Promise<void>(resolve => {
		const wss = new WebSocketServer({ port, host, perMessageDeflate: false, maxPayload: MAX_PROXY_PAYLOAD })

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

			ws.on("close", () => {
				debug("proxy", "Connection closed")
			})
		})

		let scanTimer: ReturnType<typeof setInterval>
		let rendering = false
		async function render() {
			if (rendering) return
			rendering = true
			try {
				const showAwdlWarning = await awdlIsActive()
				const devices = await scan(devicePort, { useCache: false, verbose: false })
				const statuses = await Promise.all(devices.map(d => proto.getStatus(d.ip, d.port).catch(() => null)))
				const count = devices.length

				const lines = [
					`  Proxy: ws://${host}:${port}  devices: ${count}   `,
					...(showAwdlWarning ? ["", ...awdlWarningLines("proxy").map(line => "  " + line)] : []),
					"",
					...devices.map((d, i) => "  " + formatProxyDevice(d, statuses[i]?.rssi))
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
			wss.close(() => process.stdout.write("Proxy server closed\n"))
		}

		process.on("SIGINT", shutdown)
		process.on("SIGTERM", shutdown)

		wss.on("listening", async () => {
			process.stdout.write(`\x1b[H  Proxy: ws://${host}:${port}  ● scanning...\x1b[J`)
			await render()
			scanTimer = setInterval(render, SCAN_INTERVAL)
		})
	})
}

function formatProxyDevice(device: ScanResult, rssi?: number): string {
	const rssiStr = rssi !== undefined && rssi !== 0 ? `  rssi ${rssi} dBm` : ""
	return formatDevice(device) + rssiStr
}
