/**
 * Color is an array of 4 numbers: [r, g, b, brightness/whiteness]
 */
export type Color = [number, number, number, number]

export interface EditableStripe {
	id: number
	name: string
	port: number
	num_leds: number
	brightness: number
	color?: Color
}

export interface Stripe extends EditableStripe {
	address: string
	hostname: string
	online: boolean
}

////////////////////////////////////////

export enum EWSPayloadType {
	Binary = 0,
	JSON = 1,
}

export enum EWSRequestByteType {
	SetLEDs = 0,
}

// Request from browser client to server
export type TWSRequestGetStripe = { type: "get_stripe" }
export type TWSRequestUpdateStripe = { type: "update_stripe"; data: EditableStripe }

/**
 * [EWSRequestByteType.SetLEDs, Stripe['id'], led_index, r, g, b, w, led_index, r, g, b, w, ...]
 */
export type TWSRequestSetLEDs = Uint8Array

// Response from server to browser client
export type TWSResponseGetStripe = { event: "get_stripe"; data: Stripe[] }

////////////////////////////////////////

export type TWSRequest = TWSRequestGetStripe | TWSRequestUpdateStripe | TWSRequestSetLEDs
export type TWSResponse = { event: "get_stripe"; data: Stripe[] }
