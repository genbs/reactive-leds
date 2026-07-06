// ../shared/protocol.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function decodeBuffer(buffer) {
  const nullIndex = buffer.indexOf(0);
  if (nullIndex !== -1) return decoder.decode(buffer.subarray(0, nullIndex));
  return decoder.decode(buffer);
}

// src/comm.ts
var WorkerRequestTypeMap = {
  [0 /* Connect */]: "Connect",
  [1 /* ConnectionChange */]: "ConnectionChange",
  [2 /* Send */]: "Send"
};
var TRUE = 1;
var FALSE = 0;
var CONNECTION_CHANGE_REQUEST_ID = 1;

// src/ws.ts
var WS_RECONNECTION_TIMEOUT = 2e3;
var WS_RECONNECTION_MAX_RETRIES = 5;
var defaultSettings = {
  autoConnect: true,
  // Automatically connect on instantiation
  shouldReconnect: true
  // Automatically reconnect on close
};
var WS = class {
  constructor(settings = {}) {
    this.retries = 0;
    this.retryTimer = null;
    this.settings = { ...defaultSettings, ...settings };
    if (this.settings.autoConnect) this.connect();
    else this.socket = null;
    this.connected = false;
  }
  /**
   * Connects to the WebSocket server.
   * If already connected, it will close the existing connection and create a new one.
   */
  connect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
      this.retries = 0;
    }
    this.settings.debug && console.log("[WS] Connecting to", this.settings.url);
    if (this.socket) {
      this.settings.debug && console.log("[WS] Warning: already connected, closing existing connection");
      this.socket.close();
    }
    const onOpen = (e) => {
      this.settings.debug && console.log("[WS] Connection established", e);
      this.connected = true;
      this.retries = 0;
      this.settings.onConnectionChange?.(true);
    };
    const onMessage = (e) => {
      if (e.data.byteLength <= 0) return;
      const data = new Uint8Array(e.data);
      this.settings.debug && console.log("[WS] Received", data);
      this.settings.onMessage?.(data);
    };
    let socket;
    try {
      socket = new WebSocket(this.settings.url);
    } catch {
      this.settings.onConnectionChange?.(false);
      return;
    }
    this.socket = socket;
    socket.binaryType = "arraybuffer";
    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", (e) => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
      if (this.socket === socket) this.onSocketClose(e);
    });
  }
  close() {
    this.settings.debug && console.log("[WS] Closing connection");
    if (this.retryTimer)
      clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.retries = 0;
    this.connected = false;
    this.socket?.close();
  }
  send(payload) {
    if (!this.socket) {
      this.settings.debug && console.log("[WS] Send error, not connected, can't send message");
      return;
    }
    this.settings.debug && console.log("[WS] Sending", payload);
    this.socket.send(payload);
  }
  // Event listeners
  /** When the connection is closed, it will attempt to reconnect if the shouldReconnect setting is true. */
  onSocketClose(e) {
    this.settings.debug && console.log("[WS] Connection closed", e);
    this.socket = null;
    this.settings.onConnectionChange?.(false);
    this.connected = false;
    const shouldReconnect = typeof this.settings.shouldReconnect === "function" ? this.settings.shouldReconnect() : this.settings.shouldReconnect;
    if (shouldReconnect) {
      if (this.retries >= WS_RECONNECTION_MAX_RETRIES) {
        this.settings.debug && console.log("[WS] Max retries reached, not reconnecting");
        return;
      }
      this.settings.debug && console.log(`[WS] Reconnecting in ${WS_RECONNECTION_TIMEOUT / 1e3}s...`);
      this.retries++;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.connect();
      }, WS_RECONNECTION_TIMEOUT);
    }
  }
};

// src/daemon.worker.ts
var globalWS = null;
var connectionChangeRequestId = null;
var debug = false;
self.addEventListener("message", async (e) => {
  const requestId = e.data[0];
  const type = e.data[1];
  const message = e.data.slice(2);
  debug && console.log(
    `[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type]}`,
    message
  );
  switch (type) {
    // handle connection request [WorkerRequestType.Connect, serverUrl, debug]
    case 0 /* Connect */:
      const serverUrl = decodeBuffer(message.slice(0, message.length - 1));
      debug = message[message.length - 1] === 1;
      debug && console.log(`[Worker] connect request to server="${serverUrl}"`);
      if (!globalWS) {
        globalWS = new WS({
          debug,
          autoConnect: false,
          shouldReconnect: true,
          onConnectionChange: handleConnectionChange,
          onMessage: handleMessage
        });
      }
      connectionChangeRequestId = requestId;
      globalWS.settings.url = serverUrl;
      globalWS.connect();
      break;
    // handle send message to server [WorkerRequestType.Send, ...message]
    case 2 /* Send */:
      if (!globalWS) {
        debug && console.log("[Worker] Send error, not connected, can't send message");
        return;
      }
      const request = new Uint8Array(message.length + 1);
      request[0] = requestId;
      request.set(message, 1);
      globalWS.send(request);
      break;
    default:
      debug && console.log("[Worker] Unknown request type");
      break;
  }
});
function handleConnectionChange(status) {
  debug && console.log("[Worker] websocket connection change", status);
  const packet = new Uint8Array(3);
  packet[1] = 1 /* ConnectionChange */;
  packet[2] = status ? TRUE : FALSE;
  if (connectionChangeRequestId) {
    packet[0] = connectionChangeRequestId;
    connectionChangeRequestId = null;
    self.postMessage(packet);
  }
  packet[0] = CONNECTION_CHANGE_REQUEST_ID;
  self.postMessage(packet);
}
function handleMessage(packet) {
  const requestId = packet[0];
  const message = packet.slice(1);
  debug && console.log(`[Worker] received from backend [${requestId}]`, message);
  self.postMessage(packet);
}
