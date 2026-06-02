import { bufferToConfig, configToBuffer, encodeBuffer, PacketType, PacketTypeMap, statusToBuffer } from "@reactive-leds/shared"
import { WebSocketServer } from "ws"
import { Command } from "../cmd"
import proto from "../protocol"
import { DEBUG, validateIPOrHostname, validatePort } from "../utils"
import { formatDevice, scan } from "./wifi"

const SCAN_INTERVAL = 10_000

export const proxyCommand: Command = {
	name: "proxy",
	description:
		"Start the WebSocket proxy between browser clients and the firmware.\nScans the LAN every 10 seconds and shows discovered devices, updating live in the terminal.",
	args: [
		{ required: false, name: "host", type: String, default: "0.0.0.0", validator: validateIPOrHostname },
		{ required: false, name: "port", type: Number, default: 8000, validator: validatePort },
		{ required: false, name: "device_port", type: Number, default: 4210, validator: validatePort },
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
	const requestId = payload[0]
	const ip = payload[1] + "." + payload[2] + "." + payload[3] + "." + payload[4]
	const port = (payload[5] << 8) | payload[6]
	const packetType = payload[7] as PacketType
	const packet = payload.slice(8)

	if (DEBUG) console.log(`IP: ${ip}, Port: ${port}, Packet type: ${PacketTypeMap[packetType]}`)

	// A fresh buffer per response — never share a module-level Uint8Array across
	// concurrent in-flight messages.
	const status = (ok: boolean) => new Uint8Array([requestId, ok ? 1 : 0])
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

		case PacketType.GET_VERSION: {
			const version = await proto.getVersion(ip, port)
			return version ? withPayload(encodeBuffer(version)) : status(false)
		}

		case PacketType.GET_STATUS: {
			const s = await proto.getStatus(ip, port)
			return s ? withPayload(statusToBuffer(s)) : status(false)
		}

		case PacketType.RESET_WIFI:
			return status(await proto.resetWifi(ip, port))

		default:
			console.warn(`Unhandled packet type: ${packetType}`)
			return status(false)
	}
}


export function proxy(host = "0.0.0.0", port = 8000, devicePort = 4210) {
	return new Promise<void>(resolve => {
		const wss = new WebSocketServer({ port, host, perMessageDeflate: false })

		wss.on("connection", ws => {
			if (DEBUG) console.log("New connection established")

			ws.on("message", async (payload: Uint8Array) => {
				const response = await handleProxyMessage(payload)
				if (response) ws.send(response)
			})

			ws.on("close", () => {
				if (DEBUG) console.log("Connection closed")
			})
		})

		let scanTimer: ReturnType<typeof setInterval>

		async function render() {
			const header = `  Proxy: ws://${host}:${port}`

			process.stdout.write(`\x1b[H${header}  ● scanning...\x1b[J`)

			const start = Date.now()
			const devices = await scan(devicePort, { useCache: false, verbose: false })
			const elapsed = Math.round((Date.now() - start) / 100) / 10
			const count = devices.length

			const lines = [
				`${header}  ● active  last scan: ${elapsed}s  devices: ${count}`,
				"",
			]

			if (count === 0) {
				lines.push("  (no devices found — make sure they are provisioned and on the same network)")
			} else {
				lines.push(...devices.map(d => "  " + formatDevice(d)))
			}

			process.stdout.write(`\x1b[H${lines.join("\n")}\x1b[J`)
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
			await render()
			scanTimer = setInterval(render, SCAN_INTERVAL)
		})
	})
}
