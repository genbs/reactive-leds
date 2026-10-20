var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../shared/build/protocol.js
var require_protocol = __commonJS({
  "../shared/build/protocol.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STATUS_PAYLOAD_BYTES = exports.ARRIVAL_GAP_BOUNDS_MS = exports.ARRIVAL_GAP_BUCKETS = exports.PacketTypeMap = exports.DEFAULT_SYNC_TIMEOUT = exports.EMPTY_PACKET_ID = exports.PacketStatus = exports.availableConfigKeys = exports.PacketType = void 0;
    exports.validateLEDs = validateLEDs;
    exports.bufferToConfig = bufferToConfig;
    exports.configToBuffer = configToBuffer;
    exports.bufferToDeviceInfo = bufferToDeviceInfo;
    exports.deviceInfoToBuffer = deviceInfoToBuffer;
    exports.bufferToStatus = bufferToStatus;
    exports.statusToBuffer = statusToBuffer;
    exports.addressToBuffer = addressToBuffer;
    exports.wifiCredentialsToBuffer = wifiCredentialsToBuffer;
    exports.encodeBuffer = encodeBuffer;
    exports.decodeBuffer = decodeBuffer2;
    var PacketType;
    (function(PacketType2) {
      PacketType2[PacketType2["PING"] = 0] = "PING";
      PacketType2[PacketType2["GET_CONFIG"] = 1] = "GET_CONFIG";
      PacketType2[PacketType2["SET_CONFIG"] = 2] = "SET_CONFIG";
      PacketType2[PacketType2["SET_LEDS"] = 3] = "SET_LEDS";
      PacketType2[PacketType2["RESET_WIFI"] = 4] = "RESET_WIFI";
      PacketType2[PacketType2["GET_INFO"] = 5] = "GET_INFO";
      PacketType2[PacketType2["GET_STATUS"] = 6] = "GET_STATUS";
    })(PacketType || (exports.PacketType = PacketType = {}));
    exports.availableConfigKeys = ["hostname", "pin", "num_leds", "port"];
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
    var PacketStatus;
    (function(PacketStatus2) {
      PacketStatus2[PacketStatus2["OK"] = 1] = "OK";
      PacketStatus2[PacketStatus2["ERROR"] = 0] = "ERROR";
    })(PacketStatus || (exports.PacketStatus = PacketStatus = {}));
    exports.EMPTY_PACKET_ID = 0;
    exports.DEFAULT_SYNC_TIMEOUT = 1e3;
    exports.PacketTypeMap = {
      [PacketType.PING]: "PING",
      [PacketType.GET_CONFIG]: "GET_CONFIG",
      [PacketType.SET_CONFIG]: "SET_CONFIG",
      [PacketType.SET_LEDS]: "SET_LEDS",
      [PacketType.RESET_WIFI]: "RESET_WIFI",
      [PacketType.GET_INFO]: "GET_INFO",
      [PacketType.GET_STATUS]: "GET_STATUS"
    };
    function bufferToConfig(buffer) {
      if (buffer.length < 4) {
        throw new Error(`Config buffer too short: ${buffer.length} bytes, need at least 4`);
      }
      return {
        pin: buffer[0],
        num_leds: buffer[1],
        port: buffer[2] << 8 | buffer[3],
        hostname: decodeBuffer2(buffer.subarray(4)).substring(0, 32)
      };
    }
    function configToBuffer(config) {
      const hostname = config.hostname.substring(0, 32);
      const packet = new Uint8Array(4 + hostname.length);
      packet[0] = config.pin;
      packet[1] = config.num_leds;
      packet[2] = config.port >> 8 & 255;
      packet[3] = config.port & 255;
      encodeBuffer(hostname, packet, 4);
      return packet;
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
        version: decodeBuffer2(buffer.subarray(versionStart, versionEnd)),
        hostname: decodeBuffer2(buffer.subarray(hostnameStart, hostnameEnd)).substring(0, 32)
      };
    }
    function deviceInfoToBuffer(info) {
      const ip = addressToBuffer(info.ip, info.port).subarray(0, 4);
      const macParts = info.mac.split(":");
      if (macParts.length !== 6)
        throw new Error(`Invalid MAC: "${info.mac}"`);
      const version = encodeBuffer(info.version.substring(0, 32));
      const hostname = encodeBuffer(info.hostname.substring(0, 32));
      const buffer = new Uint8Array(4 + 2 + 6 + 1 + version.length + 1 + hostname.length);
      buffer.set(ip, 0);
      buffer[4] = info.port >> 8 & 255;
      buffer[5] = info.port & 255;
      for (let i = 0; i < 6; i++) {
        if (!/^[0-9a-f]{1,2}$/i.test(macParts[i]))
          throw new Error(`Invalid MAC: "${info.mac}"`);
        buffer[6 + i] = Number.parseInt(macParts[i], 16);
      }
      buffer[12] = version.length;
      buffer.set(version, 13);
      const hostnameLenOffset = 13 + version.length;
      buffer[hostnameLenOffset] = hostname.length;
      buffer.set(hostname, hostnameLenOffset + 1);
      return buffer;
    }
    exports.ARRIVAL_GAP_BUCKETS = 6;
    exports.ARRIVAL_GAP_BOUNDS_MS = [5, 10, 20, 50, 100];
    exports.STATUS_PAYLOAD_BYTES = 89;
    function bufferToStatus(buffer) {
      if (buffer.length !== exports.STATUS_PAYLOAD_BYTES)
        throw new Error(`Invalid status buffer length: ${buffer.length} bytes, expected ${exports.STATUS_PAYLOAD_BYTES}`);
      const uptime = (buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3]) >>> 0;
      const heap = (buffer[4] << 24 | buffer[5] << 16 | buffer[6] << 8 | buffer[7]) >>> 0;
      const rssi = buffer[8] << 24 >> 24;
      const readU32 = (offset) => (buffer[offset] << 24 | buffer[offset + 1] << 16 | buffer[offset + 2] << 8 | buffer[offset + 3]) >>> 0;
      return {
        uptime,
        heap,
        rssi,
        internalHeap: readU32(9),
        largestHeapBlock: readU32(13),
        minHeap: readU32(17),
        framesReceived: readU32(21),
        framesShown: readU32(25),
        framesDropped: readU32(29),
        udpPacketsRead: readU32(33),
        protocolLoopMaxGapMs: readU32(37),
        arrivalGapHist: Array.from({ length: exports.ARRIVAL_GAP_BUCKETS }, (_, i) => readU32(41 + i * 4)),
        arrivalGapMaxMs: readU32(65),
        arrivalGapMaxAgeS: readU32(69),
        seqLost: readU32(73),
        seqReordered: readU32(77),
        beaconTimeouts: readU32(81),
        wifiDisconnects: readU32(85)
      };
    }
    function statusToBuffer(status) {
      const buffer = new Uint8Array(exports.STATUS_PAYLOAD_BYTES);
      buffer[0] = status.uptime >>> 24 & 255;
      buffer[1] = status.uptime >>> 16 & 255;
      buffer[2] = status.uptime >>> 8 & 255;
      buffer[3] = status.uptime & 255;
      buffer[4] = status.heap >>> 24 & 255;
      buffer[5] = status.heap >>> 16 & 255;
      buffer[6] = status.heap >>> 8 & 255;
      buffer[7] = status.heap & 255;
      buffer[8] = status.rssi & 255;
      const writeU32 = (offset, value) => {
        buffer[offset] = value >>> 24 & 255;
        buffer[offset + 1] = value >>> 16 & 255;
        buffer[offset + 2] = value >>> 8 & 255;
        buffer[offset + 3] = value & 255;
      };
      writeU32(9, status.internalHeap);
      writeU32(13, status.largestHeapBlock);
      writeU32(17, status.minHeap);
      writeU32(21, status.framesReceived);
      writeU32(25, status.framesShown);
      writeU32(29, status.framesDropped);
      writeU32(33, status.udpPacketsRead);
      writeU32(37, status.protocolLoopMaxGapMs);
      for (let i = 0; i < exports.ARRIVAL_GAP_BUCKETS; i++)
        writeU32(41 + i * 4, status.arrivalGapHist[i] ?? 0);
      writeU32(65, status.arrivalGapMaxMs);
      writeU32(69, status.arrivalGapMaxAgeS);
      writeU32(73, status.seqLost);
      writeU32(77, status.seqReordered);
      writeU32(81, status.beaconTimeouts);
      writeU32(85, status.wifiDisconnects);
      return buffer;
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
    function wifiCredentialsToBuffer(ssid, password) {
      const ssidBytes = encoder.encode(ssid);
      const passwordBytes = encoder.encode(password);
      if (ssidBytes.length < 1 || ssidBytes.length > 32 || ssidBytes.includes(0))
        throw new RangeError("SSID must contain 1 to 32 non-null UTF-8 bytes");
      if (passwordBytes.length > 63 || passwordBytes.includes(0))
        throw new RangeError("Password must contain at most 63 non-null UTF-8 bytes");
      const buffer = new Uint8Array(2 + ssidBytes.length + passwordBytes.length);
      buffer[0] = ssidBytes.length;
      buffer[1] = passwordBytes.length;
      buffer.set(ssidBytes, 2);
      buffer.set(passwordBytes, 2 + ssidBytes.length);
      return buffer;
    }
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
    function decodeBuffer2(buffer) {
      const nullIndex = buffer.indexOf(0);
      if (nullIndex !== -1)
        return decoder.decode(buffer.subarray(0, nullIndex));
      return decoder.decode(buffer);
    }
  }
});

// ../shared/build/index.js
var require_build = __commonJS({
  "../shared/build/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_protocol(), exports);
  }
});

// src/daemon.worker.ts
var import_shared = __toESM(require_build());

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
    this.socketURL = null;
    this.settings = { ...defaultSettings, ...settings };
    if (this.settings.autoConnect) this.connect();
    else this.socket = null;
    this.connected = false;
  }
  /**
   * Connects to the WebSocket server.
   * Reuses an open connection to the same URL. A different URL replaces it.
   */
  connect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
      this.retries = 0;
    }
    this.settings.debug && console.log("[WS] Connecting to", this.settings.url);
    if (this.socket && this.connected && this.socket.readyState === WebSocket.OPEN && this.socketURL === this.settings.url) {
      this.settings.debug && console.log("[WS] Already connected to", this.settings.url);
      this.settings.onConnectionChange?.(true);
      return;
    }
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
    this.socketURL = this.settings.url;
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
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
    this.socketURL = null;
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
  const message = e.data.subarray(2);
  debug && console.log(
    `[Worker] recv from client [${requestId}] ${WorkerRequestTypeMap[type]}`,
    message
  );
  switch (type) {
    // handle connection request [WorkerRequestType.Connect, serverUrl, debug]
    case 0 /* Connect */:
      const serverUrl = (0, import_shared.decodeBuffer)(message.slice(0, message.length - 1));
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
      const request = e.data.subarray(1);
      request[0] = requestId;
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
  const message = packet.subarray(1);
  debug && console.log(`[Worker] received from backend [${requestId}]`, message);
  self.postMessage(packet);
}
