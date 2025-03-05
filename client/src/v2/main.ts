import { bufferToConfig, Config, PacketType } from "../../../shared/protocol"
import { WorkerRequestType } from "./comm"
import { connect, send } from "./proxy"

// initialize the connection to the server in the worker
function begin(serverUrl: string, debug = false): Promise<boolean> {
	return connect(serverUrl, debug)
}

function ping(address: string, port = 4210) {
	const buffer = new Uint8Array(1 + address.length + 2 + 1)
	buffer[0] = WorkerRequestType.Send
	const addressBuffer = addressToBuffer(address, port)
	buffer.set(addressBuffer, 1)
	buffer[1 + addressBuffer.length] = PacketType.PING // Ping
	return send(buffer)
}

function getConfig(address: string, port = 4210): Promise<Config | null> {
	const buffer = new Uint8Array(1 + address.length + 2 + 1)
	buffer[0] = WorkerRequestType.Send
	const addressBuffer = addressToBuffer(address, port)
	buffer.set(addressBuffer, 1)
	buffer[1 + addressBuffer.length] = PacketType.GET_CONFIG // Get Config
	console.log("getConfig", buffer, addressBuffer.length)
	return send(buffer).then(response => {
		if (response.length === 1 && response[0] === 0) return null

		return bufferToConfig(response)
	})
}

function addressToBuffer(address: string, port: number): Uint8Array {
	const buffer = new Uint8Array(4 + 2)

	const ip = address.split(".")
	for (let i = 0; i < 4; i++) buffer[i] = parseInt(ip[i])
	buffer[4] = (port >> 8) & 0xff
	buffer[5] = port & 0xff

	return buffer
}

export default {
	begin,
	ping,
	getConfig,
}
