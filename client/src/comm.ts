// Comunication between client and worker

// Message types that the client can send to the worker
export enum WorkerRequestType {
	Connect = 0x00, // Connect to the server with websocket
	ConnectionChange = 0x01, // Connection status changed
	Send = 0x02, // Send a message to the server
}

export const WorkerRequestTypeMap = {
	[WorkerRequestType.Connect]: "Connect",
	[WorkerRequestType.ConnectionChange]: "ConnectionChange",
	[WorkerRequestType.Send]: "Send",
}

export const TRUE = 0x01
export const FALSE = 0x00

export const EMPTY_REQUEST_ID = 0
