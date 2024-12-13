import dgram from "dgram"
import dns from "dns"

// return ip addres
export function IPbyHostname(hostname: string, timeout: number = 10000): Promise<string | null> {
	return new Promise(resolve => {
		const timer = setTimeout(() => {
			resolve(null)
			console.log("resolveHostname timeout")
		}, timeout)
		dns.lookup(hostname, function (err, result) {
			clearTimeout(timer)
			resolve(err ? null : result)
		})
	})
}

// return hostname by ip
export function hostnameByIP(ip: string, timeout: number = 10000): Promise<string | null> {
	console.log("hostnameByIP", ip)
	return new Promise(resolve => {
		const timer = setTimeout(() => {
			resolve(null)
			console.log("resolveIP timeout")
		}, timeout)
		dns.reverse(ip, function (err, result) {
			clearTimeout(timer)
			console.log("hostnameByIP", err, result)
			resolve(err ? null : result[0])
		})
	})
}

export async function scanUDPPorts(
	ip: string,
	startPort: number,
	endPort: number,
	sendMessage: string | any,
	callback: (msg: Buffer, port: number) => boolean | undefined,
	onEnd?: () => void
) {
	for (let port = startPort; port <= endPort; port++) {
		const msg = await sendUDPMessage(ip, port, sendMessage, 20)

		if (msg && callback(msg, port)) {
			return
		}
	}

	if (onEnd) onEnd()
}

export function sendUDPMessage(ip: string, port: number, message: Uint8Array, timeout: number): Promise<Buffer | null> {
	return new Promise(resolve => {
		let isSocketRunning = true
		const socket = dgram.createSocket("udp4")

		socket.send(message, 0, message.length, port, ip)
		//const startTime = performance.now()
		socket.on("message", msg => {
			isSocketRunning = false
			socket.close()
			//const endTime = performance.now()
			// Ping circa 50ms, Handshake circa 7ms, da indagare
			//console.log(`UDP message from ${ip}:${port}: ${msg} (${endTime - startTime}ms)`)
			resolve(msg)
		})
		socket.on("error", () => {
			if (isSocketRunning) {
				isSocketRunning = false
				socket.close()
				resolve(null)
			}
		})

		setTimeout(() => {
			if (isSocketRunning) {
				isSocketRunning = false
				socket.close()
				resolve(null)
			}
		}, timeout)
	})
}
