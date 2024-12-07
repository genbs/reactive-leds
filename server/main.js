const dgram = require("dgram")
const WebSocket = require("ws")
const mdns = require("mdns")

const browser = mdns.createBrowser(mdns.tcp("http"))

const espClientsIP = []

browser.on("error", err => {
	console.error("mDNS error:", err)
})

browser.on("serviceUp", service => {
	if (service) {
		console.log("Found ESP device:")
		console.log(`Hostname: ${service.host}`)
		console.log(`IP Address: ${service.addresses[0]}`)
		console.log(`Port: ${service.port}`)

		if (service.host.toLocaleLowerCase().includes("esp")) {
			espClientsIP.push(service.addresses[0])
		}
	}
})

browser.on("serviceDown", service => {
	console.log("Service down:", service)
})

// Avvia la scansione
browser.start()

/////////////////

const udpServer = dgram.createSocket("udp4")
const wsServer = new WebSocket.Server({ port: 8080 })

// Mappa per conservare connessioni WebSocket
const wsClients = new Set()

udpServer.on("message", (msg, rinfo) => {
	console.log(`UDP message from ${rinfo.address}:${rinfo.port}: ${msg}`)
	// Invia il messaggio ai client WebSocket
	wsClients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(msg)
		}
	})
})

wsServer.on("connection", ws => {
	wsClients.add(ws)
	ws.on("close", () => wsClients.delete(ws))
	ws.on("message", message => {
		espClientsIP.forEach(ip => {
			udpServer.send(message, 4210, ip)
		})
	})
})

udpServer.bind(4210)
console.log("UDP Server listening on port 4210")
