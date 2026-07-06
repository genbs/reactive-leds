// ../shared/protocol.ts
var PacketType = /* @__PURE__ */ ((PacketType2) => {
  PacketType2[PacketType2["PING"] = 0] = "PING";
  PacketType2[PacketType2["GET_CONFIG"] = 1] = "GET_CONFIG";
  PacketType2[PacketType2["SET_CONFIG"] = 2] = "SET_CONFIG";
  PacketType2[PacketType2["SET_LEDS"] = 3] = "SET_LEDS";
  PacketType2[PacketType2["RESET_WIFI"] = 4] = "RESET_WIFI";
  PacketType2[PacketType2["GET_VERSION"] = 5] = "GET_VERSION";
  PacketType2[PacketType2["GET_STATUS"] = 6] = "GET_STATUS";
  return PacketType2;
})(PacketType || {});
function bufferToConfig(buffer) {
  if (buffer.length < 4) {
    throw new Error(`Config buffer too short: ${buffer.length} bytes, need at least 4`);
  }
  return {
    pin: buffer[0],
    num_leds: buffer[1],
    port: buffer[2] << 8 | buffer[3],
    hostname: decodeBuffer(buffer.subarray(4)).substring(0, 32)
  };
}
function bufferToStatus(buffer) {
  if (buffer.length < 9)
    throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`);
  const uptime = (buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3]) >>> 0;
  const heap = (buffer[4] << 24 | buffer[5] << 16 | buffer[6] << 8 | buffer[7]) >>> 0;
  const rssi = buffer[8] << 24 >> 24;
  const status = { uptime, heap, rssi };
  if (buffer.length >= 15) {
    status.mac = Array.from(buffer.subarray(9, 15), (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(":");
  }
  return status;
}
function addressToBuffer(ip, port) {
  const buffer = new Uint8Array(6);
  if (typeof ip === "string") {
    const parts = ip.split(".");
    if (parts.length !== 4) {
      throw new Error(`Invalid IP: "${ip}"`);
    }
    for (let i = 0; i < 4; i++) {
      const octet = Number(parts[i]);
      if (isNaN(octet) || octet < 0 || octet > 255) {
        throw new Error(`Invalid IP: "${ip}"`);
      }
      buffer[i] = octet;
    }
  } else {
    if (ip.length < 4) {
      throw new Error(`IP array too short: ${ip.length} elements`);
    }
    buffer[0] = ip[0];
    buffer[1] = ip[1];
    buffer[2] = ip[2];
    buffer[3] = ip[3];
  }
  buffer[4] = port >> 8 & 255;
  buffer[5] = port & 255;
  return buffer;
}
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function encodeBuffer(str, dest, position) {
  if (typeof dest !== "undefined") {
    const target = typeof position !== "undefined" ? dest.subarray(position) : dest;
    encoder.encodeInto(str, target);
    if (typeof position === "undefined" && dest.length > str.length) {
      dest[str.length] = 0;
    }
    return dest;
  } else {
    return encoder.encode(str);
  }
}
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
var EMPTY_REQUEST_ID = 0;
var CONNECTION_CHANGE_REQUEST_ID = 1;
var FIRST_REQUEST_ID = 2;

// src/mapping.ts
function step(t, xStart, yStart, xEnd, yEnd, out) {
  out[0] = (1 - t) * xStart + t * xEnd;
  out[1] = (1 - t) * yStart + t * yEnd;
}
function sample(pixels, pixelsSize, grid, polygon, steps, wa = 0, output = new Uint8Array(steps * 5)) {
  const [imgWidth, imgHeight] = pixelsSize;
  const [cells, rows] = grid;
  const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon;
  const cellWidth = imgWidth / cells;
  const cellHeight = imgHeight / rows;
  const top = [0, 0];
  const bot = [0, 0];
  const point = [0, 0];
  step(0.5, x0, y0, x1, y1, top);
  step(0.5, x3, y3, x2, y2, bot);
  const fixedW = typeof wa === "number" ? wa : 0;
  const whiteFn = typeof wa === "function" ? wa : null;
  const useAlpha = wa === true;
  for (let i = 0; i < steps; i++) {
    step((i + 0.5) / steps, top[0], top[1], bot[0], bot[1], point);
    let sx = Math.floor(point[0] * cellWidth);
    let sy = Math.floor(point[1] * cellHeight);
    if (sx < 0) sx = 0;
    else if (sx >= imgWidth) sx = imgWidth - 1;
    if (sy < 0) sy = 0;
    else if (sy >= imgHeight) sy = imgHeight - 1;
    const srcIndex = sy * imgWidth + sx << 2;
    const dstIndex = i * 5;
    output[dstIndex] = i;
    output[dstIndex + 1] = pixels[srcIndex];
    output[dstIndex + 2] = pixels[srcIndex + 1];
    output[dstIndex + 3] = pixels[srcIndex + 2];
    output[dstIndex + 4] = whiteFn ? whiteFn(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2]) : useAlpha ? pixels[srcIndex + 3] : fixedW;
  }
  return output;
}

// src/proxy.ts
var scriptSrc = typeof document !== "undefined" ? document.currentScript?.src : void 0;
function createWorker() {
  const base = import.meta.url || scriptSrc || "";
  const url = new URL("./daemon.worker.js", base).href;
  try {
    return new Worker(url, { type: "module" });
  } catch {
    const blob = new Blob([`import ${JSON.stringify(url)}`], { type: "text/javascript" });
    return new Worker(URL.createObjectURL(blob), { type: "module" });
  }
}
var requests = /* @__PURE__ */ new Map();
var connectionChangeCallbacks = [];
var connected = false;
var rid = 0;
function createRequest(buffer) {
  const requestId = FIRST_REQUEST_ID + rid++ % (255 - FIRST_REQUEST_ID) + 1;
  const newBuffer = new Uint8Array(1 + buffer.length);
  newBuffer[0] = requestId;
  newBuffer.set(buffer, 1);
  const request = new Promise((resolve) => {
    requests.set(requestId, { resolve });
  });
  return [request, newBuffer, requestId];
}
function handleResponse(event) {
  const message = event.data;
  const responseId = message[0];
  const responseData = message.subarray(1);
  const request = requests.get(responseId);
  if (!request) {
    if (responseId === CONNECTION_CHANGE_REQUEST_ID && responseData[0] === 1 /* ConnectionChange */) {
      const next = responseData[1] === TRUE;
      if (next !== connected) {
        connected = next;
        debug && console.log(`[Proxy] Connection change event: ${connected}`);
        connectionChangeCallbacks.forEach((callback) => callback(connected));
      }
      return;
    }
    debug && console.log(`[Proxy] Unknown request id ${responseId}`);
    return;
  }
  requests.delete(responseId);
  request.resolve(responseData);
}
var daemon = null;
var debug = false;
function checkConnected() {
  if (!daemon) throw new Error("Worker not initialized");
}
function wsconnect(serverURL, _debug = false) {
  if (!daemon) {
    daemon = createWorker();
    checkConnected();
    daemon.addEventListener("message", handleResponse);
    debug = _debug;
    debug && console.log("[Proxy] Worker created");
  }
  const buffer = new Uint8Array(1 + serverURL.length + 1);
  buffer[0] = 0 /* Connect */;
  encodeBuffer(serverURL, buffer, 1);
  buffer[1 + serverURL.length] = debug ? TRUE : FALSE;
  debug && console.log(`[Proxy] try to connect to ${serverURL}`, buffer);
  return sendSync(buffer).then(((response) => response[1] === TRUE));
}
function onConnectionChange(callback) {
  checkConnected();
  if (!connectionChangeCallbacks.includes(callback))
    connectionChangeCallbacks.push(callback);
  return () => {
    connectionChangeCallbacks = connectionChangeCallbacks.filter((cb) => cb !== callback);
  };
}
function isConnected() {
  checkConnected();
  return connected;
}
function sendSync(data) {
  checkConnected();
  let [promise, buffer, requestId] = createRequest(data);
  debug && console.log(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1]]}`, buffer);
  daemon.postMessage(buffer);
  return promise;
}
function send(data) {
  checkConnected();
  const buffer = new Uint8Array(1 + data.length);
  buffer[0] = EMPTY_REQUEST_ID;
  buffer.set(data, 1);
  debug && console.log(`[Proxy] send ${WorkerRequestTypeMap[buffer[1]]}`, buffer);
  daemon.postMessage(buffer);
}

// src/main.ts
var addressBuffers = /* @__PURE__ */ new Map();
function createPacket(ip, port, type, data) {
  const address = `${ip}:${port}`;
  let addressPacket = addressBuffers.get(address);
  if (!addressPacket) {
    addressPacket = addressToBuffer(ip, port);
    addressBuffers.set(address, addressPacket);
  }
  const addrLen = addressPacket.length;
  const dataLen = data ? data.length : 0;
  const totalLen = 1 + addrLen + 1 + dataLen;
  let offset = 0;
  const buffer = new Uint8Array(totalLen);
  buffer[offset++] = 2 /* Send */;
  buffer.set(addressPacket, offset);
  offset += addrLen;
  buffer[offset++] = type;
  if (data) buffer.set(data, offset);
  return buffer;
}
function begin(serverURL, debug2 = false) {
  return wsconnect(serverURL, debug2);
}
function ping(ip, port = 4210) {
  return sendSync(createPacket(ip, port, 0 /* PING */)).then(
    (response) => response.length === 1 && response[0] === TRUE
  );
}
function getConfig(ip, port = 4210) {
  return sendSync(createPacket(ip, port, 1 /* GET_CONFIG */)).then((response) => {
    if (response.length === 1 && response[0] === FALSE) return null;
    return bufferToConfig(response);
  });
}
function getStatus(ip, port = 4210) {
  return sendSync(createPacket(ip, port, 6 /* GET_STATUS */)).then((response) => {
    if (response.length === 1 && response[0] === FALSE) return null;
    return bufferToStatus(response);
  });
}
function setLEDs(ip, port = 4210, leds) {
  send(createPacket(ip, port, 3 /* SET_LEDS */, leds));
}
async function connect(ip, port = 4210) {
  const alive = await ping(ip, port);
  if (!alive) return null;
  const config = await getConfig(ip, port);
  if (!config) return null;
  return {
    config,
    send: (leds) => setLEDs(ip, port, leds),
    sendRaw: (type, data) => sendRaw(ip, port, type, data),
    sendRawSync: (type, data) => sendRawSync(ip, port, type, data)
  };
}
function sendRaw(ip, port, type, data) {
  send(createPacket(ip, port, type, data));
}
function sendRawSync(ip, port, type, data) {
  return sendSync(createPacket(ip, port, type, data));
}
var reactiveLeds = {
  begin,
  onConnectionChange,
  isConnected,
  connect,
  ping,
  getConfig,
  getStatus,
  setLEDs,
  sendRaw,
  sendRawSync,
  sample,
  PacketType
};
var main_default = reactiveLeds;
export {
  PacketType,
  begin,
  connect,
  main_default as default,
  getConfig,
  getStatus,
  isConnected,
  onConnectionChange,
  ping,
  sample,
  sendRaw,
  sendRawSync,
  setLEDs
};
