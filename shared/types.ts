/**
 * Color is an array of 4 numbers: [r, g, b, brightness/whiteness]
 */
export type TColor = [number, number, number, number] | Uint8Array

export interface TESPConfig {
	id: number
	hostname: string
	port: number
	num_leds: number
	brightness: number
}

export interface TESP extends TESPConfig {
	address: string
	online: boolean
	lastPing: number
}

export type TStripeMap = {
	x1: number
	y1: number
	x2: number
	y2: number
	visible: boolean
}

export type TStripe = TESP & {
	name: string
	color: TColor
	leds: Array<number> // [r, g, b, w, r, g, b, w, ...]

	map: TStripeMap
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
export type TWSRequestJSONGetConfig = { type: "get_config" }
export type TWSRequestJSONSetConfig = { type: "set_config"; data: Partial<TConfig> }
export type TWSRequestJSONUpdateStripe = { type: "update_stripe"; data: Omit<TStripe, "leds">; ip: TESP["address"] }
export type TWSRequestJSONMap = { type: "update_config"; data: Partial<TConfig> }
export type TWSRequestJSONGetClients = { type: "get_clients" }
export type TWSRequestJSONDeleteStripe = { type: "delete_stripe"; ip: TESP["address"] }
export type TWSRequestJSON =
	| TWSRequestJSONConnectDevice
	| TWSRequestJSONGetConfig
	| TWSRequestJSONSetConfig
	| TWSRequestJSONUpdateStripe
	| TWSRequestJSONGetClients
	| TWSRequestJSONDeleteStripe

export type TWSRequestSetLEDs = Uint8Array // [EWSRequestByteType.SetLEDs, Stripe['id'], led_index, r, g, b, w, led_index, r, g, b, w, ...]
export type TWSRequestBlink = Uint8Array // [EWSRequestByteType.Blink, Stripe['id']]

export type TWSRequest = TWSRequestJSON | TWSRequestSetLEDs | TWSRequestBlink

// Response from server to browser client
export type TWSResponseGetConfig = { event: "get_config"; data: TConfig }
export type TWSResponseGetClients = { event: "get_clients"; data: TNetClient[] }

export type TWSResponse = TWSResponseGetConfig | TWSResponseGetClients

////////////////////////////////////////

export type TNetClient = {
	address: string
	mac: string
	vendor: string
	hostname?: string
}

////////////////////////////////////////

export type TConfig = {
	grid: [number, number]
	stripes: TStripe[]
}
