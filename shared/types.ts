/**
 * Color is an array of 4 numbers: [r, g, b, brightness/whiteness]
 */
export type TColor = [number, number, number, number] | Uint8Array

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
	lastPing: number
}

export enum EStripeOrientation {
	Vertical = 0, // from down to up
	Horizontal = 1, // from left to right
	VerticalReverse = 2, // from up to down
	HorizontalReverse = 3, // from right to left
}

export type TStripeMap = {
	orientation?: EStripeOrientation
	x: number
	y: number
	scale: [number, number]
	visible: boolean
}

export type TStripe = {
	name: string
	color: TColor
	leds: Uint8Array // [r, g, b, w, r, g, b, w, ...]

	map: TStripeMap

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
export type TWSRequestJSONConnectDevice = { type: "connect"; ip: string }
export type TWSRequestJSONGetStripes = { type: "get_stripes" }
export type TWSRequestJSONUpdateStripe = { type: "update_stripe"; data: Omit<TStripe, "leds">; ip: TESP["address"] }
export type TWSRequestJSONGetClients = { type: "get_clients" }
export type TWSRequestJSONDeleteStripe = { type: "delete_stripe"; ip: TESP["address"] }
export type TWSRequestJSON =
	| TWSRequestJSONConnectDevice
	| TWSRequestJSONGetStripes
	| TWSRequestJSONUpdateStripe
	| TWSRequestJSONGetClients
	| TWSRequestJSONDeleteStripe

export type TWSRequestSetLEDs = Uint8Array // [EWSRequestByteType.SetLEDs, Stripe['id'], led_index, r, g, b, w, led_index, r, g, b, w, ...]
export type TWSRequestBlink = Uint8Array // [EWSRequestByteType.Blink, Stripe['id']]

// Response from server to browser client
export type TWSResponseGetStripes = { event: "get_stripes"; data: TStripe[] }
export type TWSResponseGetClients = { event: "get_clients"; data: TNetClient[] }

////////////////////////////////////////

export type TWSRequest =
	| TWSRequestJSONGetStripes
	| TWSRequestJSONUpdateStripe
	| TWSRequestJSONConnectDevice
	| TWSRequestJSONGetClients
	| TWSRequestSetLEDs
	| TWSRequestBlink
	| TWSRequestJSONDeleteStripe
export type TWSResponse = TWSResponseGetStripes | TWSResponseGetClients

export type TNetClient = {
	ip: string
	mac: string
	vendor: string
	hostname?: string
}
