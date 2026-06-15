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
    begin: () => begin,
    connect: () => connect,
    default: () => main_default,
    getConfig: () => getConfig,
    getStatus: () => getStatus,
    isConnected: () => isConnected,
    mapPixels: () => mapPixels,
    onConnectionChange: () => onConnectionChange,
    ping: () => ping,
    setLEDs: () => setLEDs
  });

  // ../shared/protocol.ts
  function bufferToConfig(buffer) {
    if (buffer.length < 4) {
      throw new Error(`Config buffer too short: ${buffer.length} bytes, need at least 4`);
    }
    return {
      pin: buffer[0],
      num_leds: buffer[1],
      port: buffer[2] << 8 | buffer[3],
      hostname: decodeBuffer(buffer.slice(4)).substring(0, 32)
    };
  }
  function bufferToStatus(buffer) {
    if (buffer.length < 9)
      throw new Error(`Status buffer too short: ${buffer.length} bytes, need at least 9`);
    const uptime = (buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3]) >>> 0;
    const heap = (buffer[4] << 24 | buffer[5] << 16 | buffer[6] << 8 | buffer[7]) >>> 0;
    const rssi = buffer[8] << 24 >> 24;
    return { uptime, heap, rssi };
  }
  function addressToBuffer(address, port) {
    const buffer = new Uint8Array(6);
    if (typeof address === "string") {
      const parts = address.split(".");
      if (parts.length !== 4) {
        throw new Error(`Invalid IP address: "${address}"`);
      }
      const octets = parts.map(Number);
      if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
        throw new Error(`Invalid IP address: "${address}"`);
      }
      buffer[0] = octets[0];
      buffer[1] = octets[1];
      buffer[2] = octets[2];
      buffer[3] = octets[3];
    } else {
      if (address.length < 4) {
        throw new Error(`IP array too short: ${address.length} elements`);
      }
      buffer.set(address.slice(0, 4), 0);
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
  function step(t, xStart, yStart, xEnd, yEnd) {
    const x = (1 - t) * xStart + t * xEnd;
    const y = (1 - t) * yStart + t * yEnd;
    return [x, y];
  }
  function mapPixels(pixels, pixelsSize, grid, polygon, steps, wa = 0, output = new Uint8Array(steps * 5)) {
    const [imgWidth, imgHeight] = pixelsSize;
    const [cells, rows] = grid;
    const [x0, y0, x1, y1, x2, y2, x3, y3] = polygon;
    const cellWidth = imgWidth / cells;
    const cellHeight = imgHeight / rows;
    const physicalWidth = (x1 - x0) * cellWidth;
    const physicalHeight = (y3 - y0) * cellHeight;
    const aspectRatio = physicalHeight > 0 ? physicalWidth / physicalHeight : 1;
    const ledCols = Math.max(1, Math.round(Math.sqrt(steps * aspectRatio)));
    const ledRows = Math.ceil(steps / ledCols);
    for (let i = 0; i < steps; i++) {
      let ledRow = Math.floor(i / ledCols);
      let ledCol = i % ledCols;
      if (ledRow % 2 === 1) {
        ledCol = ledCols - 1 - ledCol;
      }
      const u = (ledCol + 0.5) / ledCols;
      const v = (ledRow + 0.5) / ledRows;
      const [topX, topY] = step(u, x0, y0, x1, y1);
      const [botX, botY] = step(u, x3, y3, x2, y2);
      const [gridX, gridY] = step(v, topX, topY, botX, botY);
      let sx = Math.floor(gridX * cellWidth);
      let sy = Math.floor(gridY * cellHeight);
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
      output[dstIndex + 4] = typeof wa === "number" ? wa : typeof wa === "function" ? wa(pixels[srcIndex], pixels[srcIndex + 1], pixels[srcIndex + 2]) : wa === true ? pixels[srcIndex + 3] : 0;
    }
    return output;
  }

  // src/proxy.ts
  var import_meta = {};
  var scriptSrc = typeof document !== "undefined" ? document.currentScript?.src : void 0;
  function createWorker() {
    const base = import_meta.url || scriptSrc || "";
    return new Worker(new URL("./daemon.worker.js", base).href, { type: "module" });
  }
  var requests = [];
  var connectionChangeCallbacks = [];
  var connected = false;
  var rid = 0;
  function createRequest(buffer) {
    const requestId = FIRST_REQUEST_ID + rid++ % (255 - FIRST_REQUEST_ID) + 1;
    const newBuffer = new Uint8Array(1 + buffer.length);
    newBuffer[0] = requestId;
    newBuffer.set(buffer, 1);
    const request = new Promise((resolve) => {
      requests.push({
        resolve,
        requestId,
        message: newBuffer
      });
    });
    return [request, newBuffer, requestId];
  }
  function handleResponse(event) {
    const message = event.data;
    const responseId = message[0];
    const responseData = message.slice(1);
    const request = requests.find((r) => r.requestId === responseId);
    if (!request) {
      if (responseId == CONNECTION_CHANGE_REQUEST_ID && responseData[0] === 1 /* ConnectionChange */) {
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
    requests = requests.filter((r) => r.requestId !== responseId);
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
    if (connectionChangeCallbacks.includes(callback))
      return;
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
  var deviceIPMap = /* @__PURE__ */ new Map();
  function createPacket(address, port, type, data) {
    const key = `${address}:${port}`;
    let addressPacket = deviceIPMap.get(key);
    if (!addressPacket) {
      addressPacket = addressToBuffer(address, port);
      deviceIPMap.set(key, addressPacket);
    }
    const addrLen = addressPacket.length;
    const dataLen = data ? data.length : 0;
    const totalLen = 1 + addrLen + 1 + dataLen;
    const buffer = new Uint8Array(totalLen);
    buffer[0] = 2 /* Send */;
    buffer.set(addressPacket, 1);
    buffer[1 + addrLen] = type;
    if (data) buffer.set(data, 1 + addrLen + 1);
    return buffer;
  }
  function begin(serverURL, debug2 = false) {
    return wsconnect(serverURL, debug2);
  }
  function ping(address, port = 4210) {
    return sendSync(createPacket(address, port, 0 /* PING */)).then(
      (response) => response.length === 1 && response[0] === TRUE
    );
  }
  function getConfig(address, port = 4210) {
    return sendSync(createPacket(address, port, 1 /* GET_CONFIG */)).then((response) => {
      if (response.length === 1 && response[0] === FALSE) return null;
      return bufferToConfig(response);
    });
  }
  function getStatus(address, port = 4210) {
    return sendSync(createPacket(address, port, 6 /* GET_STATUS */)).then((response) => {
      if (response.length === 1 && response[0] === FALSE) return null;
      return bufferToStatus(response);
    });
  }
  function setLEDs(address, port = 4210, leds) {
    send(createPacket(address, port, 3 /* SET_LEDS */, leds));
  }
  async function connect(address, port = 4210) {
    const alive = await ping(address, port);
    if (!alive) return null;
    const config = await getConfig(address, port);
    if (!config) return null;
    return {
      config,
      send: (leds) => setLEDs(address, port, leds)
    };
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
    mapPixels
  };
  var main_default = reactiveLeds;
  return __toCommonJS(main_exports);
})();
return reactiveLeds.default })
