(function (root, factory) {
	if (typeof define === 'function' && define.amd) define(factory)
	else if (typeof module === 'object' && module.exports) module.exports = factory()
	else root.reactiveLeds = factory()
})(typeof self !== 'undefined' ? self : globalThis, function () {
"use strict";
var reactiveLeds = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/main.ts
  var main_exports = {};
  __export(main_exports, {
    PacketType: () => PacketType,
    begin: () => begin,
    connect: () => connect,
    default: () => main_default,
    getConfig: () => getConfig,
    getInfo: () => getInfo,
    getStatus: () => getStatus,
    isConnected: () => isConnected,
    onConnectionChange: () => onConnectionChange,
    ping: () => ping,
    sample: () => sample,
    sendRaw: () => sendRaw,
    sendRawSync: () => sendRawSync,
    setLEDs: () => setLEDs
  });

  // ../shared/protocol.ts
  var PacketType = /* @__PURE__ */ ((PacketType2) => {
    PacketType2[PacketType2["PING"] = 0] = "PING";
    PacketType2[PacketType2["GET_CONFIG"] = 1] = "GET_CONFIG";
    PacketType2[PacketType2["SET_CONFIG"] = 2] = "SET_CONFIG";
    PacketType2[PacketType2["SET_LEDS"] = 3] = "SET_LEDS";
    PacketType2[PacketType2["RESET_WIFI"] = 4] = "RESET_WIFI";
    PacketType2[PacketType2["GET_INFO"] = 5] = "GET_INFO";
    PacketType2[PacketType2["GET_STATUS"] = 6] = "GET_STATUS";
    return PacketType2;
  })(PacketType || {});
  function validateLEDs(leds, startIndex = 0) {
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > 255) {
      throw new RangeError("startIndex must be an integer between 0 and 255");
    }
    if (leds.length < 4 || leds.length % 4 !== 0) {
      throw new RangeError("leds must contain one or more RGBW pixels");
    }
    if (startIndex + leds.length / 4 > 255) {
      throw new RangeError("LED range exceeds 255 pixels");
    }
  }
  var DEFAULT_SYNC_TIMEOUT = 1e3;
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
  function bufferToDeviceInfo(buffer) {
    if (buffer.length < 14)
      throw new Error(`Device info buffer too short: ${buffer.length} bytes, need at least 14`);
    const ip = Array.from(buffer.subarray(0, 4)).join(".");
    const port = buffer[4] << 8 | buffer[5];
    const mac = Array.from(buffer.subarray(6, 12), (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(":");
    const versionLen = buffer[12];
    const versionStart = 13;
    const versionEnd = versionStart + versionLen;
    if (buffer.length < versionEnd + 1)
      throw new Error(`Device info buffer too short for version: ${buffer.length} bytes, need ${versionEnd + 1}`);
    const hostnameLen = buffer[versionEnd];
    const hostnameStart = versionEnd + 1;
    const hostnameEnd = hostnameStart + hostnameLen;
    if (buffer.length < hostnameEnd)
      throw new Error(`Device info buffer too short for hostname: ${buffer.length} bytes, need ${hostnameEnd}`);
    return {
      ip,
      port,
      mac,
      version: decodeBuffer(buffer.subarray(versionStart, versionEnd)),
      hostname: decodeBuffer(buffer.subarray(hostnameStart, hostnameEnd)).substring(0, 32)
    };
  }
  var ARRIVAL_GAP_BUCKETS = 6;
  function bufferToStatus(buffer) {
    if (buffer.length < 9)
      throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`);
    const uptime = (buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3]) >>> 0;
    const heap = (buffer[4] << 24 | buffer[5] << 16 | buffer[6] << 8 | buffer[7]) >>> 0;
    const rssi = buffer[8] << 24 >> 24;
    const readU32 = (offset) => (buffer[offset] << 24 | buffer[offset + 1] << 16 | buffer[offset + 2] << 8 | buffer[offset + 3]) >>> 0;
    const status = { uptime, heap, rssi };
    if (buffer.length >= 41) {
      status.internalHeap = readU32(9);
      status.largestHeapBlock = readU32(13);
      status.minHeap = readU32(17);
      status.framesReceived = readU32(21);
      status.framesShown = readU32(25);
      status.framesDropped = readU32(29);
      status.udpPacketsRead = readU32(33);
      status.protocolLoopMaxGapMs = readU32(37);
    }
    if (buffer.length >= 89) {
      status.arrivalGapHist = Array.from({ length: ARRIVAL_GAP_BUCKETS }, (_, i) => readU32(41 + i * 4));
      status.arrivalGapMaxMs = readU32(65);
      status.arrivalGapMaxAgeS = readU32(69);
      status.seqLost = readU32(73);
      status.seqReordered = readU32(77);
      status.beaconTimeouts = readU32(81);
      status.wifiDisconnects = readU32(85);
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
  function sample(pixels, pixelsSize, grid, polygon, steps, wa = 0, output = new Uint8Array(steps * 4)) {
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
      const dstIndex = i * 4;
      output[dstIndex] = pixels[srcIndex];
      output[dstIndex + 1] = pixels[srcIndex + 1];
      output[dstIndex + 2] = pixels[srcIndex + 2];
      output[dstIndex + 3] = whiteFn ? whiteFn(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2]) : useAlpha ? pixels[srcIndex + 3] : fixedW;
    }
    return output;
  }

  // src/proxy.ts
  var import_meta = {};
  var scriptSrc = typeof document !== "undefined" ? document.currentScript?.src : void 0;
  function createWorker() {
    const base = import_meta.url || scriptSrc || "";
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
  var rid = FIRST_REQUEST_ID - 1;
  function nextRequestId() {
    for (let i = FIRST_REQUEST_ID; i <= 255; i++) {
      rid = rid === 255 ? FIRST_REQUEST_ID : rid + 1;
      if (!requests.has(rid)) return rid;
    }
    throw new Error("Too many pending requests");
  }
  function createRequest(buffer, timeout = DEFAULT_SYNC_TIMEOUT) {
    const requestId = nextRequestId();
    buffer[0] = requestId;
    const request = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        requests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out`));
      }, timeout);
      requests.set(requestId, { resolve, reject, timer });
    });
    return [request, buffer, requestId];
  }
  function rejectPendingRequests(message) {
    for (const [requestId, request] of requests) {
      clearTimeout(request.timer);
      request.reject(new Error(`${message} (${requestId})`));
    }
    requests.clear();
  }
  function handleResponse(event) {
    if (!(event.data instanceof Uint8Array)) return;
    const message = event.data;
    const responseId = message[0];
    const responseData = message.subarray(1);
    const request = requests.get(responseId);
    if (!request) {
      if (responseId === CONNECTION_CHANGE_REQUEST_ID && responseData[0] === 1 /* ConnectionChange */) {
        const next = responseData[1] === TRUE;
        if (next !== connected) {
          connected = next;
          if (!connected) rejectPendingRequests("Proxy disconnected");
          debug && console.log(`[Proxy] Connection change event: ${connected}`);
          connectionChangeCallbacks.forEach((callback) => callback(connected));
        }
        return;
      }
      debug && console.log(`[Proxy] Unknown request id ${responseId}`);
      return;
    }
    requests.delete(responseId);
    clearTimeout(request.timer);
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
    const buffer = new Uint8Array(2 + serverURL.length + 1);
    buffer[1] = 0 /* Connect */;
    encodeBuffer(serverURL, buffer, 2);
    buffer[2 + serverURL.length] = debug ? TRUE : FALSE;
    debug && console.log(`[Proxy] try to connect to ${serverURL}`, buffer);
    return sendSync(buffer).then((response) => response[1] === TRUE).catch(() => false);
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
  async function sendSync(data, timeout = DEFAULT_SYNC_TIMEOUT) {
    checkConnected();
    let [promise, buffer, requestId] = createRequest(data, timeout);
    debug && console.log(`[Proxy] sendSync [${requestId}] ${WorkerRequestTypeMap[buffer[1]]}`, buffer);
    try {
      daemon.postMessage(buffer, [buffer.buffer]);
    } catch (err) {
      const request = requests.get(requestId);
      if (request) {
        clearTimeout(request.timer);
        requests.delete(requestId);
      }
      throw err;
    }
    return promise;
  }
  function send(data) {
    checkConnected();
    data[0] = EMPTY_REQUEST_ID;
    debug && console.log(`[Proxy] send ${WorkerRequestTypeMap[data[1]]}`, data);
    daemon.postMessage(data, [data.buffer]);
  }

  // src/main.ts
  var addressBuffers = /* @__PURE__ */ new Map();
  function createPacket(ip, port, type, data, dataPrefix) {
    const address = `${ip}:${port}`;
    let addressPacket = addressBuffers.get(address);
    if (!addressPacket) {
      addressPacket = addressToBuffer(ip, port);
      addressBuffers.set(address, addressPacket);
    }
    const addrLen = addressPacket.length;
    const dataLen = (data ? data.length : 0) + (dataPrefix === void 0 ? 0 : 1);
    const totalLen = 2 + addrLen + 1 + dataLen;
    let offset = 1;
    const buffer = new Uint8Array(totalLen);
    buffer[offset++] = 2 /* Send */;
    buffer.set(addressPacket, offset);
    offset += addrLen;
    buffer[offset++] = type;
    if (dataPrefix !== void 0) buffer[offset++] = dataPrefix;
    if (data) buffer.set(data, offset);
    return buffer;
  }
  function begin(serverURL, debug2 = false) {
    return wsconnect(serverURL, debug2);
  }
  function ping(ip, port = 4210) {
    return sendSync(createPacket(ip, port, 0 /* PING */)).then(
      (response) => response.length === 1 && response[0] === TRUE
    ).catch(() => false);
  }
  function getConfig(ip, port = 4210) {
    return sendSync(createPacket(ip, port, 1 /* GET_CONFIG */)).then((response) => {
      if (response.length === 1 && response[0] === FALSE) return null;
      return bufferToConfig(response);
    }).catch(() => null);
  }
  function getInfo(ip, port = 4210) {
    return sendSync(createPacket(ip, port, 5 /* GET_INFO */)).then((response) => {
      if (response.length === 1 && response[0] === FALSE) return null;
      return bufferToDeviceInfo(response);
    }).catch(() => null);
  }
  function getStatus(ip, port = 4210) {
    return sendSync(createPacket(ip, port, 6 /* GET_STATUS */)).then((response) => {
      if (response.length === 1 && response[0] === FALSE) return null;
      return bufferToStatus(response);
    }).catch(() => null);
  }
  function setLEDs(ip, port = 4210, leds, startIndex = 0) {
    validateLEDs(leds, startIndex);
    send(createPacket(ip, port, 3 /* SET_LEDS */, leds, startIndex));
  }
  async function connect(ip, port = 4210) {
    const alive = await ping(ip, port);
    if (!alive) return null;
    const config = await getConfig(ip, port);
    if (!config) return null;
    return {
      config,
      send: (leds, startIndex = 0) => setLEDs(ip, port, leds, startIndex),
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
    getInfo,
    getConfig,
    getStatus,
    setLEDs,
    sendRaw,
    sendRawSync,
    sample,
    PacketType
  };
  var main_default = reactiveLeds;
  return __toCommonJS(main_exports);
})();
return reactiveLeds.default })
