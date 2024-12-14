/**
 * Color is an array of 4 numbers: [r, g, b, brightness/whiteness]
 */
export type Color = [number, number, number, number]
export interface Stripe {
	id: number
	name: string
	address: string
	hostname: string
	num_leds: number
	online: boolean

	color?: Color
}

////////////////////////////////////////

export enum EWSRequestByteType {
	SetLEDs = 0,
}

// Request from browser client to server
export type TWSRequestGetStripe = { type: "get_stripe" }

/**
 * [EWSRequestByteType.SetLEDs, Stripe['id'], led_index, r, g, b, w, led_index, r, g, b, w, ...]
 */
export type TWSRequestSetLEDs = Uint8Array

// Response from server to browser client
export type TWSResponseGetStripe = { event: "get_stripe"; data: Stripe[] }

////////////////////////////////////////

export type TWSRequest = TWSRequestGetStripe | TWSRequestSetLEDs
export type TWSResponse = { event: "get_stripe"; data: Stripe[] }
