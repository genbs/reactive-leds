import WebSocket from "ws"

function start(port: number, onMessage: (msg: Buffer) => void) {
	const wsServer = new WebSocket.Server({ port })

	const wsClients = new Set()

	wsServer.on("connection", ws => {
		wsClients.add(ws)
		ws.on("close", () => wsClients.delete(ws))
		ws.on("message", onMessage)
	})

	console.log(`WebSocket Server listening on port ${port}`)
}

export default {
	start,
}
