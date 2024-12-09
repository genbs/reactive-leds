import dgram from "dgram"

export function scanUdpPorts(
	ip: string,
	startPort: number,
	endPort: number,
	sendMessage: string | any,
	callback: (msg: Buffer, port: number) => boolean | undefined
) {
	let finded = false

	for (let port = startPort; port <= endPort; port++) {
		if (finded) break

		let isSocketRunning = true

		const socket = dgram.createSocket("udp4")

		function close() {
			if (isSocketRunning) {
				isSocketRunning = false
				socket.close()
			}
		}

		socket.on("message", (msg, rinfo) => {
			if (callback(msg, port)) {
				close()

				return (finded = true)
			}
		})

		socket.on("error", close)
		socket.send(sendMessage, 0, sendMessage.length, port, ip, err => err && close())
		setTimeout(close, 200)
	}
}
