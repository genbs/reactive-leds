export type ProtocolBoardConfig = {
	port: number
	id: number
	num_leds: number
	hostname: string
}

export type ProtocolRequestID = number

export enum ProtocolMessageType {
	PING = 0,
	GET_CONFIG = 1,
	SET_CONFIG = 2,
	SET_LEDS = 3,
}

export type ProtocolResponse = [ProtocolRequestID, ProtocolMessageType, ...number[]]

export const EMPTY_MESSAGE_ID = 0

export const MessageTypeString = {
	[ProtocolMessageType.PING]: "PING",
	[ProtocolMessageType.GET_CONFIG]: "GET_CONFIG",
	[ProtocolMessageType.SET_CONFIG]: "SET_CONFIG",
	[ProtocolMessageType.SET_LEDS]: "SET_COLORS",
}
