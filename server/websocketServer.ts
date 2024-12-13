import WebSocket from "ws"

let wsServer: WebSocket.Server

function start(port: number) {
	wsServer = new WebSocket.Server({ port })

	const wsClients = new Set()

	wsServer.on("connection", ws => {
		wsClients.add(ws)
		ws.on("close", () => wsClients.delete(ws))
		//ws.on("message", onMessage)
	})

	console.log(`WebSocket Server listening on port ${port}`)
}

export default {
	start,
}
