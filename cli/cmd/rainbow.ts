import { logger } from "@leds/shared"
import { Command } from "../cmd"
import proto from "../protocol"
import { validateIP, validatePort } from "../utils"

export const rainbowCommand: Command = {
    name: "rainbow",
    description:
        "Set a rainbow effect on the device at <ip>:<port> for a specified number of seconds.",
    examples: ["rainbow 10 192.168.1.100 4210"],
    args: [
        { required: true, name: "seconds", type: Number, default: 10 },
        { required: true, name: "ip", type: String, validator: validateIP },
        { required: false, name: "udp_port", type: Number, validator: validatePort, default: 4210 },
        { required: false, name: "num_leds", type: Number, default: 16 },
    ],
    execute: async (seconds: number, ip: string, port: number, num_leds: number) => {
        // send rainbow command for specified seconds
        const FPS = 200
        const now = performance.now()
        const w = 0
        const ledsPackage = new Uint8Array(num_leds * 5)
        while (performance.now() - now < seconds * 1000) {
            for (let i = 0; i < 256; i += 5) {
                for (let j = 0; j < num_leds; j++) {
                    const pixelIndex = (i + (j * 256) / num_leds) % 256
                    const r = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + 0) * 127 + 128)
                    const g = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + (2 * Math.PI) / 3) * 127 + 128)
                    const b = Math.floor(Math.sin((pixelIndex * Math.PI) / 128 + (4 * Math.PI) / 3) * 127 + 128)
                    ledsPackage.set([j, r, g, b, w], j * 5)
                }

                proto.setLEDs(ip, port, ledsPackage)
                await new Promise(resolve => setTimeout(resolve, 1000 / FPS))
            }
        }


        logger.log("Rainbow effect completed")
    },
}
