importScripts("leds.js")
console.log(leds)

const deviceIPs = ["192.168.1.2", "192.168.1.6"]
const devices = []
let rid

try {
	leds.begin("ws://localhost:8000", false).then(main)

	leds.onConnectionChange(connected => main())

	function main() {
		deviceIPs.forEach(async ip => {
			const device = await leds.connect(ip)
			if (device) {
				devices.push(device)
				console.log("add", ip)
			}
		})

		clearTimeout(rid)
		if (leds.isConnected()) {
			animate()
		}
	}

	function animate() {
		const args = []
		const now = performance.now()
		const time = now / 1000

		devices.forEach((device, index) => {
			const len = device.config.num_leds
			const data = new Uint8Array(len * 5)

			for (let i = 0; i < len; i++) {
				data[i * 5] = i
				c = Math.floor(Math.sin(time * 10 + i * 0.5) ** 0.02 * 255)
				data[i * 5 + 1] = 0
				data[i * 5 + 2] = 0
				data[i * 5 + 3] = 0
				data[i * 5 + 4] = c * 0.1
			}
			args[index] = data
		})

		args.forEach((data, i) => devices[i].send(data))

		rid = setTimeout(animate, 1000 / 60)
	}

	async function connectDevice(ip, retries = 100) {
		if (devices.has(ip)) {
			console.log("Already connected to device:", ip)
			return
		}

		console.log("Connecting to device:", ip, retries)
		const config = await leds.getConfig(ip)
		if (config) {
			devices.set(ip, config)
			console.log("Device connected:", ip, config)
		} else {
			console.error("Failed to connect to device:", ip)
			if (retries > 0) {
				setTimeout(() => {
					connectDevice(ip, retries - 1)
				}, 33)
			}
		}
	}
} catch (error) {
	console.error("Error connecting to LED server:", error)
}
