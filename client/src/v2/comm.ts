export enum WorkerRequestType {
	Connect = 0x00,
	ConnectionChange = 0x01,
	Send = 0x02,
}

export const WorkerRequestTypeMap = {
	[WorkerRequestType.Connect]: "Connect",
	[WorkerRequestType.ConnectionChange]: "ConnectionChange",
	[WorkerRequestType.Send]: "Send",
}

export type WorkerRequest = Uint8Array

export type WebsocketPacket = Uint8Array // [device_ip[4], device_port[2], Packet]
