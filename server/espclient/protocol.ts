import { scanUDPPorts, sendUDPMessage } from "../utils"
import { ESPClientConfig } from "./ESPClient"

export enum MessageType {
	PING = 0,
	HANDSHAKE = 1,
	GET_CONFIG = 2,
	SET_CONFIG = 3,
	SET_COLORS = 4,
}

export async function ping(ip: string, port: number): Promise<boolean> {
	const pingMessage = new Uint8Array([MessageType.PING])
	const response = await sendUDPMessage(ip, port, pingMessage, 300)
	return !!(response && response.length === 1 && response[0] === MessageType.PING)
}

function isHandshakeMessage(msg: Uint8Array | null): ESPClientConfig | null {
	return msg && msg.length > 5 && msg[0] === MessageType.HANDSHAKE
		? {
				port: (msg[1] << 8) | msg[2],
				id: msg[3],
				num_leds: msg[4],
				hostname: msg.slice(5).toString().replace(/\0/g, ""),
		  }
		: null
}

export async function handshake(
	ip: string,
	portOrStartPort: number,
	endPort?: number
): Promise<ESPClientConfig | null> {
	const handshakeMessage = new Uint8Array([MessageType.HANDSHAKE])

	if (endPort === undefined) {
		const response = await sendUDPMessage(ip, portOrStartPort, new Uint8Array([MessageType.HANDSHAKE]), 20)
		return isHandshakeMessage(response)
	}

	return new Promise(resolve => {
		scanUDPPorts(
			ip,
			portOrStartPort,
			endPort,
			handshakeMessage,
			(msg, port) => {
				const config = isHandshakeMessage(msg)
				if (config) {
					resolve(config)
					return true // stop scanning
				}
			},
			() => resolve(null)
		)
	})
}
