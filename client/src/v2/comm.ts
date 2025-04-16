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

export const TRUE = 0x01
export const FALSE = 0x00

export const EMPTY_REQUEST_ID = 0
