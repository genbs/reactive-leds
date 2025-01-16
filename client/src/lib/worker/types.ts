import { TConfig, TStripe } from "@shared"
import { GydraLEDState } from "../state"

export type WorkerRequest =
	| {
			type: "begin"
			data: { serverUrl: string; debug: boolean }
	  }
	| {
			type: "watch"
			data: { bitmap: ImageBitmap; grid: [number, number] }
	  }
	| {
			type: "update_stripe"
			data: TStripe
			ip: string
	  }
	| {
			type: "delete_stripe"
			ip: string
	  }
	| {
			type: "connect"
			ip: string
	  }
	| {
			type: "get_config"
	  }
	| {
			type: "get_clients"
	  }
	| {
			type: "set_config"
			data: Partial<TConfig>
	  }

export type WorkerResponse =
	| {
			event: "update_state"
			data: GydraLEDState
			ip: string
	  }
	| {
			event: "connectionChange"
			data: {
				status: boolean
			}
	  }
	| {
			event: "leds-setteds"
			data?: undefined
	  }
