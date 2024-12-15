import { Color, EWSRequestByteType } from "@shared"
import { mat2, mat3, mat4, vec2, vec3, vec4 } from "gl-matrix"
import store from "./store"
import { Stripe } from "./Stripe"
import WS from "./ws"

class Core {
	rafid: number
	startTimestamp: number
	global: Record<string, any>
	stripes: Map<Stripe["id"], Stripe>
	ws: WS

	constructor() {
		this.stripes = new Map()
		this.loop = this.loop.bind(this)
		this.global = {}

		Object.getOwnPropertyNames(Math).forEach(key => (this.global[key] = Math[key]))
		this.global["vec2"] = vec2
		this.global["vec3"] = vec3
		this.global["vec4"] = vec4
		this.global["mat2"] = mat2
		this.global["mat3"] = mat3
		this.global["mat4"] = mat4

		this.global["uvec3"] = (x = 0, y = x, z = y) => vec3.fromValues(x, y, z)
		this.global["uvec4"] = (x = 0, y = x, z = y, w = z) => vec4.fromValues(x, y, z, w)
	}

	stop() {
		cancelAnimationFrame(this.rafid)
	}

	setWS(ws: WS) {
		this.ws = ws
	}

	loop(time: number) {
		const stripes = Array.from(this.stripes.values())
		const delta = time - this.startTimestamp
		this.startTimestamp = time
		const fps = 1000 / delta

		for (const stripe of stripes) {
			if (!stripe.code) continue

			const code = this.generateCode(stripe.code)
			let fn: Function
			try {
				fn = new Function(code).call(this.global)
			} catch (e) {
				console.log(e.toString())
				return
			}
			if (fn instanceof Error) {
				console.log(fn.toString())
				return fn
			}

			const data: Uint8Array = new Uint8Array(1 /* message_type */ + 1 /* stripe_id */ + stripe.num_leds * 5)
			data[0] = EWSRequestByteType.SetLEDs
			data[1] = stripe.id
			for (let i = 0; i < stripe.num_leds; i++) {
				const led = {
					index: i,
					offset: (i + 1) / stripe.num_leds,
					color: stripe.leds.slice(i * 4, i * 4 + 4),
				}

				const result = fn(led, time, stripe.leds, stripe.num_leds)
				if (result instanceof Error) {
					console.log(result.toString())
					return result
				}

				console.log(result)

				const evalResult = this.evalResult(result).map(this.sanitize)
				stripe.leds[i * 4] = evalResult[0]
				stripe.leds[i * 4 + 1] = evalResult[1]
				stripe.leds[i * 4 + 2] = evalResult[2]
				stripe.leds[i * 4 + 3] = evalResult[3]

				data[i * 5 + 2] = i
				data[i * 5 + 3] = evalResult[0]
				data[i * 5 + 4] = evalResult[1]
				data[i * 5 + 5] = evalResult[2]
				data[i * 5 + 6] = evalResult[3]
			}

			this.ws?.send(data)
		}
		store.updateStripes(stripes)

		this.rafid = requestAnimationFrame(this.loop)
	}

	evalResult(result: any): Color {
		// console.log(i, result, led.color, led.offset)
		if (typeof result === "string") {
			// string(hex, hsl, rgb) to color [r, g, b, w]
			return [0, 0, 0, 0]
		}

		if (typeof result === "number") {
			return [result, result, result, result]
		}

		if (Array.isArray(result) && result.length >= 4) {
			return [result[0], result[1], result[2], result[3]]
		}

		if (ArrayBuffer.isView(result) && result.buffer.byteLength >= 4) {
			return [result[0], result[1], result[2], result[3]]
		}

		return [0, 0, 0, 0]
	}

	sanitize(value: number) {
		return Math.floor(value < 0 ? 0 : value > 255 ? 255 : value)
	}

	start() {
		if (this.rafid) this.stop()

		this.startTimestamp = performance.now()
		this.rafid = requestAnimationFrame(this.loop)
	}

	setStripes(stripes: Stripe[]) {
		for (const stripe of stripes) {
			this.stripes.set(stripe.id, stripe)
		}

		this.start()
	}

	generateCode(code: string): string {
		if (!code.includes("return") && !code.includes("\n")) {
			code = `return ${code}`
		}

		const isFunction = code.trim().startsWith("function") || code.trim().startsWith("(")
		if (!isFunction) {
			code = `(led, time, leds, num_leds) => { ${code} }`
		}

		return `
            try {
                with(this) {
                    return ${code};
                }
            } catch (e) {
                return e;
            }
        `
	}
}

const core = new Core()

export default core
