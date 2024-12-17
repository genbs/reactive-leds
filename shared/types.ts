/**
 * Color is an array of 4 numbers: [r, g, b, brightness/whiteness]
 */
export type TColor = [number, number, number, number]

export interface TConfig {
	id: number
	hostname: string
	port: number
	num_leds: number
	brightness: number
}

export interface TESP extends TConfig {
	address: string
	online: boolean
	color?: TColor
	lastPing: number
}

export enum EStripeOrientation {
	Vertical = 0, // from down to up
	Horizontal = 1, // from left to right
	VerticalReverse = 2, // from up to down
	HorizontalReverse = 3, // from right to left
}

export type TStripe = {
	name: string
	color: TColor
	colorHex: string
	leds: Uint8Array // [r, g, b, w, r, g, b, w, ...]
	orientation?: EStripeOrientation

	device: TESP
}

////////////////////////////////////////

export enum EWSPayloadType {
	Binary = 0,
	JSON = 1,
}

export enum EWSRequestByteType {
	SetLEDs = 0,
	Blink = 1,
}

// Request from browser client to server
export type TWSRequestJSONFindDevice = { type: "find"; ip: string }
export type TWSRequestJSONGetStripe = { type: "get_stripe" }
export type TWSRequestJSONUpdateStripe = { type: "update_stripe"; data: Omit<TStripe, "leds">; id: number }

/**
 * [EWSRequestByteType.SetLEDs, Stripe['id'], led_index, r, g, b, w, led_index, r, g, b, w, ...]
 */
export type TWSRequestSetLEDs = Uint8Array
export type TWSRequestBlink = Uint8Array

// Response from server to browser client
export type TWSResponseGetStripe = { event: "get_stripe"; data: TStripe[] }

////////////////////////////////////////

export type TWSRequest =
	| TWSRequestJSONGetStripe
	| TWSRequestJSONUpdateStripe
	| TWSRequestJSONFindDevice
	| TWSRequestSetLEDs
	| TWSRequestBlink
export type TWSResponse = TWSResponseGetStripe
