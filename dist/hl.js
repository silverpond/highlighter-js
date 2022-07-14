/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/paho-mqtt/paho-mqtt.js":
/*!*********************************************!*\
  !*** ./node_modules/paho-mqtt/paho-mqtt.js ***!
  \*********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/*******************************************************************************
 * Copyright (c) 2013 IBM Corp.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 *
 * The Eclipse Public License is available at
 *    http://www.eclipse.org/legal/epl-v10.html
 * and the Eclipse Distribution License is available at
 *   http://www.eclipse.org/org/documents/edl-v10.php.
 *
 * Contributors:
 *    Andrew Banks - initial API and implementation and initial documentation
 *******************************************************************************/


// Only expose a single object name in the global namespace.
// Everything must go through this module. Global Paho module
// only has a single public function, client, which returns
// a Paho client object given connection details.

/**
 * Send and receive messages using web browsers.
 * <p>
 * This programming interface lets a JavaScript client application use the MQTT V3.1 or
 * V3.1.1 protocol to connect to an MQTT-supporting messaging server.
 *
 * The function supported includes:
 * <ol>
 * <li>Connecting to and disconnecting from a server. The server is identified by its host name and port number.
 * <li>Specifying options that relate to the communications link with the server,
 * for example the frequency of keep-alive heartbeats, and whether SSL/TLS is required.
 * <li>Subscribing to and receiving messages from MQTT Topics.
 * <li>Publishing messages to MQTT Topics.
 * </ol>
 * <p>
 * The API consists of two main objects:
 * <dl>
 * <dt><b>{@link Paho.Client}</b></dt>
 * <dd>This contains methods that provide the functionality of the API,
 * including provision of callbacks that notify the application when a message
 * arrives from or is delivered to the messaging server,
 * or when the status of its connection to the messaging server changes.</dd>
 * <dt><b>{@link Paho.Message}</b></dt>
 * <dd>This encapsulates the payload of the message along with various attributes
 * associated with its delivery, in particular the destination to which it has
 * been (or is about to be) sent.</dd>
 * </dl>
 * <p>
 * The programming interface validates parameters passed to it, and will throw
 * an Error containing an error message intended for developer use, if it detects
 * an error with any parameter.
 * <p>
 * Example:
 *
 * <code><pre>
var client = new Paho.MQTT.Client(location.hostname, Number(location.port), "clientId");
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
client.connect({onSuccess:onConnect});

function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("/World");
  var message = new Paho.MQTT.Message("Hello");
  message.destinationName = "/World";
  client.send(message);
};
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0)
	console.log("onConnectionLost:"+responseObject.errorMessage);
};
function onMessageArrived(message) {
  console.log("onMessageArrived:"+message.payloadString);
  client.disconnect();
};
 * </pre></code>
 * @namespace Paho
 */

/* jshint shadow:true */
(function ExportLibrary(root, factory) {
	if(true){
		module.exports = factory();
	} else {}
})(this, function LibraryFactory(){


	var PahoMQTT = (function (global) {

	// Private variables below, these are only visible inside the function closure
	// which is used to define the module.
	var version = "@VERSION@-@BUILDLEVEL@";

	/**
	 * @private
	 */
	var localStorage = global.localStorage || (function () {
		var data = {};

		return {
			setItem: function (key, item) { data[key] = item; },
			getItem: function (key) { return data[key]; },
			removeItem: function (key) { delete data[key]; },
		};
	})();

		/**
	 * Unique message type identifiers, with associated
	 * associated integer values.
	 * @private
	 */
		var MESSAGE_TYPE = {
			CONNECT: 1,
			CONNACK: 2,
			PUBLISH: 3,
			PUBACK: 4,
			PUBREC: 5,
			PUBREL: 6,
			PUBCOMP: 7,
			SUBSCRIBE: 8,
			SUBACK: 9,
			UNSUBSCRIBE: 10,
			UNSUBACK: 11,
			PINGREQ: 12,
			PINGRESP: 13,
			DISCONNECT: 14
		};

		// Collection of utility methods used to simplify module code
		// and promote the DRY pattern.

		/**
	 * Validate an object's parameter names to ensure they
	 * match a list of expected variables name for this option
	 * type. Used to ensure option object passed into the API don't
	 * contain erroneous parameters.
	 * @param {Object} obj - User options object
	 * @param {Object} keys - valid keys and types that may exist in obj.
	 * @throws {Error} Invalid option parameter found.
	 * @private
	 */
		var validate = function(obj, keys) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (keys.hasOwnProperty(key)) {
						if (typeof obj[key] !== keys[key])
							throw new Error(format(ERROR.INVALID_TYPE, [typeof obj[key], key]));
					} else {
						var errorStr = "Unknown property, " + key + ". Valid properties are:";
						for (var validKey in keys)
							if (keys.hasOwnProperty(validKey))
								errorStr = errorStr+" "+validKey;
						throw new Error(errorStr);
					}
				}
			}
		};

		/**
	 * Return a new function which runs the user function bound
	 * to a fixed scope.
	 * @param {function} User function
	 * @param {object} Function scope
	 * @return {function} User function bound to another scope
	 * @private
	 */
		var scope = function (f, scope) {
			return function () {
				return f.apply(scope, arguments);
			};
		};

		/**
	 * Unique message type identifiers, with associated
	 * associated integer values.
	 * @private
	 */
		var ERROR = {
			OK: {code:0, text:"AMQJSC0000I OK."},
			CONNECT_TIMEOUT: {code:1, text:"AMQJSC0001E Connect timed out."},
			SUBSCRIBE_TIMEOUT: {code:2, text:"AMQJS0002E Subscribe timed out."},
			UNSUBSCRIBE_TIMEOUT: {code:3, text:"AMQJS0003E Unsubscribe timed out."},
			PING_TIMEOUT: {code:4, text:"AMQJS0004E Ping timed out."},
			INTERNAL_ERROR: {code:5, text:"AMQJS0005E Internal error. Error Message: {0}, Stack trace: {1}"},
			CONNACK_RETURNCODE: {code:6, text:"AMQJS0006E Bad Connack return code:{0} {1}."},
			SOCKET_ERROR: {code:7, text:"AMQJS0007E Socket error:{0}."},
			SOCKET_CLOSE: {code:8, text:"AMQJS0008I Socket closed."},
			MALFORMED_UTF: {code:9, text:"AMQJS0009E Malformed UTF data:{0} {1} {2}."},
			UNSUPPORTED: {code:10, text:"AMQJS0010E {0} is not supported by this browser."},
			INVALID_STATE: {code:11, text:"AMQJS0011E Invalid state {0}."},
			INVALID_TYPE: {code:12, text:"AMQJS0012E Invalid type {0} for {1}."},
			INVALID_ARGUMENT: {code:13, text:"AMQJS0013E Invalid argument {0} for {1}."},
			UNSUPPORTED_OPERATION: {code:14, text:"AMQJS0014E Unsupported operation."},
			INVALID_STORED_DATA: {code:15, text:"AMQJS0015E Invalid data in local storage key={0} value={1}."},
			INVALID_MQTT_MESSAGE_TYPE: {code:16, text:"AMQJS0016E Invalid MQTT message type {0}."},
			MALFORMED_UNICODE: {code:17, text:"AMQJS0017E Malformed Unicode string:{0} {1}."},
			BUFFER_FULL: {code:18, text:"AMQJS0018E Message buffer is full, maximum buffer size: {0}."},
		};

		/** CONNACK RC Meaning. */
		var CONNACK_RC = {
			0:"Connection Accepted",
			1:"Connection Refused: unacceptable protocol version",
			2:"Connection Refused: identifier rejected",
			3:"Connection Refused: server unavailable",
			4:"Connection Refused: bad user name or password",
			5:"Connection Refused: not authorized"
		};

	/**
	 * Format an error message text.
	 * @private
	 * @param {error} ERROR value above.
	 * @param {substitutions} [array] substituted into the text.
	 * @return the text with the substitutions made.
	 */
		var format = function(error, substitutions) {
			var text = error.text;
			if (substitutions) {
				var field,start;
				for (var i=0; i<substitutions.length; i++) {
					field = "{"+i+"}";
					start = text.indexOf(field);
					if(start > 0) {
						var part1 = text.substring(0,start);
						var part2 = text.substring(start+field.length);
						text = part1+substitutions[i]+part2;
					}
				}
			}
			return text;
		};

		//MQTT protocol and version          6    M    Q    I    s    d    p    3
		var MqttProtoIdentifierv3 = [0x00,0x06,0x4d,0x51,0x49,0x73,0x64,0x70,0x03];
		//MQTT proto/version for 311         4    M    Q    T    T    4
		var MqttProtoIdentifierv4 = [0x00,0x04,0x4d,0x51,0x54,0x54,0x04];

		/**
	 * Construct an MQTT wire protocol message.
	 * @param type MQTT packet type.
	 * @param options optional wire message attributes.
	 *
	 * Optional properties
	 *
	 * messageIdentifier: message ID in the range [0..65535]
	 * payloadMessage:	Application Message - PUBLISH only
	 * connectStrings:	array of 0 or more Strings to be put into the CONNECT payload
	 * topics:			array of strings (SUBSCRIBE, UNSUBSCRIBE)
	 * requestQoS:		array of QoS values [0..2]
	 *
	 * "Flag" properties
	 * cleanSession:	true if present / false if absent (CONNECT)
	 * willMessage:  	true if present / false if absent (CONNECT)
	 * isRetained:		true if present / false if absent (CONNECT)
	 * userName:		true if present / false if absent (CONNECT)
	 * password:		true if present / false if absent (CONNECT)
	 * keepAliveInterval:	integer [0..65535]  (CONNECT)
	 *
	 * @private
	 * @ignore
	 */
		var WireMessage = function (type, options) {
			this.type = type;
			for (var name in options) {
				if (options.hasOwnProperty(name)) {
					this[name] = options[name];
				}
			}
		};

		WireMessage.prototype.encode = function() {
		// Compute the first byte of the fixed header
			var first = ((this.type & 0x0f) << 4);

			/*
		 * Now calculate the length of the variable header + payload by adding up the lengths
		 * of all the component parts
		 */

			var remLength = 0;
			var topicStrLength = [];
			var destinationNameLength = 0;
			var willMessagePayloadBytes;

			// if the message contains a messageIdentifier then we need two bytes for that
			if (this.messageIdentifier !== undefined)
				remLength += 2;

			switch(this.type) {
			// If this a Connect then we need to include 12 bytes for its header
			case MESSAGE_TYPE.CONNECT:
				switch(this.mqttVersion) {
				case 3:
					remLength += MqttProtoIdentifierv3.length + 3;
					break;
				case 4:
					remLength += MqttProtoIdentifierv4.length + 3;
					break;
				}

				remLength += UTF8Length(this.clientId) + 2;
				if (this.willMessage !== undefined) {
					remLength += UTF8Length(this.willMessage.destinationName) + 2;
					// Will message is always a string, sent as UTF-8 characters with a preceding length.
					willMessagePayloadBytes = this.willMessage.payloadBytes;
					if (!(willMessagePayloadBytes instanceof Uint8Array))
						willMessagePayloadBytes = new Uint8Array(payloadBytes);
					remLength += willMessagePayloadBytes.byteLength +2;
				}
				if (this.userName !== undefined)
					remLength += UTF8Length(this.userName) + 2;
				if (this.password !== undefined)
					remLength += UTF8Length(this.password) + 2;
				break;

			// Subscribe, Unsubscribe can both contain topic strings
			case MESSAGE_TYPE.SUBSCRIBE:
				first |= 0x02; // Qos = 1;
				for ( var i = 0; i < this.topics.length; i++) {
					topicStrLength[i] = UTF8Length(this.topics[i]);
					remLength += topicStrLength[i] + 2;
				}
				remLength += this.requestedQos.length; // 1 byte for each topic's Qos
				// QoS on Subscribe only
				break;

			case MESSAGE_TYPE.UNSUBSCRIBE:
				first |= 0x02; // Qos = 1;
				for ( var i = 0; i < this.topics.length; i++) {
					topicStrLength[i] = UTF8Length(this.topics[i]);
					remLength += topicStrLength[i] + 2;
				}
				break;

			case MESSAGE_TYPE.PUBREL:
				first |= 0x02; // Qos = 1;
				break;

			case MESSAGE_TYPE.PUBLISH:
				if (this.payloadMessage.duplicate) first |= 0x08;
				first  = first |= (this.payloadMessage.qos << 1);
				if (this.payloadMessage.retained) first |= 0x01;
				destinationNameLength = UTF8Length(this.payloadMessage.destinationName);
				remLength += destinationNameLength + 2;
				var payloadBytes = this.payloadMessage.payloadBytes;
				remLength += payloadBytes.byteLength;
				if (payloadBytes instanceof ArrayBuffer)
					payloadBytes = new Uint8Array(payloadBytes);
				else if (!(payloadBytes instanceof Uint8Array))
					payloadBytes = new Uint8Array(payloadBytes.buffer);
				break;

			case MESSAGE_TYPE.DISCONNECT:
				break;

			default:
				break;
			}

			// Now we can allocate a buffer for the message

			var mbi = encodeMBI(remLength);  // Convert the length to MQTT MBI format
			var pos = mbi.length + 1;        // Offset of start of variable header
			var buffer = new ArrayBuffer(remLength + pos);
			var byteStream = new Uint8Array(buffer);    // view it as a sequence of bytes

			//Write the fixed header into the buffer
			byteStream[0] = first;
			byteStream.set(mbi,1);

			// If this is a PUBLISH then the variable header starts with a topic
			if (this.type == MESSAGE_TYPE.PUBLISH)
				pos = writeString(this.payloadMessage.destinationName, destinationNameLength, byteStream, pos);
			// If this is a CONNECT then the variable header contains the protocol name/version, flags and keepalive time

			else if (this.type == MESSAGE_TYPE.CONNECT) {
				switch (this.mqttVersion) {
				case 3:
					byteStream.set(MqttProtoIdentifierv3, pos);
					pos += MqttProtoIdentifierv3.length;
					break;
				case 4:
					byteStream.set(MqttProtoIdentifierv4, pos);
					pos += MqttProtoIdentifierv4.length;
					break;
				}
				var connectFlags = 0;
				if (this.cleanSession)
					connectFlags = 0x02;
				if (this.willMessage !== undefined ) {
					connectFlags |= 0x04;
					connectFlags |= (this.willMessage.qos<<3);
					if (this.willMessage.retained) {
						connectFlags |= 0x20;
					}
				}
				if (this.userName !== undefined)
					connectFlags |= 0x80;
				if (this.password !== undefined)
					connectFlags |= 0x40;
				byteStream[pos++] = connectFlags;
				pos = writeUint16 (this.keepAliveInterval, byteStream, pos);
			}

			// Output the messageIdentifier - if there is one
			if (this.messageIdentifier !== undefined)
				pos = writeUint16 (this.messageIdentifier, byteStream, pos);

			switch(this.type) {
			case MESSAGE_TYPE.CONNECT:
				pos = writeString(this.clientId, UTF8Length(this.clientId), byteStream, pos);
				if (this.willMessage !== undefined) {
					pos = writeString(this.willMessage.destinationName, UTF8Length(this.willMessage.destinationName), byteStream, pos);
					pos = writeUint16(willMessagePayloadBytes.byteLength, byteStream, pos);
					byteStream.set(willMessagePayloadBytes, pos);
					pos += willMessagePayloadBytes.byteLength;

				}
				if (this.userName !== undefined)
					pos = writeString(this.userName, UTF8Length(this.userName), byteStream, pos);
				if (this.password !== undefined)
					pos = writeString(this.password, UTF8Length(this.password), byteStream, pos);
				break;

			case MESSAGE_TYPE.PUBLISH:
				// PUBLISH has a text or binary payload, if text do not add a 2 byte length field, just the UTF characters.
				byteStream.set(payloadBytes, pos);

				break;

				//    	    case MESSAGE_TYPE.PUBREC:
				//    	    case MESSAGE_TYPE.PUBREL:
				//    	    case MESSAGE_TYPE.PUBCOMP:
				//    	    	break;

			case MESSAGE_TYPE.SUBSCRIBE:
				// SUBSCRIBE has a list of topic strings and request QoS
				for (var i=0; i<this.topics.length; i++) {
					pos = writeString(this.topics[i], topicStrLength[i], byteStream, pos);
					byteStream[pos++] = this.requestedQos[i];
				}
				break;

			case MESSAGE_TYPE.UNSUBSCRIBE:
				// UNSUBSCRIBE has a list of topic strings
				for (var i=0; i<this.topics.length; i++)
					pos = writeString(this.topics[i], topicStrLength[i], byteStream, pos);
				break;

			default:
				// Do nothing.
			}

			return buffer;
		};

		function decodeMessage(input,pos) {
			var startingPos = pos;
			var first = input[pos];
			var type = first >> 4;
			var messageInfo = first &= 0x0f;
			pos += 1;


			// Decode the remaining length (MBI format)

			var digit;
			var remLength = 0;
			var multiplier = 1;
			do {
				if (pos == input.length) {
					return [null,startingPos];
				}
				digit = input[pos++];
				remLength += ((digit & 0x7F) * multiplier);
				multiplier *= 128;
			} while ((digit & 0x80) !== 0);

			var endPos = pos+remLength;
			if (endPos > input.length) {
				return [null,startingPos];
			}

			var wireMessage = new WireMessage(type);
			switch(type) {
			case MESSAGE_TYPE.CONNACK:
				var connectAcknowledgeFlags = input[pos++];
				if (connectAcknowledgeFlags & 0x01)
					wireMessage.sessionPresent = true;
				wireMessage.returnCode = input[pos++];
				break;

			case MESSAGE_TYPE.PUBLISH:
				var qos = (messageInfo >> 1) & 0x03;

				var len = readUint16(input, pos);
				pos += 2;
				var topicName = parseUTF8(input, pos, len);
				pos += len;
				// If QoS 1 or 2 there will be a messageIdentifier
				if (qos > 0) {
					wireMessage.messageIdentifier = readUint16(input, pos);
					pos += 2;
				}

				var message = new Message(input.subarray(pos, endPos));
				if ((messageInfo & 0x01) == 0x01)
					message.retained = true;
				if ((messageInfo & 0x08) == 0x08)
					message.duplicate =  true;
				message.qos = qos;
				message.destinationName = topicName;
				wireMessage.payloadMessage = message;
				break;

			case  MESSAGE_TYPE.PUBACK:
			case  MESSAGE_TYPE.PUBREC:
			case  MESSAGE_TYPE.PUBREL:
			case  MESSAGE_TYPE.PUBCOMP:
			case  MESSAGE_TYPE.UNSUBACK:
				wireMessage.messageIdentifier = readUint16(input, pos);
				break;

			case  MESSAGE_TYPE.SUBACK:
				wireMessage.messageIdentifier = readUint16(input, pos);
				pos += 2;
				wireMessage.returnCode = input.subarray(pos, endPos);
				break;

			default:
				break;
			}

			return [wireMessage,endPos];
		}

		function writeUint16(input, buffer, offset) {
			buffer[offset++] = input >> 8;      //MSB
			buffer[offset++] = input % 256;     //LSB
			return offset;
		}

		function writeString(input, utf8Length, buffer, offset) {
			offset = writeUint16(utf8Length, buffer, offset);
			stringToUTF8(input, buffer, offset);
			return offset + utf8Length;
		}

		function readUint16(buffer, offset) {
			return 256*buffer[offset] + buffer[offset+1];
		}

		/**
	 * Encodes an MQTT Multi-Byte Integer
	 * @private
	 */
		function encodeMBI(number) {
			var output = new Array(1);
			var numBytes = 0;

			do {
				var digit = number % 128;
				number = number >> 7;
				if (number > 0) {
					digit |= 0x80;
				}
				output[numBytes++] = digit;
			} while ( (number > 0) && (numBytes<4) );

			return output;
		}

		/**
	 * Takes a String and calculates its length in bytes when encoded in UTF8.
	 * @private
	 */
		function UTF8Length(input) {
			var output = 0;
			for (var i = 0; i<input.length; i++)
			{
				var charCode = input.charCodeAt(i);
				if (charCode > 0x7FF)
				{
					// Surrogate pair means its a 4 byte character
					if (0xD800 <= charCode && charCode <= 0xDBFF)
					{
						i++;
						output++;
					}
					output +=3;
				}
				else if (charCode > 0x7F)
					output +=2;
				else
					output++;
			}
			return output;
		}

		/**
	 * Takes a String and writes it into an array as UTF8 encoded bytes.
	 * @private
	 */
		function stringToUTF8(input, output, start) {
			var pos = start;
			for (var i = 0; i<input.length; i++) {
				var charCode = input.charCodeAt(i);

				// Check for a surrogate pair.
				if (0xD800 <= charCode && charCode <= 0xDBFF) {
					var lowCharCode = input.charCodeAt(++i);
					if (isNaN(lowCharCode)) {
						throw new Error(format(ERROR.MALFORMED_UNICODE, [charCode, lowCharCode]));
					}
					charCode = ((charCode - 0xD800)<<10) + (lowCharCode - 0xDC00) + 0x10000;

				}

				if (charCode <= 0x7F) {
					output[pos++] = charCode;
				} else if (charCode <= 0x7FF) {
					output[pos++] = charCode>>6  & 0x1F | 0xC0;
					output[pos++] = charCode     & 0x3F | 0x80;
				} else if (charCode <= 0xFFFF) {
					output[pos++] = charCode>>12 & 0x0F | 0xE0;
					output[pos++] = charCode>>6  & 0x3F | 0x80;
					output[pos++] = charCode     & 0x3F | 0x80;
				} else {
					output[pos++] = charCode>>18 & 0x07 | 0xF0;
					output[pos++] = charCode>>12 & 0x3F | 0x80;
					output[pos++] = charCode>>6  & 0x3F | 0x80;
					output[pos++] = charCode     & 0x3F | 0x80;
				}
			}
			return output;
		}

		function parseUTF8(input, offset, length) {
			var output = "";
			var utf16;
			var pos = offset;

			while (pos < offset+length)
			{
				var byte1 = input[pos++];
				if (byte1 < 128)
					utf16 = byte1;
				else
				{
					var byte2 = input[pos++]-128;
					if (byte2 < 0)
						throw new Error(format(ERROR.MALFORMED_UTF, [byte1.toString(16), byte2.toString(16),""]));
					if (byte1 < 0xE0)             // 2 byte character
						utf16 = 64*(byte1-0xC0) + byte2;
					else
					{
						var byte3 = input[pos++]-128;
						if (byte3 < 0)
							throw new Error(format(ERROR.MALFORMED_UTF, [byte1.toString(16), byte2.toString(16), byte3.toString(16)]));
						if (byte1 < 0xF0)        // 3 byte character
							utf16 = 4096*(byte1-0xE0) + 64*byte2 + byte3;
						else
						{
							var byte4 = input[pos++]-128;
							if (byte4 < 0)
								throw new Error(format(ERROR.MALFORMED_UTF, [byte1.toString(16), byte2.toString(16), byte3.toString(16), byte4.toString(16)]));
							if (byte1 < 0xF8)        // 4 byte character
								utf16 = 262144*(byte1-0xF0) + 4096*byte2 + 64*byte3 + byte4;
							else                     // longer encodings are not supported
								throw new Error(format(ERROR.MALFORMED_UTF, [byte1.toString(16), byte2.toString(16), byte3.toString(16), byte4.toString(16)]));
						}
					}
				}

				if (utf16 > 0xFFFF)   // 4 byte character - express as a surrogate pair
				{
					utf16 -= 0x10000;
					output += String.fromCharCode(0xD800 + (utf16 >> 10)); // lead character
					utf16 = 0xDC00 + (utf16 & 0x3FF);  // trail character
				}
				output += String.fromCharCode(utf16);
			}
			return output;
		}

		/**
	 * Repeat keepalive requests, monitor responses.
	 * @ignore
	 */
		var Pinger = function(client, keepAliveInterval) {
			this._client = client;
			this._keepAliveInterval = keepAliveInterval*1000;
			this.isReset = false;

			var pingReq = new WireMessage(MESSAGE_TYPE.PINGREQ).encode();

			var doTimeout = function (pinger) {
				return function () {
					return doPing.apply(pinger);
				};
			};

			/** @ignore */
			var doPing = function() {
				if (!this.isReset) {
					this._client._trace("Pinger.doPing", "Timed out");
					this._client._disconnected( ERROR.PING_TIMEOUT.code , format(ERROR.PING_TIMEOUT));
				} else {
					this.isReset = false;
					this._client._trace("Pinger.doPing", "send PINGREQ");
					this._client.socket.send(pingReq);
					this.timeout = setTimeout(doTimeout(this), this._keepAliveInterval);
				}
			};

			this.reset = function() {
				this.isReset = true;
				clearTimeout(this.timeout);
				if (this._keepAliveInterval > 0)
					this.timeout = setTimeout(doTimeout(this), this._keepAliveInterval);
			};

			this.cancel = function() {
				clearTimeout(this.timeout);
			};
		};

		/**
	 * Monitor request completion.
	 * @ignore
	 */
		var Timeout = function(client, timeoutSeconds, action, args) {
			if (!timeoutSeconds)
				timeoutSeconds = 30;

			var doTimeout = function (action, client, args) {
				return function () {
					return action.apply(client, args);
				};
			};
			this.timeout = setTimeout(doTimeout(action, client, args), timeoutSeconds * 1000);

			this.cancel = function() {
				clearTimeout(this.timeout);
			};
		};

	/**
	 * Internal implementation of the Websockets MQTT V3.1 client.
	 *
	 * @name Paho.ClientImpl @constructor
	 * @param {String} host the DNS nameof the webSocket host.
	 * @param {Number} port the port number for that host.
	 * @param {String} clientId the MQ client identifier.
	 */
		var ClientImpl = function (uri, host, port, path, clientId) {
		// Check dependencies are satisfied in this browser.
			if (!("WebSocket" in global && global.WebSocket !== null)) {
				throw new Error(format(ERROR.UNSUPPORTED, ["WebSocket"]));
			}
			if (!("ArrayBuffer" in global && global.ArrayBuffer !== null)) {
				throw new Error(format(ERROR.UNSUPPORTED, ["ArrayBuffer"]));
			}
			this._trace("Paho.Client", uri, host, port, path, clientId);

			this.host = host;
			this.port = port;
			this.path = path;
			this.uri = uri;
			this.clientId = clientId;
			this._wsuri = null;

			// Local storagekeys are qualified with the following string.
			// The conditional inclusion of path in the key is for backward
			// compatibility to when the path was not configurable and assumed to
			// be /mqtt
			this._localKey=host+":"+port+(path!="/mqtt"?":"+path:"")+":"+clientId+":";

			// Create private instance-only message queue
			// Internal queue of messages to be sent, in sending order.
			this._msg_queue = [];
			this._buffered_msg_queue = [];

			// Messages we have sent and are expecting a response for, indexed by their respective message ids.
			this._sentMessages = {};

			// Messages we have received and acknowleged and are expecting a confirm message for
			// indexed by their respective message ids.
			this._receivedMessages = {};

			// Internal list of callbacks to be executed when messages
			// have been successfully sent over web socket, e.g. disconnect
			// when it doesn't have to wait for ACK, just message is dispatched.
			this._notify_msg_sent = {};

			// Unique identifier for SEND messages, incrementing
			// counter as messages are sent.
			this._message_identifier = 1;

			// Used to determine the transmission sequence of stored sent messages.
			this._sequence = 0;


			// Load the local state, if any, from the saved version, only restore state relevant to this client.
			for (var key in localStorage)
				if (   key.indexOf("Sent:"+this._localKey) === 0 || key.indexOf("Received:"+this._localKey) === 0)
					this.restore(key);
		};

		// Messaging Client public instance members.
		ClientImpl.prototype.host = null;
		ClientImpl.prototype.port = null;
		ClientImpl.prototype.path = null;
		ClientImpl.prototype.uri = null;
		ClientImpl.prototype.clientId = null;

		// Messaging Client private instance members.
		ClientImpl.prototype.socket = null;
		/* true once we have received an acknowledgement to a CONNECT packet. */
		ClientImpl.prototype.connected = false;
		/* The largest message identifier allowed, may not be larger than 2**16 but
		 * if set smaller reduces the maximum number of outbound messages allowed.
		 */
		ClientImpl.prototype.maxMessageIdentifier = 65536;
		ClientImpl.prototype.connectOptions = null;
		ClientImpl.prototype.hostIndex = null;
		ClientImpl.prototype.onConnected = null;
		ClientImpl.prototype.onConnectionLost = null;
		ClientImpl.prototype.onMessageDelivered = null;
		ClientImpl.prototype.onMessageArrived = null;
		ClientImpl.prototype.traceFunction = null;
		ClientImpl.prototype._msg_queue = null;
		ClientImpl.prototype._buffered_msg_queue = null;
		ClientImpl.prototype._connectTimeout = null;
		/* The sendPinger monitors how long we allow before we send data to prove to the server that we are alive. */
		ClientImpl.prototype.sendPinger = null;
		/* The receivePinger monitors how long we allow before we require evidence that the server is alive. */
		ClientImpl.prototype.receivePinger = null;
		ClientImpl.prototype._reconnectInterval = 1; // Reconnect Delay, starts at 1 second
		ClientImpl.prototype._reconnecting = false;
		ClientImpl.prototype._reconnectTimeout = null;
		ClientImpl.prototype.disconnectedPublishing = false;
		ClientImpl.prototype.disconnectedBufferSize = 5000;

		ClientImpl.prototype.receiveBuffer = null;

		ClientImpl.prototype._traceBuffer = null;
		ClientImpl.prototype._MAX_TRACE_ENTRIES = 100;

		ClientImpl.prototype.connect = function (connectOptions) {
			var connectOptionsMasked = this._traceMask(connectOptions, "password");
			this._trace("Client.connect", connectOptionsMasked, this.socket, this.connected);

			if (this.connected)
				throw new Error(format(ERROR.INVALID_STATE, ["already connected"]));
			if (this.socket)
				throw new Error(format(ERROR.INVALID_STATE, ["already connected"]));

			if (this._reconnecting) {
			// connect() function is called while reconnect is in progress.
			// Terminate the auto reconnect process to use new connect options.
				this._reconnectTimeout.cancel();
				this._reconnectTimeout = null;
				this._reconnecting = false;
			}

			this.connectOptions = connectOptions;
			this._reconnectInterval = 1;
			this._reconnecting = false;
			if (connectOptions.uris) {
				this.hostIndex = 0;
				this._doConnect(connectOptions.uris[0]);
			} else {
				this._doConnect(this.uri);
			}

		};

		ClientImpl.prototype.subscribe = function (filter, subscribeOptions) {
			this._trace("Client.subscribe", filter, subscribeOptions);

			if (!this.connected)
				throw new Error(format(ERROR.INVALID_STATE, ["not connected"]));

            var wireMessage = new WireMessage(MESSAGE_TYPE.SUBSCRIBE);
            wireMessage.topics = filter.constructor === Array ? filter : [filter];
            if (subscribeOptions.qos === undefined)
                subscribeOptions.qos = 0;
            wireMessage.requestedQos = [];
            for (var i = 0; i < wireMessage.topics.length; i++)
                wireMessage.requestedQos[i] = subscribeOptions.qos;

			if (subscribeOptions.onSuccess) {
				wireMessage.onSuccess = function(grantedQos) {subscribeOptions.onSuccess({invocationContext:subscribeOptions.invocationContext,grantedQos:grantedQos});};
			}

			if (subscribeOptions.onFailure) {
				wireMessage.onFailure = function(errorCode) {subscribeOptions.onFailure({invocationContext:subscribeOptions.invocationContext,errorCode:errorCode, errorMessage:format(errorCode)});};
			}

			if (subscribeOptions.timeout) {
				wireMessage.timeOut = new Timeout(this, subscribeOptions.timeout, subscribeOptions.onFailure,
					[{invocationContext:subscribeOptions.invocationContext,
						errorCode:ERROR.SUBSCRIBE_TIMEOUT.code,
						errorMessage:format(ERROR.SUBSCRIBE_TIMEOUT)}]);
			}

			// All subscriptions return a SUBACK.
			this._requires_ack(wireMessage);
			this._schedule_message(wireMessage);
		};

		/** @ignore */
		ClientImpl.prototype.unsubscribe = function(filter, unsubscribeOptions) {
			this._trace("Client.unsubscribe", filter, unsubscribeOptions);

			if (!this.connected)
				throw new Error(format(ERROR.INVALID_STATE, ["not connected"]));

            var wireMessage = new WireMessage(MESSAGE_TYPE.UNSUBSCRIBE);
            wireMessage.topics = filter.constructor === Array ? filter : [filter];

			if (unsubscribeOptions.onSuccess) {
				wireMessage.callback = function() {unsubscribeOptions.onSuccess({invocationContext:unsubscribeOptions.invocationContext});};
			}
			if (unsubscribeOptions.timeout) {
				wireMessage.timeOut = new Timeout(this, unsubscribeOptions.timeout, unsubscribeOptions.onFailure,
					[{invocationContext:unsubscribeOptions.invocationContext,
						errorCode:ERROR.UNSUBSCRIBE_TIMEOUT.code,
						errorMessage:format(ERROR.UNSUBSCRIBE_TIMEOUT)}]);
			}

			// All unsubscribes return a SUBACK.
			this._requires_ack(wireMessage);
			this._schedule_message(wireMessage);
		};

		ClientImpl.prototype.send = function (message) {
			this._trace("Client.send", message);

			var wireMessage = new WireMessage(MESSAGE_TYPE.PUBLISH);
			wireMessage.payloadMessage = message;

			if (this.connected) {
			// Mark qos 1 & 2 message as "ACK required"
			// For qos 0 message, invoke onMessageDelivered callback if there is one.
			// Then schedule the message.
				if (message.qos > 0) {
					this._requires_ack(wireMessage);
				} else if (this.onMessageDelivered) {
					this._notify_msg_sent[wireMessage] = this.onMessageDelivered(wireMessage.payloadMessage);
				}
				this._schedule_message(wireMessage);
			} else {
			// Currently disconnected, will not schedule this message
			// Check if reconnecting is in progress and disconnected publish is enabled.
				if (this._reconnecting && this.disconnectedPublishing) {
				// Check the limit which include the "required ACK" messages
					var messageCount = Object.keys(this._sentMessages).length + this._buffered_msg_queue.length;
					if (messageCount > this.disconnectedBufferSize) {
						throw new Error(format(ERROR.BUFFER_FULL, [this.disconnectedBufferSize]));
					} else {
						if (message.qos > 0) {
						// Mark this message as "ACK required"
							this._requires_ack(wireMessage);
						} else {
							wireMessage.sequence = ++this._sequence;
							// Add messages in fifo order to array, by adding to start
							this._buffered_msg_queue.unshift(wireMessage);
						}
					}
				} else {
					throw new Error(format(ERROR.INVALID_STATE, ["not connected"]));
				}
			}
		};

		ClientImpl.prototype.disconnect = function () {
			this._trace("Client.disconnect");

			if (this._reconnecting) {
			// disconnect() function is called while reconnect is in progress.
			// Terminate the auto reconnect process.
				this._reconnectTimeout.cancel();
				this._reconnectTimeout = null;
				this._reconnecting = false;
			}

			if (!this.socket)
				throw new Error(format(ERROR.INVALID_STATE, ["not connecting or connected"]));

			var wireMessage = new WireMessage(MESSAGE_TYPE.DISCONNECT);

			// Run the disconnected call back as soon as the message has been sent,
			// in case of a failure later on in the disconnect processing.
			// as a consequence, the _disconected call back may be run several times.
			this._notify_msg_sent[wireMessage] = scope(this._disconnected, this);

			this._schedule_message(wireMessage);
		};

		ClientImpl.prototype.getTraceLog = function () {
			if ( this._traceBuffer !== null ) {
				this._trace("Client.getTraceLog", new Date());
				this._trace("Client.getTraceLog in flight messages", this._sentMessages.length);
				for (var key in this._sentMessages)
					this._trace("_sentMessages ",key, this._sentMessages[key]);
				for (var key in this._receivedMessages)
					this._trace("_receivedMessages ",key, this._receivedMessages[key]);

				return this._traceBuffer;
			}
		};

		ClientImpl.prototype.startTrace = function () {
			if ( this._traceBuffer === null ) {
				this._traceBuffer = [];
			}
			this._trace("Client.startTrace", new Date(), version);
		};

		ClientImpl.prototype.stopTrace = function () {
			delete this._traceBuffer;
		};

		ClientImpl.prototype._doConnect = function (wsurl) {
		// When the socket is open, this client will send the CONNECT WireMessage using the saved parameters.
			if (this.connectOptions.useSSL) {
				var uriParts = wsurl.split(":");
				uriParts[0] = "wss";
				wsurl = uriParts.join(":");
			}
			this._wsuri = wsurl;
			this.connected = false;



			if (this.connectOptions.mqttVersion < 4) {
				this.socket = new WebSocket(wsurl, ["mqttv3.1"]);
			} else {
				this.socket = new WebSocket(wsurl, ["mqtt"]);
			}
			this.socket.binaryType = "arraybuffer";
			this.socket.onopen = scope(this._on_socket_open, this);
			this.socket.onmessage = scope(this._on_socket_message, this);
			this.socket.onerror = scope(this._on_socket_error, this);
			this.socket.onclose = scope(this._on_socket_close, this);

			this.sendPinger = new Pinger(this, this.connectOptions.keepAliveInterval);
			this.receivePinger = new Pinger(this, this.connectOptions.keepAliveInterval);
			if (this._connectTimeout) {
				this._connectTimeout.cancel();
				this._connectTimeout = null;
			}
			this._connectTimeout = new Timeout(this, this.connectOptions.timeout, this._disconnected,  [ERROR.CONNECT_TIMEOUT.code, format(ERROR.CONNECT_TIMEOUT)]);
		};


		// Schedule a new message to be sent over the WebSockets
		// connection. CONNECT messages cause WebSocket connection
		// to be started. All other messages are queued internally
		// until this has happened. When WS connection starts, process
		// all outstanding messages.
		ClientImpl.prototype._schedule_message = function (message) {
			// Add messages in fifo order to array, by adding to start
			this._msg_queue.unshift(message);
			// Process outstanding messages in the queue if we have an  open socket, and have received CONNACK.
			if (this.connected) {
				this._process_queue();
			}
		};

		ClientImpl.prototype.store = function(prefix, wireMessage) {
			var storedMessage = {type:wireMessage.type, messageIdentifier:wireMessage.messageIdentifier, version:1};

			switch(wireMessage.type) {
			case MESSAGE_TYPE.PUBLISH:
				if(wireMessage.pubRecReceived)
					storedMessage.pubRecReceived = true;

				// Convert the payload to a hex string.
				storedMessage.payloadMessage = {};
				var hex = "";
				var messageBytes = wireMessage.payloadMessage.payloadBytes;
				for (var i=0; i<messageBytes.length; i++) {
					if (messageBytes[i] <= 0xF)
						hex = hex+"0"+messageBytes[i].toString(16);
					else
						hex = hex+messageBytes[i].toString(16);
				}
				storedMessage.payloadMessage.payloadHex = hex;

				storedMessage.payloadMessage.qos = wireMessage.payloadMessage.qos;
				storedMessage.payloadMessage.destinationName = wireMessage.payloadMessage.destinationName;
				if (wireMessage.payloadMessage.duplicate)
					storedMessage.payloadMessage.duplicate = true;
				if (wireMessage.payloadMessage.retained)
					storedMessage.payloadMessage.retained = true;

				// Add a sequence number to sent messages.
				if ( prefix.indexOf("Sent:") === 0 ) {
					if ( wireMessage.sequence === undefined )
						wireMessage.sequence = ++this._sequence;
					storedMessage.sequence = wireMessage.sequence;
				}
				break;

			default:
				throw Error(format(ERROR.INVALID_STORED_DATA, [prefix+this._localKey+wireMessage.messageIdentifier, storedMessage]));
			}
			localStorage.setItem(prefix+this._localKey+wireMessage.messageIdentifier, JSON.stringify(storedMessage));
		};

		ClientImpl.prototype.restore = function(key) {
			var value = localStorage.getItem(key);
			var storedMessage = JSON.parse(value);

			var wireMessage = new WireMessage(storedMessage.type, storedMessage);

			switch(storedMessage.type) {
			case MESSAGE_TYPE.PUBLISH:
				// Replace the payload message with a Message object.
				var hex = storedMessage.payloadMessage.payloadHex;
				var buffer = new ArrayBuffer((hex.length)/2);
				var byteStream = new Uint8Array(buffer);
				var i = 0;
				while (hex.length >= 2) {
					var x = parseInt(hex.substring(0, 2), 16);
					hex = hex.substring(2, hex.length);
					byteStream[i++] = x;
				}
				var payloadMessage = new Message(byteStream);

				payloadMessage.qos = storedMessage.payloadMessage.qos;
				payloadMessage.destinationName = storedMessage.payloadMessage.destinationName;
				if (storedMessage.payloadMessage.duplicate)
					payloadMessage.duplicate = true;
				if (storedMessage.payloadMessage.retained)
					payloadMessage.retained = true;
				wireMessage.payloadMessage = payloadMessage;

				break;

			default:
				throw Error(format(ERROR.INVALID_STORED_DATA, [key, value]));
			}

			if (key.indexOf("Sent:"+this._localKey) === 0) {
				wireMessage.payloadMessage.duplicate = true;
				this._sentMessages[wireMessage.messageIdentifier] = wireMessage;
			} else if (key.indexOf("Received:"+this._localKey) === 0) {
				this._receivedMessages[wireMessage.messageIdentifier] = wireMessage;
			}
		};

		ClientImpl.prototype._process_queue = function () {
			var message = null;

			// Send all queued messages down socket connection
			while ((message = this._msg_queue.pop())) {
				this._socket_send(message);
				// Notify listeners that message was successfully sent
				if (this._notify_msg_sent[message]) {
					this._notify_msg_sent[message]();
					delete this._notify_msg_sent[message];
				}
			}
		};

		/**
	 * Expect an ACK response for this message. Add message to the set of in progress
	 * messages and set an unused identifier in this message.
	 * @ignore
	 */
		ClientImpl.prototype._requires_ack = function (wireMessage) {
			var messageCount = Object.keys(this._sentMessages).length;
			if (messageCount > this.maxMessageIdentifier)
				throw Error ("Too many messages:"+messageCount);

			while(this._sentMessages[this._message_identifier] !== undefined) {
				this._message_identifier++;
			}
			wireMessage.messageIdentifier = this._message_identifier;
			this._sentMessages[wireMessage.messageIdentifier] = wireMessage;
			if (wireMessage.type === MESSAGE_TYPE.PUBLISH) {
				this.store("Sent:", wireMessage);
			}
			if (this._message_identifier === this.maxMessageIdentifier) {
				this._message_identifier = 1;
			}
		};

		/**
	 * Called when the underlying websocket has been opened.
	 * @ignore
	 */
		ClientImpl.prototype._on_socket_open = function () {
		// Create the CONNECT message object.
			var wireMessage = new WireMessage(MESSAGE_TYPE.CONNECT, this.connectOptions);
			wireMessage.clientId = this.clientId;
			this._socket_send(wireMessage);
		};

		/**
	 * Called when the underlying websocket has received a complete packet.
	 * @ignore
	 */
		ClientImpl.prototype._on_socket_message = function (event) {
			this._trace("Client._on_socket_message", event.data);
			var messages = this._deframeMessages(event.data);
			for (var i = 0; i < messages.length; i+=1) {
				this._handleMessage(messages[i]);
			}
		};

		ClientImpl.prototype._deframeMessages = function(data) {
			var byteArray = new Uint8Array(data);
			var messages = [];
			if (this.receiveBuffer) {
				var newData = new Uint8Array(this.receiveBuffer.length+byteArray.length);
				newData.set(this.receiveBuffer);
				newData.set(byteArray,this.receiveBuffer.length);
				byteArray = newData;
				delete this.receiveBuffer;
			}
			try {
				var offset = 0;
				while(offset < byteArray.length) {
					var result = decodeMessage(byteArray,offset);
					var wireMessage = result[0];
					offset = result[1];
					if (wireMessage !== null) {
						messages.push(wireMessage);
					} else {
						break;
					}
				}
				if (offset < byteArray.length) {
					this.receiveBuffer = byteArray.subarray(offset);
				}
			} catch (error) {
				var errorStack = ((error.hasOwnProperty("stack") == "undefined") ? error.stack.toString() : "No Error Stack Available");
				this._disconnected(ERROR.INTERNAL_ERROR.code , format(ERROR.INTERNAL_ERROR, [error.message,errorStack]));
				return;
			}
			return messages;
		};

		ClientImpl.prototype._handleMessage = function(wireMessage) {

			this._trace("Client._handleMessage", wireMessage);

			try {
				switch(wireMessage.type) {
				case MESSAGE_TYPE.CONNACK:
					this._connectTimeout.cancel();
					if (this._reconnectTimeout)
						this._reconnectTimeout.cancel();

					// If we have started using clean session then clear up the local state.
					if (this.connectOptions.cleanSession) {
						for (var key in this._sentMessages) {
							var sentMessage = this._sentMessages[key];
							localStorage.removeItem("Sent:"+this._localKey+sentMessage.messageIdentifier);
						}
						this._sentMessages = {};

						for (var key in this._receivedMessages) {
							var receivedMessage = this._receivedMessages[key];
							localStorage.removeItem("Received:"+this._localKey+receivedMessage.messageIdentifier);
						}
						this._receivedMessages = {};
					}
					// Client connected and ready for business.
					if (wireMessage.returnCode === 0) {

						this.connected = true;
						// Jump to the end of the list of uris and stop looking for a good host.

						if (this.connectOptions.uris)
							this.hostIndex = this.connectOptions.uris.length;

					} else {
						this._disconnected(ERROR.CONNACK_RETURNCODE.code , format(ERROR.CONNACK_RETURNCODE, [wireMessage.returnCode, CONNACK_RC[wireMessage.returnCode]]));
						break;
					}

					// Resend messages.
					var sequencedMessages = [];
					for (var msgId in this._sentMessages) {
						if (this._sentMessages.hasOwnProperty(msgId))
							sequencedMessages.push(this._sentMessages[msgId]);
					}

					// Also schedule qos 0 buffered messages if any
					if (this._buffered_msg_queue.length > 0) {
						var msg = null;
						while ((msg = this._buffered_msg_queue.pop())) {
							sequencedMessages.push(msg);
							if (this.onMessageDelivered)
								this._notify_msg_sent[msg] = this.onMessageDelivered(msg.payloadMessage);
						}
					}

					// Sort sentMessages into the original sent order.
					var sequencedMessages = sequencedMessages.sort(function(a,b) {return a.sequence - b.sequence;} );
					for (var i=0, len=sequencedMessages.length; i<len; i++) {
						var sentMessage = sequencedMessages[i];
						if (sentMessage.type == MESSAGE_TYPE.PUBLISH && sentMessage.pubRecReceived) {
							var pubRelMessage = new WireMessage(MESSAGE_TYPE.PUBREL, {messageIdentifier:sentMessage.messageIdentifier});
							this._schedule_message(pubRelMessage);
						} else {
							this._schedule_message(sentMessage);
						}
					}

					// Execute the connectOptions.onSuccess callback if there is one.
					// Will also now return if this connection was the result of an automatic
					// reconnect and which URI was successfully connected to.
					if (this.connectOptions.onSuccess) {
						this.connectOptions.onSuccess({invocationContext:this.connectOptions.invocationContext});
					}

					var reconnected = false;
					if (this._reconnecting) {
						reconnected = true;
						this._reconnectInterval = 1;
						this._reconnecting = false;
					}

					// Execute the onConnected callback if there is one.
					this._connected(reconnected, this._wsuri);

					// Process all queued messages now that the connection is established.
					this._process_queue();
					break;

				case MESSAGE_TYPE.PUBLISH:
					this._receivePublish(wireMessage);
					break;

				case MESSAGE_TYPE.PUBACK:
					var sentMessage = this._sentMessages[wireMessage.messageIdentifier];
					// If this is a re flow of a PUBACK after we have restarted receivedMessage will not exist.
					if (sentMessage) {
						delete this._sentMessages[wireMessage.messageIdentifier];
						localStorage.removeItem("Sent:"+this._localKey+wireMessage.messageIdentifier);
						if (this.onMessageDelivered)
							this.onMessageDelivered(sentMessage.payloadMessage);
					}
					break;

				case MESSAGE_TYPE.PUBREC:
					var sentMessage = this._sentMessages[wireMessage.messageIdentifier];
					// If this is a re flow of a PUBREC after we have restarted receivedMessage will not exist.
					if (sentMessage) {
						sentMessage.pubRecReceived = true;
						var pubRelMessage = new WireMessage(MESSAGE_TYPE.PUBREL, {messageIdentifier:wireMessage.messageIdentifier});
						this.store("Sent:", sentMessage);
						this._schedule_message(pubRelMessage);
					}
					break;

				case MESSAGE_TYPE.PUBREL:
					var receivedMessage = this._receivedMessages[wireMessage.messageIdentifier];
					localStorage.removeItem("Received:"+this._localKey+wireMessage.messageIdentifier);
					// If this is a re flow of a PUBREL after we have restarted receivedMessage will not exist.
					if (receivedMessage) {
						this._receiveMessage(receivedMessage);
						delete this._receivedMessages[wireMessage.messageIdentifier];
					}
					// Always flow PubComp, we may have previously flowed PubComp but the server lost it and restarted.
					var pubCompMessage = new WireMessage(MESSAGE_TYPE.PUBCOMP, {messageIdentifier:wireMessage.messageIdentifier});
					this._schedule_message(pubCompMessage);


					break;

				case MESSAGE_TYPE.PUBCOMP:
					var sentMessage = this._sentMessages[wireMessage.messageIdentifier];
					delete this._sentMessages[wireMessage.messageIdentifier];
					localStorage.removeItem("Sent:"+this._localKey+wireMessage.messageIdentifier);
					if (this.onMessageDelivered)
						this.onMessageDelivered(sentMessage.payloadMessage);
					break;

				case MESSAGE_TYPE.SUBACK:
					var sentMessage = this._sentMessages[wireMessage.messageIdentifier];
					if (sentMessage) {
						if(sentMessage.timeOut)
							sentMessage.timeOut.cancel();
						// This will need to be fixed when we add multiple topic support
						if (wireMessage.returnCode[0] === 0x80) {
							if (sentMessage.onFailure) {
								sentMessage.onFailure(wireMessage.returnCode);
							}
						} else if (sentMessage.onSuccess) {
							sentMessage.onSuccess(wireMessage.returnCode);
						}
						delete this._sentMessages[wireMessage.messageIdentifier];
					}
					break;

				case MESSAGE_TYPE.UNSUBACK:
					var sentMessage = this._sentMessages[wireMessage.messageIdentifier];
					if (sentMessage) {
						if (sentMessage.timeOut)
							sentMessage.timeOut.cancel();
						if (sentMessage.callback) {
							sentMessage.callback();
						}
						delete this._sentMessages[wireMessage.messageIdentifier];
					}

					break;

				case MESSAGE_TYPE.PINGRESP:
				/* The sendPinger or receivePinger may have sent a ping, the receivePinger has already been reset. */
					this.sendPinger.reset();
					break;

				case MESSAGE_TYPE.DISCONNECT:
				// Clients do not expect to receive disconnect packets.
					this._disconnected(ERROR.INVALID_MQTT_MESSAGE_TYPE.code , format(ERROR.INVALID_MQTT_MESSAGE_TYPE, [wireMessage.type]));
					break;

				default:
					this._disconnected(ERROR.INVALID_MQTT_MESSAGE_TYPE.code , format(ERROR.INVALID_MQTT_MESSAGE_TYPE, [wireMessage.type]));
				}
			} catch (error) {
				var errorStack = ((error.hasOwnProperty("stack") == "undefined") ? error.stack.toString() : "No Error Stack Available");
				this._disconnected(ERROR.INTERNAL_ERROR.code , format(ERROR.INTERNAL_ERROR, [error.message,errorStack]));
				return;
			}
		};

		/** @ignore */
		ClientImpl.prototype._on_socket_error = function (error) {
			if (!this._reconnecting) {
				this._disconnected(ERROR.SOCKET_ERROR.code , format(ERROR.SOCKET_ERROR, [error.data]));
			}
		};

		/** @ignore */
		ClientImpl.prototype._on_socket_close = function () {
			if (!this._reconnecting) {
				this._disconnected(ERROR.SOCKET_CLOSE.code , format(ERROR.SOCKET_CLOSE));
			}
		};

		/** @ignore */
		ClientImpl.prototype._socket_send = function (wireMessage) {

			if (wireMessage.type == 1) {
				var wireMessageMasked = this._traceMask(wireMessage, "password");
				this._trace("Client._socket_send", wireMessageMasked);
			}
			else this._trace("Client._socket_send", wireMessage);

			this.socket.send(wireMessage.encode());
			/* We have proved to the server we are alive. */
			this.sendPinger.reset();
		};

		/** @ignore */
		ClientImpl.prototype._receivePublish = function (wireMessage) {
			switch(wireMessage.payloadMessage.qos) {
			case "undefined":
			case 0:
				this._receiveMessage(wireMessage);
				break;

			case 1:
				var pubAckMessage = new WireMessage(MESSAGE_TYPE.PUBACK, {messageIdentifier:wireMessage.messageIdentifier});
				this._schedule_message(pubAckMessage);
				this._receiveMessage(wireMessage);
				break;

			case 2:
				this._receivedMessages[wireMessage.messageIdentifier] = wireMessage;
				this.store("Received:", wireMessage);
				var pubRecMessage = new WireMessage(MESSAGE_TYPE.PUBREC, {messageIdentifier:wireMessage.messageIdentifier});
				this._schedule_message(pubRecMessage);

				break;

			default:
				throw Error("Invaild qos=" + wireMessage.payloadMessage.qos);
			}
		};

		/** @ignore */
		ClientImpl.prototype._receiveMessage = function (wireMessage) {
			if (this.onMessageArrived) {
				this.onMessageArrived(wireMessage.payloadMessage);
			}
		};

		/**
	 * Client has connected.
	 * @param {reconnect} [boolean] indicate if this was a result of reconnect operation.
	 * @param {uri} [string] fully qualified WebSocket URI of the server.
	 */
		ClientImpl.prototype._connected = function (reconnect, uri) {
		// Execute the onConnected callback if there is one.
			if (this.onConnected)
				this.onConnected(reconnect, uri);
		};

		/**
	 * Attempts to reconnect the client to the server.
   * For each reconnect attempt, will double the reconnect interval
   * up to 128 seconds.
	 */
		ClientImpl.prototype._reconnect = function () {
			this._trace("Client._reconnect");
			if (!this.connected) {
				this._reconnecting = true;
				this.sendPinger.cancel();
				this.receivePinger.cancel();
				if (this._reconnectInterval < 128)
					this._reconnectInterval = this._reconnectInterval * 2;
				if (this.connectOptions.uris) {
					this.hostIndex = 0;
					this._doConnect(this.connectOptions.uris[0]);
				} else {
					this._doConnect(this.uri);
				}
			}
		};

		/**
	 * Client has disconnected either at its own request or because the server
	 * or network disconnected it. Remove all non-durable state.
	 * @param {errorCode} [number] the error number.
	 * @param {errorText} [string] the error text.
	 * @ignore
	 */
		ClientImpl.prototype._disconnected = function (errorCode, errorText) {
			this._trace("Client._disconnected", errorCode, errorText);

			if (errorCode !== undefined && this._reconnecting) {
				//Continue automatic reconnect process
				this._reconnectTimeout = new Timeout(this, this._reconnectInterval, this._reconnect);
				return;
			}

			this.sendPinger.cancel();
			this.receivePinger.cancel();
			if (this._connectTimeout) {
				this._connectTimeout.cancel();
				this._connectTimeout = null;
			}

			// Clear message buffers.
			this._msg_queue = [];
			this._buffered_msg_queue = [];
			this._notify_msg_sent = {};

			if (this.socket) {
			// Cancel all socket callbacks so that they cannot be driven again by this socket.
				this.socket.onopen = null;
				this.socket.onmessage = null;
				this.socket.onerror = null;
				this.socket.onclose = null;
				if (this.socket.readyState === 1)
					this.socket.close();
				delete this.socket;
			}

			if (this.connectOptions.uris && this.hostIndex < this.connectOptions.uris.length-1) {
			// Try the next host.
				this.hostIndex++;
				this._doConnect(this.connectOptions.uris[this.hostIndex]);
			} else {

				if (errorCode === undefined) {
					errorCode = ERROR.OK.code;
					errorText = format(ERROR.OK);
				}

				// Run any application callbacks last as they may attempt to reconnect and hence create a new socket.
				if (this.connected) {
					this.connected = false;
					// Execute the connectionLostCallback if there is one, and we were connected.
					if (this.onConnectionLost) {
						this.onConnectionLost({errorCode:errorCode, errorMessage:errorText, reconnect:this.connectOptions.reconnect, uri:this._wsuri});
					}
					if (errorCode !== ERROR.OK.code && this.connectOptions.reconnect) {
					// Start automatic reconnect process for the very first time since last successful connect.
						this._reconnectInterval = 1;
						this._reconnect();
						return;
					}
				} else {
				// Otherwise we never had a connection, so indicate that the connect has failed.
					if (this.connectOptions.mqttVersion === 4 && this.connectOptions.mqttVersionExplicit === false) {
						this._trace("Failed to connect V4, dropping back to V3");
						this.connectOptions.mqttVersion = 3;
						if (this.connectOptions.uris) {
							this.hostIndex = 0;
							this._doConnect(this.connectOptions.uris[0]);
						} else {
							this._doConnect(this.uri);
						}
					} else if(this.connectOptions.onFailure) {
						this.connectOptions.onFailure({invocationContext:this.connectOptions.invocationContext, errorCode:errorCode, errorMessage:errorText});
					}
				}
			}
		};

		/** @ignore */
		ClientImpl.prototype._trace = function () {
		// Pass trace message back to client's callback function
			if (this.traceFunction) {
				var args = Array.prototype.slice.call(arguments);
				for (var i in args)
				{
					if (typeof args[i] !== "undefined")
						args.splice(i, 1, JSON.stringify(args[i]));
				}
				var record = args.join("");
				this.traceFunction ({severity: "Debug", message: record	});
			}

			//buffer style trace
			if ( this._traceBuffer !== null ) {
				for (var i = 0, max = arguments.length; i < max; i++) {
					if ( this._traceBuffer.length == this._MAX_TRACE_ENTRIES ) {
						this._traceBuffer.shift();
					}
					if (i === 0) this._traceBuffer.push(arguments[i]);
					else if (typeof arguments[i] === "undefined" ) this._traceBuffer.push(arguments[i]);
					else this._traceBuffer.push("  "+JSON.stringify(arguments[i]));
				}
			}
		};

		/** @ignore */
		ClientImpl.prototype._traceMask = function (traceObject, masked) {
			var traceObjectMasked = {};
			for (var attr in traceObject) {
				if (traceObject.hasOwnProperty(attr)) {
					if (attr == masked)
						traceObjectMasked[attr] = "******";
					else
						traceObjectMasked[attr] = traceObject[attr];
				}
			}
			return traceObjectMasked;
		};

		// ------------------------------------------------------------------------
		// Public Programming interface.
		// ------------------------------------------------------------------------

		/**
	 * The JavaScript application communicates to the server using a {@link Paho.Client} object.
	 * <p>
	 * Most applications will create just one Client object and then call its connect() method,
	 * however applications can create more than one Client object if they wish.
	 * In this case the combination of host, port and clientId attributes must be different for each Client object.
	 * <p>
	 * The send, subscribe and unsubscribe methods are implemented as asynchronous JavaScript methods
	 * (even though the underlying protocol exchange might be synchronous in nature).
	 * This means they signal their completion by calling back to the application,
	 * via Success or Failure callback functions provided by the application on the method in question.
	 * Such callbacks are called at most once per method invocation and do not persist beyond the lifetime
	 * of the script that made the invocation.
	 * <p>
	 * In contrast there are some callback functions, most notably <i>onMessageArrived</i>,
	 * that are defined on the {@link Paho.Client} object.
	 * These may get called multiple times, and aren't directly related to specific method invocations made by the client.
	 *
	 * @name Paho.Client
	 *
	 * @constructor
	 *
	 * @param {string} host - the address of the messaging server, as a fully qualified WebSocket URI, as a DNS name or dotted decimal IP address.
	 * @param {number} port - the port number to connect to - only required if host is not a URI
	 * @param {string} path - the path on the host to connect to - only used if host is not a URI. Default: '/mqtt'.
	 * @param {string} clientId - the Messaging client identifier, between 1 and 23 characters in length.
	 *
	 * @property {string} host - <i>read only</i> the server's DNS hostname or dotted decimal IP address.
	 * @property {number} port - <i>read only</i> the server's port.
	 * @property {string} path - <i>read only</i> the server's path.
	 * @property {string} clientId - <i>read only</i> used when connecting to the server.
	 * @property {function} onConnectionLost - called when a connection has been lost.
	 *                            after a connect() method has succeeded.
	 *                            Establish the call back used when a connection has been lost. The connection may be
	 *                            lost because the client initiates a disconnect or because the server or network
	 *                            cause the client to be disconnected. The disconnect call back may be called without
	 *                            the connectionComplete call back being invoked if, for example the client fails to
	 *                            connect.
	 *                            A single response object parameter is passed to the onConnectionLost callback containing the following fields:
	 *                            <ol>
	 *                            <li>errorCode
	 *                            <li>errorMessage
	 *                            </ol>
	 * @property {function} onMessageDelivered - called when a message has been delivered.
	 *                            All processing that this Client will ever do has been completed. So, for example,
	 *                            in the case of a Qos=2 message sent by this client, the PubComp flow has been received from the server
	 *                            and the message has been removed from persistent storage before this callback is invoked.
	 *                            Parameters passed to the onMessageDelivered callback are:
	 *                            <ol>
	 *                            <li>{@link Paho.Message} that was delivered.
	 *                            </ol>
	 * @property {function} onMessageArrived - called when a message has arrived in this Paho.client.
	 *                            Parameters passed to the onMessageArrived callback are:
	 *                            <ol>
	 *                            <li>{@link Paho.Message} that has arrived.
	 *                            </ol>
	 * @property {function} onConnected - called when a connection is successfully made to the server.
	 *                                  after a connect() method.
	 *                                  Parameters passed to the onConnected callback are:
	 *                                  <ol>
	 *                                  <li>reconnect (boolean) - If true, the connection was the result of a reconnect.</li>
	 *                                  <li>URI (string) - The URI used to connect to the server.</li>
	 *                                  </ol>
	 * @property {boolean} disconnectedPublishing - if set, will enable disconnected publishing in
	 *                                            in the event that the connection to the server is lost.
	 * @property {number} disconnectedBufferSize - Used to set the maximum number of messages that the disconnected
	 *                                             buffer will hold before rejecting new messages. Default size: 5000 messages
	 * @property {function} trace - called whenever trace is called. TODO
	 */
		var Client = function (host, port, path, clientId) {

			var uri;

			if (typeof host !== "string")
				throw new Error(format(ERROR.INVALID_TYPE, [typeof host, "host"]));

			if (arguments.length == 2) {
			// host: must be full ws:// uri
			// port: clientId
				clientId = port;
				uri = host;
				var match = uri.match(/^(wss?):\/\/((\[(.+)\])|([^\/]+?))(:(\d+))?(\/.*)$/);
				if (match) {
					host = match[4]||match[2];
					port = parseInt(match[7]);
					path = match[8];
				} else {
					throw new Error(format(ERROR.INVALID_ARGUMENT,[host,"host"]));
				}
			} else {
				if (arguments.length == 3) {
					clientId = path;
					path = "/mqtt";
				}
				if (typeof port !== "number" || port < 0)
					throw new Error(format(ERROR.INVALID_TYPE, [typeof port, "port"]));
				if (typeof path !== "string")
					throw new Error(format(ERROR.INVALID_TYPE, [typeof path, "path"]));

				var ipv6AddSBracket = (host.indexOf(":") !== -1 && host.slice(0,1) !== "[" && host.slice(-1) !== "]");
				uri = "ws://"+(ipv6AddSBracket?"["+host+"]":host)+":"+port+path;
			}

			var clientIdLength = 0;
			for (var i = 0; i<clientId.length; i++) {
				var charCode = clientId.charCodeAt(i);
				if (0xD800 <= charCode && charCode <= 0xDBFF)  {
					i++; // Surrogate pair.
				}
				clientIdLength++;
			}
			if (typeof clientId !== "string" || clientIdLength > 65535)
				throw new Error(format(ERROR.INVALID_ARGUMENT, [clientId, "clientId"]));

			var client = new ClientImpl(uri, host, port, path, clientId);

			//Public Properties
			Object.defineProperties(this,{
				"host":{
					get: function() { return host; },
					set: function() { throw new Error(format(ERROR.UNSUPPORTED_OPERATION)); }
				},
				"port":{
					get: function() { return port; },
					set: function() { throw new Error(format(ERROR.UNSUPPORTED_OPERATION)); }
				},
				"path":{
					get: function() { return path; },
					set: function() { throw new Error(format(ERROR.UNSUPPORTED_OPERATION)); }
				},
				"uri":{
					get: function() { return uri; },
					set: function() { throw new Error(format(ERROR.UNSUPPORTED_OPERATION)); }
				},
				"clientId":{
					get: function() { return client.clientId; },
					set: function() { throw new Error(format(ERROR.UNSUPPORTED_OPERATION)); }
				},
				"onConnected":{
					get: function() { return client.onConnected; },
					set: function(newOnConnected) {
						if (typeof newOnConnected === "function")
							client.onConnected = newOnConnected;
						else
							throw new Error(format(ERROR.INVALID_TYPE, [typeof newOnConnected, "onConnected"]));
					}
				},
				"disconnectedPublishing":{
					get: function() { return client.disconnectedPublishing; },
					set: function(newDisconnectedPublishing) {
						client.disconnectedPublishing = newDisconnectedPublishing;
					}
				},
				"disconnectedBufferSize":{
					get: function() { return client.disconnectedBufferSize; },
					set: function(newDisconnectedBufferSize) {
						client.disconnectedBufferSize = newDisconnectedBufferSize;
					}
				},
				"onConnectionLost":{
					get: function() { return client.onConnectionLost; },
					set: function(newOnConnectionLost) {
						if (typeof newOnConnectionLost === "function")
							client.onConnectionLost = newOnConnectionLost;
						else
							throw new Error(format(ERROR.INVALID_TYPE, [typeof newOnConnectionLost, "onConnectionLost"]));
					}
				},
				"onMessageDelivered":{
					get: function() { return client.onMessageDelivered; },
					set: function(newOnMessageDelivered) {
						if (typeof newOnMessageDelivered === "function")
							client.onMessageDelivered = newOnMessageDelivered;
						else
							throw new Error(format(ERROR.INVALID_TYPE, [typeof newOnMessageDelivered, "onMessageDelivered"]));
					}
				},
				"onMessageArrived":{
					get: function() { return client.onMessageArrived; },
					set: function(newOnMessageArrived) {
						if (typeof newOnMessageArrived === "function")
							client.onMessageArrived = newOnMessageArrived;
						else
							throw new Error(format(ERROR.INVALID_TYPE, [typeof newOnMessageArrived, "onMessageArrived"]));
					}
				},
				"trace":{
					get: function() { return client.traceFunction; },
					set: function(trace) {
						if(typeof trace === "function"){
							client.traceFunction = trace;
						}else{
							throw new Error(format(ERROR.INVALID_TYPE, [typeof trace, "onTrace"]));
						}
					}
				},
			});

			/**
		 * Connect this Messaging client to its server.
		 *
		 * @name Paho.Client#connect
		 * @function
		 * @param {object} connectOptions - Attributes used with the connection.
		 * @param {number} connectOptions.timeout - If the connect has not succeeded within this
		 *                    number of seconds, it is deemed to have failed.
		 *                    The default is 30 seconds.
		 * @param {string} connectOptions.userName - Authentication username for this connection.
		 * @param {string} connectOptions.password - Authentication password for this connection.
		 * @param {Paho.Message} connectOptions.willMessage - sent by the server when the client
		 *                    disconnects abnormally.
		 * @param {number} connectOptions.keepAliveInterval - the server disconnects this client if
		 *                    there is no activity for this number of seconds.
		 *                    The default value of 60 seconds is assumed if not set.
		 * @param {boolean} connectOptions.cleanSession - if true(default) the client and server
		 *                    persistent state is deleted on successful connect.
		 * @param {boolean} connectOptions.useSSL - if present and true, use an SSL Websocket connection.
		 * @param {object} connectOptions.invocationContext - passed to the onSuccess callback or onFailure callback.
		 * @param {function} connectOptions.onSuccess - called when the connect acknowledgement
		 *                    has been received from the server.
		 * A single response object parameter is passed to the onSuccess callback containing the following fields:
		 * <ol>
		 * <li>invocationContext as passed in to the onSuccess method in the connectOptions.
		 * </ol>
	 * @param {function} connectOptions.onFailure - called when the connect request has failed or timed out.
		 * A single response object parameter is passed to the onFailure callback containing the following fields:
		 * <ol>
		 * <li>invocationContext as passed in to the onFailure method in the connectOptions.
		 * <li>errorCode a number indicating the nature of the error.
		 * <li>errorMessage text describing the error.
		 * </ol>
	 * @param {array} connectOptions.hosts - If present this contains either a set of hostnames or fully qualified
		 * WebSocket URIs (ws://iot.eclipse.org:80/ws), that are tried in order in place
		 * of the host and port paramater on the construtor. The hosts are tried one at at time in order until
		 * one of then succeeds.
	 * @param {array} connectOptions.ports - If present the set of ports matching the hosts. If hosts contains URIs, this property
		 * is not used.
	 * @param {boolean} connectOptions.reconnect - Sets whether the client will automatically attempt to reconnect
	 * to the server if the connection is lost.
	 *<ul>
	 *<li>If set to false, the client will not attempt to automatically reconnect to the server in the event that the
	 * connection is lost.</li>
	 *<li>If set to true, in the event that the connection is lost, the client will attempt to reconnect to the server.
	 * It will initially wait 1 second before it attempts to reconnect, for every failed reconnect attempt, the delay
	 * will double until it is at 2 minutes at which point the delay will stay at 2 minutes.</li>
	 *</ul>
	 * @param {number} connectOptions.mqttVersion - The version of MQTT to use to connect to the MQTT Broker.
	 *<ul>
	 *<li>3 - MQTT V3.1</li>
	 *<li>4 - MQTT V3.1.1</li>
	 *</ul>
	 * @param {boolean} connectOptions.mqttVersionExplicit - If set to true, will force the connection to use the
	 * selected MQTT Version or will fail to connect.
	 * @param {array} connectOptions.uris - If present, should contain a list of fully qualified WebSocket uris
	 * (e.g. ws://iot.eclipse.org:80/ws), that are tried in order in place of the host and port parameter of the construtor.
	 * The uris are tried one at a time in order until one of them succeeds. Do not use this in conjunction with hosts as
	 * the hosts array will be converted to uris and will overwrite this property.
		 * @throws {InvalidState} If the client is not in disconnected state. The client must have received connectionLost
		 * or disconnected before calling connect for a second or subsequent time.
		 */
			this.connect = function (connectOptions) {
				connectOptions = connectOptions || {} ;
				validate(connectOptions,  {timeout:"number",
					userName:"string",
					password:"string",
					willMessage:"object",
					keepAliveInterval:"number",
					cleanSession:"boolean",
					useSSL:"boolean",
					invocationContext:"object",
					onSuccess:"function",
					onFailure:"function",
					hosts:"object",
					ports:"object",
					reconnect:"boolean",
					mqttVersion:"number",
					mqttVersionExplicit:"boolean",
					uris: "object"});

				// If no keep alive interval is set, assume 60 seconds.
				if (connectOptions.keepAliveInterval === undefined)
					connectOptions.keepAliveInterval = 60;

				if (connectOptions.mqttVersion > 4 || connectOptions.mqttVersion < 3) {
					throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.mqttVersion, "connectOptions.mqttVersion"]));
				}

				if (connectOptions.mqttVersion === undefined) {
					connectOptions.mqttVersionExplicit = false;
					connectOptions.mqttVersion = 4;
				} else {
					connectOptions.mqttVersionExplicit = true;
				}

				//Check that if password is set, so is username
				if (connectOptions.password !== undefined && connectOptions.userName === undefined)
					throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.password, "connectOptions.password"]));

				if (connectOptions.willMessage) {
					if (!(connectOptions.willMessage instanceof Message))
						throw new Error(format(ERROR.INVALID_TYPE, [connectOptions.willMessage, "connectOptions.willMessage"]));
					// The will message must have a payload that can be represented as a string.
					// Cause the willMessage to throw an exception if this is not the case.
					connectOptions.willMessage.stringPayload = null;

					if (typeof connectOptions.willMessage.destinationName === "undefined")
						throw new Error(format(ERROR.INVALID_TYPE, [typeof connectOptions.willMessage.destinationName, "connectOptions.willMessage.destinationName"]));
				}
				if (typeof connectOptions.cleanSession === "undefined")
					connectOptions.cleanSession = true;
				if (connectOptions.hosts) {

					if (!(connectOptions.hosts instanceof Array) )
						throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.hosts, "connectOptions.hosts"]));
					if (connectOptions.hosts.length <1 )
						throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.hosts, "connectOptions.hosts"]));

					var usingURIs = false;
					for (var i = 0; i<connectOptions.hosts.length; i++) {
						if (typeof connectOptions.hosts[i] !== "string")
							throw new Error(format(ERROR.INVALID_TYPE, [typeof connectOptions.hosts[i], "connectOptions.hosts["+i+"]"]));
						if (/^(wss?):\/\/((\[(.+)\])|([^\/]+?))(:(\d+))?(\/.*)$/.test(connectOptions.hosts[i])) {
							if (i === 0) {
								usingURIs = true;
							} else if (!usingURIs) {
								throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.hosts[i], "connectOptions.hosts["+i+"]"]));
							}
						} else if (usingURIs) {
							throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.hosts[i], "connectOptions.hosts["+i+"]"]));
						}
					}

					if (!usingURIs) {
						if (!connectOptions.ports)
							throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.ports, "connectOptions.ports"]));
						if (!(connectOptions.ports instanceof Array) )
							throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.ports, "connectOptions.ports"]));
						if (connectOptions.hosts.length !== connectOptions.ports.length)
							throw new Error(format(ERROR.INVALID_ARGUMENT, [connectOptions.ports, "connectOptions.ports"]));

						connectOptions.uris = [];

						for (var i = 0; i<connectOptions.hosts.length; i++) {
							if (typeof connectOptions.ports[i] !== "number" || connectOptions.ports[i] < 0)
								throw new Error(format(ERROR.INVALID_TYPE, [typeof connectOptions.ports[i], "connectOptions.ports["+i+"]"]));
							var host = connectOptions.hosts[i];
							var port = connectOptions.ports[i];

							var ipv6 = (host.indexOf(":") !== -1);
							uri = "ws://"+(ipv6?"["+host+"]":host)+":"+port+path;
							connectOptions.uris.push(uri);
						}
					} else {
						connectOptions.uris = connectOptions.hosts;
					}
				}

				client.connect(connectOptions);
			};

			/**
		 * Subscribe for messages, request receipt of a copy of messages sent to the destinations described by the filter.
		 *
		 * @name Paho.Client#subscribe
		 * @function
		 * @param {string} filter describing the destinations to receive messages from.
		 * <br>
		 * @param {object} subscribeOptions - used to control the subscription
		 *
		 * @param {number} subscribeOptions.qos - the maximum qos of any publications sent
		 *                                  as a result of making this subscription.
		 * @param {object} subscribeOptions.invocationContext - passed to the onSuccess callback
		 *                                  or onFailure callback.
		 * @param {function} subscribeOptions.onSuccess - called when the subscribe acknowledgement
		 *                                  has been received from the server.
		 *                                  A single response object parameter is passed to the onSuccess callback containing the following fields:
		 *                                  <ol>
		 *                                  <li>invocationContext if set in the subscribeOptions.
		 *                                  </ol>
		 * @param {function} subscribeOptions.onFailure - called when the subscribe request has failed or timed out.
		 *                                  A single response object parameter is passed to the onFailure callback containing the following fields:
		 *                                  <ol>
		 *                                  <li>invocationContext - if set in the subscribeOptions.
		 *                                  <li>errorCode - a number indicating the nature of the error.
		 *                                  <li>errorMessage - text describing the error.
		 *                                  </ol>
		 * @param {number} subscribeOptions.timeout - which, if present, determines the number of
		 *                                  seconds after which the onFailure calback is called.
		 *                                  The presence of a timeout does not prevent the onSuccess
		 *                                  callback from being called when the subscribe completes.
		 * @throws {InvalidState} if the client is not in connected state.
		 */
			this.subscribe = function (filter, subscribeOptions) {
				if (typeof filter !== "string" && filter.constructor !== Array)
					throw new Error("Invalid argument:"+filter);
				subscribeOptions = subscribeOptions || {} ;
				validate(subscribeOptions,  {qos:"number",
					invocationContext:"object",
					onSuccess:"function",
					onFailure:"function",
					timeout:"number"
				});
				if (subscribeOptions.timeout && !subscribeOptions.onFailure)
					throw new Error("subscribeOptions.timeout specified with no onFailure callback.");
				if (typeof subscribeOptions.qos !== "undefined" && !(subscribeOptions.qos === 0 || subscribeOptions.qos === 1 || subscribeOptions.qos === 2 ))
					throw new Error(format(ERROR.INVALID_ARGUMENT, [subscribeOptions.qos, "subscribeOptions.qos"]));
				client.subscribe(filter, subscribeOptions);
			};

		/**
		 * Unsubscribe for messages, stop receiving messages sent to destinations described by the filter.
		 *
		 * @name Paho.Client#unsubscribe
		 * @function
		 * @param {string} filter - describing the destinations to receive messages from.
		 * @param {object} unsubscribeOptions - used to control the subscription
		 * @param {object} unsubscribeOptions.invocationContext - passed to the onSuccess callback
											  or onFailure callback.
		 * @param {function} unsubscribeOptions.onSuccess - called when the unsubscribe acknowledgement has been received from the server.
		 *                                    A single response object parameter is passed to the
		 *                                    onSuccess callback containing the following fields:
		 *                                    <ol>
		 *                                    <li>invocationContext - if set in the unsubscribeOptions.
		 *                                    </ol>
		 * @param {function} unsubscribeOptions.onFailure called when the unsubscribe request has failed or timed out.
		 *                                    A single response object parameter is passed to the onFailure callback containing the following fields:
		 *                                    <ol>
		 *                                    <li>invocationContext - if set in the unsubscribeOptions.
		 *                                    <li>errorCode - a number indicating the nature of the error.
		 *                                    <li>errorMessage - text describing the error.
		 *                                    </ol>
		 * @param {number} unsubscribeOptions.timeout - which, if present, determines the number of seconds
		 *                                    after which the onFailure callback is called. The presence of
		 *                                    a timeout does not prevent the onSuccess callback from being
		 *                                    called when the unsubscribe completes
		 * @throws {InvalidState} if the client is not in connected state.
		 */
			this.unsubscribe = function (filter, unsubscribeOptions) {
				if (typeof filter !== "string" && filter.constructor !== Array)
					throw new Error("Invalid argument:"+filter);
				unsubscribeOptions = unsubscribeOptions || {} ;
				validate(unsubscribeOptions,  {invocationContext:"object",
					onSuccess:"function",
					onFailure:"function",
					timeout:"number"
				});
				if (unsubscribeOptions.timeout && !unsubscribeOptions.onFailure)
					throw new Error("unsubscribeOptions.timeout specified with no onFailure callback.");
				client.unsubscribe(filter, unsubscribeOptions);
			};

			/**
		 * Send a message to the consumers of the destination in the Message.
		 *
		 * @name Paho.Client#send
		 * @function
		 * @param {string|Paho.Message} topic - <b>mandatory</b> The name of the destination to which the message is to be sent.
		 * 					   - If it is the only parameter, used as Paho.Message object.
		 * @param {String|ArrayBuffer} payload - The message data to be sent.
		 * @param {number} qos The Quality of Service used to deliver the message.
		 * 		<dl>
		 * 			<dt>0 Best effort (default).
		 *     			<dt>1 At least once.
		 *     			<dt>2 Exactly once.
		 * 		</dl>
		 * @param {Boolean} retained If true, the message is to be retained by the server and delivered
		 *                     to both current and future subscriptions.
		 *                     If false the server only delivers the message to current subscribers, this is the default for new Messages.
		 *                     A received message has the retained boolean set to true if the message was published
		 *                     with the retained boolean set to true
		 *                     and the subscrption was made after the message has been published.
		 * @throws {InvalidState} if the client is not connected.
		 */
			this.send = function (topic,payload,qos,retained) {
				var message ;

				if(arguments.length === 0){
					throw new Error("Invalid argument."+"length");

				}else if(arguments.length == 1) {

					if (!(topic instanceof Message) && (typeof topic !== "string"))
						throw new Error("Invalid argument:"+ typeof topic);

					message = topic;
					if (typeof message.destinationName === "undefined")
						throw new Error(format(ERROR.INVALID_ARGUMENT,[message.destinationName,"Message.destinationName"]));
					client.send(message);

				}else {
				//parameter checking in Message object
					message = new Message(payload);
					message.destinationName = topic;
					if(arguments.length >= 3)
						message.qos = qos;
					if(arguments.length >= 4)
						message.retained = retained;
					client.send(message);
				}
			};

			/**
		 * Publish a message to the consumers of the destination in the Message.
		 * Synonym for Paho.Mqtt.Client#send
		 *
		 * @name Paho.Client#publish
		 * @function
		 * @param {string|Paho.Message} topic - <b>mandatory</b> The name of the topic to which the message is to be published.
		 * 					   - If it is the only parameter, used as Paho.Message object.
		 * @param {String|ArrayBuffer} payload - The message data to be published.
		 * @param {number} qos The Quality of Service used to deliver the message.
		 * 		<dl>
		 * 			<dt>0 Best effort (default).
		 *     			<dt>1 At least once.
		 *     			<dt>2 Exactly once.
		 * 		</dl>
		 * @param {Boolean} retained If true, the message is to be retained by the server and delivered
		 *                     to both current and future subscriptions.
		 *                     If false the server only delivers the message to current subscribers, this is the default for new Messages.
		 *                     A received message has the retained boolean set to true if the message was published
		 *                     with the retained boolean set to true
		 *                     and the subscrption was made after the message has been published.
		 * @throws {InvalidState} if the client is not connected.
		 */
			this.publish = function(topic,payload,qos,retained) {
				var message ;

				if(arguments.length === 0){
					throw new Error("Invalid argument."+"length");

				}else if(arguments.length == 1) {

					if (!(topic instanceof Message) && (typeof topic !== "string"))
						throw new Error("Invalid argument:"+ typeof topic);

					message = topic;
					if (typeof message.destinationName === "undefined")
						throw new Error(format(ERROR.INVALID_ARGUMENT,[message.destinationName,"Message.destinationName"]));
					client.send(message);

				}else {
					//parameter checking in Message object
					message = new Message(payload);
					message.destinationName = topic;
					if(arguments.length >= 3)
						message.qos = qos;
					if(arguments.length >= 4)
						message.retained = retained;
					client.send(message);
				}
			};

			/**
		 * Normal disconnect of this Messaging client from its server.
		 *
		 * @name Paho.Client#disconnect
		 * @function
		 * @throws {InvalidState} if the client is already disconnected.
		 */
			this.disconnect = function () {
				client.disconnect();
			};

			/**
		 * Get the contents of the trace log.
		 *
		 * @name Paho.Client#getTraceLog
		 * @function
		 * @return {Object[]} tracebuffer containing the time ordered trace records.
		 */
			this.getTraceLog = function () {
				return client.getTraceLog();
			};

			/**
		 * Start tracing.
		 *
		 * @name Paho.Client#startTrace
		 * @function
		 */
			this.startTrace = function () {
				client.startTrace();
			};

			/**
		 * Stop tracing.
		 *
		 * @name Paho.Client#stopTrace
		 * @function
		 */
			this.stopTrace = function () {
				client.stopTrace();
			};

			this.isConnected = function() {
				return client.connected;
			};
		};

		/**
	 * An application message, sent or received.
	 * <p>
	 * All attributes may be null, which implies the default values.
	 *
	 * @name Paho.Message
	 * @constructor
	 * @param {String|ArrayBuffer} payload The message data to be sent.
	 * <p>
	 * @property {string} payloadString <i>read only</i> The payload as a string if the payload consists of valid UTF-8 characters.
	 * @property {ArrayBuffer} payloadBytes <i>read only</i> The payload as an ArrayBuffer.
	 * <p>
	 * @property {string} destinationName <b>mandatory</b> The name of the destination to which the message is to be sent
	 *                    (for messages about to be sent) or the name of the destination from which the message has been received.
	 *                    (for messages received by the onMessage function).
	 * <p>
	 * @property {number} qos The Quality of Service used to deliver the message.
	 * <dl>
	 *     <dt>0 Best effort (default).
	 *     <dt>1 At least once.
	 *     <dt>2 Exactly once.
	 * </dl>
	 * <p>
	 * @property {Boolean} retained If true, the message is to be retained by the server and delivered
	 *                     to both current and future subscriptions.
	 *                     If false the server only delivers the message to current subscribers, this is the default for new Messages.
	 *                     A received message has the retained boolean set to true if the message was published
	 *                     with the retained boolean set to true
	 *                     and the subscrption was made after the message has been published.
	 * <p>
	 * @property {Boolean} duplicate <i>read only</i> If true, this message might be a duplicate of one which has already been received.
	 *                     This is only set on messages received from the server.
	 *
	 */
		var Message = function (newPayload) {
			var payload;
			if (   typeof newPayload === "string" ||
		newPayload instanceof ArrayBuffer ||
		(ArrayBuffer.isView(newPayload) && !(newPayload instanceof DataView))
			) {
				payload = newPayload;
			} else {
				throw (format(ERROR.INVALID_ARGUMENT, [newPayload, "newPayload"]));
			}

			var destinationName;
			var qos = 0;
			var retained = false;
			var duplicate = false;

			Object.defineProperties(this,{
				"payloadString":{
					enumerable : true,
					get : function () {
						if (typeof payload === "string")
							return payload;
						else
							return parseUTF8(payload, 0, payload.length);
					}
				},
				"payloadBytes":{
					enumerable: true,
					get: function() {
						if (typeof payload === "string") {
							var buffer = new ArrayBuffer(UTF8Length(payload));
							var byteStream = new Uint8Array(buffer);
							stringToUTF8(payload, byteStream, 0);

							return byteStream;
						} else {
							return payload;
						}
					}
				},
				"destinationName":{
					enumerable: true,
					get: function() { return destinationName; },
					set: function(newDestinationName) {
						if (typeof newDestinationName === "string")
							destinationName = newDestinationName;
						else
							throw new Error(format(ERROR.INVALID_ARGUMENT, [newDestinationName, "newDestinationName"]));
					}
				},
				"qos":{
					enumerable: true,
					get: function() { return qos; },
					set: function(newQos) {
						if (newQos === 0 || newQos === 1 || newQos === 2 )
							qos = newQos;
						else
							throw new Error("Invalid argument:"+newQos);
					}
				},
				"retained":{
					enumerable: true,
					get: function() { return retained; },
					set: function(newRetained) {
						if (typeof newRetained === "boolean")
							retained = newRetained;
						else
							throw new Error(format(ERROR.INVALID_ARGUMENT, [newRetained, "newRetained"]));
					}
				},
				"topic":{
					enumerable: true,
					get: function() { return destinationName; },
					set: function(newTopic) {destinationName=newTopic;}
				},
				"duplicate":{
					enumerable: true,
					get: function() { return duplicate; },
					set: function(newDuplicate) {duplicate=newDuplicate;}
				}
			});
		};

		// Module contents.
		return {
			Client: Client,
			Message: Message
		};
	// eslint-disable-next-line no-nested-ternary
	})(typeof __webpack_require__.g !== "undefined" ? __webpack_require__.g : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	return PahoMQTT;
});


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HL = void 0;
const paho_mqtt_1 = __importDefault(__webpack_require__(/*! paho-mqtt */ "./node_modules/paho-mqtt/paho-mqtt.js"));
function getSessionCredentials(host, pipelineId) {
    return __awaiter(this, void 0, void 0, function* () {
        var url = host + "/graphql";
        const response = yield fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          mutation (
            $pipelineId: String!
          ) {
            createHlServingSession(pipelineId: $pipelineId) {
              sessionCredentials {
                sessionId
                sessionKey
                websocketUrl
                transport
                host
                port
                username
                password
                topicRequest
                topicResponse
              }
              errors
            }
          }
        `,
                variables: {
                    pipelineId: pipelineId,
                },
            }),
        });
        var text = yield response.text();
        console.log("Result: " + text);
        var result = JSON.parse(text);
        var creds = result.data.createHlServingSession.sessionCredentials;
        return creds;
    });
}
class StreamingSession {
    constructor(sessionCredentials) {
        this.reconnectTimeout = 2000;
        this.mqttClient = null;
        this.onMessage = null;
        this.onFailure = null;
        this.sessionCredentials = sessionCredentials;
    }
    _onConnectionFailure(mqttMessage) {
        console.debug("Failed to connect: " + JSON.stringify(mqttMessage)); //+ mqtt_host_port);
        if (this.onFailure && typeof this.onFailure === "function") {
            this.onFailure(mqttMessage);
        }
        setTimeout(this.connect, this.reconnectTimeout);
    }
    _onMessageArrived(mqttMessage) {
        const topic = mqttMessage.destinationName;
        const mqttPayload = mqttMessage.payloadString;
        console.debug("Received: " + topic + ": " + mqttPayload);
        const hlMessage = JSON.parse(mqttPayload);
        if (this.onMessage && typeof this.onMessage === "function") {
            this.onMessage(hlMessage.command, hlMessage.entity_id, hlMessage.payload);
        }
    }
    connect() {
        console.debug("Connecting with " + JSON.stringify(this.sessionCredentials));
        this.mqttClient = new paho_mqtt_1.default.Client(this.sessionCredentials.host, this.sessionCredentials.port, this.sessionCredentials.sessionId);
        const options = {
            timeout: 3,
            useSSL: true,
            userName: this.sessionCredentials.username,
            password: this.sessionCredentials.password,
            onFailure: this._onConnectionFailure.bind(this),
            onSuccess: this.onConnect.bind(this),
        };
        this.mqttClient.onMessageArrived = this._onMessageArrived.bind(this);
        this.mqttClient.connect(options);
    }
    onConnect() {
        console.log("Connected and subscribing to: " + this.sessionCredentials.topicResponse);
        if (this.mqttClient) {
            this.mqttClient.subscribe(this.sessionCredentials.topicResponse);
        }
        else {
            console.log("trying to connect without setting mqttClient");
        }
    }
    publish(payload) {
        var message = new paho_mqtt_1.default.Message(payload);
        message.destinationName = this.sessionCredentials.topicRequest;
        message.retained = false;
        if (this.mqttClient)
            this.mqttClient.send(message);
    }
    inferText(entityId, payload, frameId) {
        var text = {
            'type': 'ml_text',
            'frames': [
                {
                    'id': frameId,
                    'sentence': payload,
                    'entity_id': entityId,
                }
            ]
        };
        var message = {
            'version': 0,
            'frame_id': frameId,
            'command': 'infer',
            'schema': ['text'],
            'entity_id': entityId,
            'payload': text
        };
        const mqtt_payload = JSON.stringify(message);
        console.debug("publishing payload: " + mqtt_payload);
        this.publish(mqtt_payload);
    }
}
const HL = {
    getSessionCredentials,
    StreamingSession
};
exports.HL = HL;
window.HL = HL;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixnQkFBZ0I7QUFDbkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RCx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVksUUFBUTtBQUNwQixZQUFZLFFBQVE7QUFDcEIsWUFBWSxRQUFRO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQztBQUMvQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QiwrQkFBK0I7QUFDM0Q7O0FBRUE7QUFDQSxrREFBa0QsNEJBQTRCLDJFQUEyRTtBQUN6Sjs7QUFFQTtBQUNBLGlEQUFpRCw0QkFBNEIseUdBQXlHO0FBQ3RMOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxtREFBbUQ7QUFDbkQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLHVDQUF1Qyw4QkFBOEIsdURBQXVEO0FBQzVIO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLHFEQUFxRDtBQUNyRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx3QkFBd0I7O0FBRXhCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLHVCQUF1QjtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixxQkFBcUI7QUFDeEM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxPQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtRUFBbUUsaUNBQWlDO0FBQ3BHLGlEQUFpRCxPQUFPO0FBQ3hEO0FBQ0E7QUFDQSxpRUFBaUUsZ0RBQWdEO0FBQ2pIO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyx3REFBd0Q7QUFDN0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0VBQWdFLGdEQUFnRDtBQUNoSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUFBaUUsZ0RBQWdEO0FBQ2pIOzs7QUFHQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQThELGdEQUFnRDtBQUM5RztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsOERBQThELGdEQUFnRDtBQUM5Rzs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVksV0FBVztB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjs7Ozs7OztVQzdJQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQzs7Ozs7VUVQRDtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2hpZ2hsaWdodGVyLWpzLy4vbm9kZV9tb2R1bGVzL3BhaG8tbXF0dC9wYWhvLW1xdHQuanMiLCJ3ZWJwYWNrOi8vaGlnaGxpZ2h0ZXItanMvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vaGlnaGxpZ2h0ZXItanMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaGlnaGxpZ2h0ZXItanMvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9oaWdobGlnaHRlci1qcy93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2hpZ2hsaWdodGVyLWpzL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9oaWdobGlnaHRlci1qcy93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMyBJQk0gQ29ycC5cbiAqXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLiBUaGlzIHByb2dyYW0gYW5kIHRoZSBhY2NvbXBhbnlpbmcgbWF0ZXJpYWxzXG4gKiBhcmUgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBFY2xpcHNlIFB1YmxpYyBMaWNlbnNlIHYxLjBcbiAqIGFuZCBFY2xpcHNlIERpc3RyaWJ1dGlvbiBMaWNlbnNlIHYxLjAgd2hpY2ggYWNjb21wYW55IHRoaXMgZGlzdHJpYnV0aW9uLlxuICpcbiAqIFRoZSBFY2xpcHNlIFB1YmxpYyBMaWNlbnNlIGlzIGF2YWlsYWJsZSBhdFxuICogICAgaHR0cDovL3d3dy5lY2xpcHNlLm9yZy9sZWdhbC9lcGwtdjEwLmh0bWxcbiAqIGFuZCB0aGUgRWNsaXBzZSBEaXN0cmlidXRpb24gTGljZW5zZSBpcyBhdmFpbGFibGUgYXRcbiAqICAgaHR0cDovL3d3dy5lY2xpcHNlLm9yZy9vcmcvZG9jdW1lbnRzL2VkbC12MTAucGhwLlxuICpcbiAqIENvbnRyaWJ1dG9yczpcbiAqICAgIEFuZHJldyBCYW5rcyAtIGluaXRpYWwgQVBJIGFuZCBpbXBsZW1lbnRhdGlvbiBhbmQgaW5pdGlhbCBkb2N1bWVudGF0aW9uXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4vLyBPbmx5IGV4cG9zZSBhIHNpbmdsZSBvYmplY3QgbmFtZSBpbiB0aGUgZ2xvYmFsIG5hbWVzcGFjZS5cbi8vIEV2ZXJ5dGhpbmcgbXVzdCBnbyB0aHJvdWdoIHRoaXMgbW9kdWxlLiBHbG9iYWwgUGFobyBtb2R1bGVcbi8vIG9ubHkgaGFzIGEgc2luZ2xlIHB1YmxpYyBmdW5jdGlvbiwgY2xpZW50LCB3aGljaCByZXR1cm5zXG4vLyBhIFBhaG8gY2xpZW50IG9iamVjdCBnaXZlbiBjb25uZWN0aW9uIGRldGFpbHMuXG5cbi8qKlxuICogU2VuZCBhbmQgcmVjZWl2ZSBtZXNzYWdlcyB1c2luZyB3ZWIgYnJvd3NlcnMuXG4gKiA8cD5cbiAqIFRoaXMgcHJvZ3JhbW1pbmcgaW50ZXJmYWNlIGxldHMgYSBKYXZhU2NyaXB0IGNsaWVudCBhcHBsaWNhdGlvbiB1c2UgdGhlIE1RVFQgVjMuMSBvclxuICogVjMuMS4xIHByb3RvY29sIHRvIGNvbm5lY3QgdG8gYW4gTVFUVC1zdXBwb3J0aW5nIG1lc3NhZ2luZyBzZXJ2ZXIuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHN1cHBvcnRlZCBpbmNsdWRlczpcbiAqIDxvbD5cbiAqIDxsaT5Db25uZWN0aW5nIHRvIGFuZCBkaXNjb25uZWN0aW5nIGZyb20gYSBzZXJ2ZXIuIFRoZSBzZXJ2ZXIgaXMgaWRlbnRpZmllZCBieSBpdHMgaG9zdCBuYW1lIGFuZCBwb3J0IG51bWJlci5cbiAqIDxsaT5TcGVjaWZ5aW5nIG9wdGlvbnMgdGhhdCByZWxhdGUgdG8gdGhlIGNvbW11bmljYXRpb25zIGxpbmsgd2l0aCB0aGUgc2VydmVyLFxuICogZm9yIGV4YW1wbGUgdGhlIGZyZXF1ZW5jeSBvZiBrZWVwLWFsaXZlIGhlYXJ0YmVhdHMsIGFuZCB3aGV0aGVyIFNTTC9UTFMgaXMgcmVxdWlyZWQuXG4gKiA8bGk+U3Vic2NyaWJpbmcgdG8gYW5kIHJlY2VpdmluZyBtZXNzYWdlcyBmcm9tIE1RVFQgVG9waWNzLlxuICogPGxpPlB1Ymxpc2hpbmcgbWVzc2FnZXMgdG8gTVFUVCBUb3BpY3MuXG4gKiA8L29sPlxuICogPHA+XG4gKiBUaGUgQVBJIGNvbnNpc3RzIG9mIHR3byBtYWluIG9iamVjdHM6XG4gKiA8ZGw+XG4gKiA8ZHQ+PGI+e0BsaW5rIFBhaG8uQ2xpZW50fTwvYj48L2R0PlxuICogPGRkPlRoaXMgY29udGFpbnMgbWV0aG9kcyB0aGF0IHByb3ZpZGUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIEFQSSxcbiAqIGluY2x1ZGluZyBwcm92aXNpb24gb2YgY2FsbGJhY2tzIHRoYXQgbm90aWZ5IHRoZSBhcHBsaWNhdGlvbiB3aGVuIGEgbWVzc2FnZVxuICogYXJyaXZlcyBmcm9tIG9yIGlzIGRlbGl2ZXJlZCB0byB0aGUgbWVzc2FnaW5nIHNlcnZlcixcbiAqIG9yIHdoZW4gdGhlIHN0YXR1cyBvZiBpdHMgY29ubmVjdGlvbiB0byB0aGUgbWVzc2FnaW5nIHNlcnZlciBjaGFuZ2VzLjwvZGQ+XG4gKiA8ZHQ+PGI+e0BsaW5rIFBhaG8uTWVzc2FnZX08L2I+PC9kdD5cbiAqIDxkZD5UaGlzIGVuY2Fwc3VsYXRlcyB0aGUgcGF5bG9hZCBvZiB0aGUgbWVzc2FnZSBhbG9uZyB3aXRoIHZhcmlvdXMgYXR0cmlidXRlc1xuICogYXNzb2NpYXRlZCB3aXRoIGl0cyBkZWxpdmVyeSwgaW4gcGFydGljdWxhciB0aGUgZGVzdGluYXRpb24gdG8gd2hpY2ggaXQgaGFzXG4gKiBiZWVuIChvciBpcyBhYm91dCB0byBiZSkgc2VudC48L2RkPlxuICogPC9kbD5cbiAqIDxwPlxuICogVGhlIHByb2dyYW1taW5nIGludGVyZmFjZSB2YWxpZGF0ZXMgcGFyYW1ldGVycyBwYXNzZWQgdG8gaXQsIGFuZCB3aWxsIHRocm93XG4gKiBhbiBFcnJvciBjb250YWluaW5nIGFuIGVycm9yIG1lc3NhZ2UgaW50ZW5kZWQgZm9yIGRldmVsb3BlciB1c2UsIGlmIGl0IGRldGVjdHNcbiAqIGFuIGVycm9yIHdpdGggYW55IHBhcmFtZXRlci5cbiAqIDxwPlxuICogRXhhbXBsZTpcbiAqXG4gKiA8Y29kZT48cHJlPlxudmFyIGNsaWVudCA9IG5ldyBQYWhvLk1RVFQuQ2xpZW50KGxvY2F0aW9uLmhvc3RuYW1lLCBOdW1iZXIobG9jYXRpb24ucG9ydCksIFwiY2xpZW50SWRcIik7XG5jbGllbnQub25Db25uZWN0aW9uTG9zdCA9IG9uQ29ubmVjdGlvbkxvc3Q7XG5jbGllbnQub25NZXNzYWdlQXJyaXZlZCA9IG9uTWVzc2FnZUFycml2ZWQ7XG5jbGllbnQuY29ubmVjdCh7b25TdWNjZXNzOm9uQ29ubmVjdH0pO1xuXG5mdW5jdGlvbiBvbkNvbm5lY3QoKSB7XG4gIC8vIE9uY2UgYSBjb25uZWN0aW9uIGhhcyBiZWVuIG1hZGUsIG1ha2UgYSBzdWJzY3JpcHRpb24gYW5kIHNlbmQgYSBtZXNzYWdlLlxuICBjb25zb2xlLmxvZyhcIm9uQ29ubmVjdFwiKTtcbiAgY2xpZW50LnN1YnNjcmliZShcIi9Xb3JsZFwiKTtcbiAgdmFyIG1lc3NhZ2UgPSBuZXcgUGFoby5NUVRULk1lc3NhZ2UoXCJIZWxsb1wiKTtcbiAgbWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUgPSBcIi9Xb3JsZFwiO1xuICBjbGllbnQuc2VuZChtZXNzYWdlKTtcbn07XG5mdW5jdGlvbiBvbkNvbm5lY3Rpb25Mb3N0KHJlc3BvbnNlT2JqZWN0KSB7XG4gIGlmIChyZXNwb25zZU9iamVjdC5lcnJvckNvZGUgIT09IDApXG5cdGNvbnNvbGUubG9nKFwib25Db25uZWN0aW9uTG9zdDpcIityZXNwb25zZU9iamVjdC5lcnJvck1lc3NhZ2UpO1xufTtcbmZ1bmN0aW9uIG9uTWVzc2FnZUFycml2ZWQobWVzc2FnZSkge1xuICBjb25zb2xlLmxvZyhcIm9uTWVzc2FnZUFycml2ZWQ6XCIrbWVzc2FnZS5wYXlsb2FkU3RyaW5nKTtcbiAgY2xpZW50LmRpc2Nvbm5lY3QoKTtcbn07XG4gKiA8L3ByZT48L2NvZGU+XG4gKiBAbmFtZXNwYWNlIFBhaG9cbiAqL1xuXG4vKiBqc2hpbnQgc2hhZG93OnRydWUgKi9cbihmdW5jdGlvbiBFeHBvcnRMaWJyYXJ5KHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIil7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpe1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIil7XG5cdFx0ZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fSBlbHNlIHtcblx0XHQvL2lmICh0eXBlb2Ygcm9vdC5QYWhvID09PSBcInVuZGVmaW5lZFwiKXtcblx0XHQvL1x0cm9vdC5QYWhvID0ge307XG5cdFx0Ly99XG5cdFx0cm9vdC5QYWhvID0gZmFjdG9yeSgpO1xuXHR9XG59KSh0aGlzLCBmdW5jdGlvbiBMaWJyYXJ5RmFjdG9yeSgpe1xuXG5cblx0dmFyIFBhaG9NUVRUID0gKGZ1bmN0aW9uIChnbG9iYWwpIHtcblxuXHQvLyBQcml2YXRlIHZhcmlhYmxlcyBiZWxvdywgdGhlc2UgYXJlIG9ubHkgdmlzaWJsZSBpbnNpZGUgdGhlIGZ1bmN0aW9uIGNsb3N1cmVcblx0Ly8gd2hpY2ggaXMgdXNlZCB0byBkZWZpbmUgdGhlIG1vZHVsZS5cblx0dmFyIHZlcnNpb24gPSBcIkBWRVJTSU9OQC1AQlVJTERMRVZFTEBcIjtcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHZhciBsb2NhbFN0b3JhZ2UgPSBnbG9iYWwubG9jYWxTdG9yYWdlIHx8IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRhdGEgPSB7fTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzZXRJdGVtOiBmdW5jdGlvbiAoa2V5LCBpdGVtKSB7IGRhdGFba2V5XSA9IGl0ZW07IH0sXG5cdFx0XHRnZXRJdGVtOiBmdW5jdGlvbiAoa2V5KSB7IHJldHVybiBkYXRhW2tleV07IH0sXG5cdFx0XHRyZW1vdmVJdGVtOiBmdW5jdGlvbiAoa2V5KSB7IGRlbGV0ZSBkYXRhW2tleV07IH0sXG5cdFx0fTtcblx0fSkoKTtcblxuXHRcdC8qKlxuXHQgKiBVbmlxdWUgbWVzc2FnZSB0eXBlIGlkZW50aWZpZXJzLCB3aXRoIGFzc29jaWF0ZWRcblx0ICogYXNzb2NpYXRlZCBpbnRlZ2VyIHZhbHVlcy5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdFx0dmFyIE1FU1NBR0VfVFlQRSA9IHtcblx0XHRcdENPTk5FQ1Q6IDEsXG5cdFx0XHRDT05OQUNLOiAyLFxuXHRcdFx0UFVCTElTSDogMyxcblx0XHRcdFBVQkFDSzogNCxcblx0XHRcdFBVQlJFQzogNSxcblx0XHRcdFBVQlJFTDogNixcblx0XHRcdFBVQkNPTVA6IDcsXG5cdFx0XHRTVUJTQ1JJQkU6IDgsXG5cdFx0XHRTVUJBQ0s6IDksXG5cdFx0XHRVTlNVQlNDUklCRTogMTAsXG5cdFx0XHRVTlNVQkFDSzogMTEsXG5cdFx0XHRQSU5HUkVROiAxMixcblx0XHRcdFBJTkdSRVNQOiAxMyxcblx0XHRcdERJU0NPTk5FQ1Q6IDE0XG5cdFx0fTtcblxuXHRcdC8vIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBtZXRob2RzIHVzZWQgdG8gc2ltcGxpZnkgbW9kdWxlIGNvZGVcblx0XHQvLyBhbmQgcHJvbW90ZSB0aGUgRFJZIHBhdHRlcm4uXG5cblx0XHQvKipcblx0ICogVmFsaWRhdGUgYW4gb2JqZWN0J3MgcGFyYW1ldGVyIG5hbWVzIHRvIGVuc3VyZSB0aGV5XG5cdCAqIG1hdGNoIGEgbGlzdCBvZiBleHBlY3RlZCB2YXJpYWJsZXMgbmFtZSBmb3IgdGhpcyBvcHRpb25cblx0ICogdHlwZS4gVXNlZCB0byBlbnN1cmUgb3B0aW9uIG9iamVjdCBwYXNzZWQgaW50byB0aGUgQVBJIGRvbid0XG5cdCAqIGNvbnRhaW4gZXJyb25lb3VzIHBhcmFtZXRlcnMuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBVc2VyIG9wdGlvbnMgb2JqZWN0XG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBrZXlzIC0gdmFsaWQga2V5cyBhbmQgdHlwZXMgdGhhdCBtYXkgZXhpc3QgaW4gb2JqLlxuXHQgKiBAdGhyb3dzIHtFcnJvcn0gSW52YWxpZCBvcHRpb24gcGFyYW1ldGVyIGZvdW5kLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0XHR2YXIgdmFsaWRhdGUgPSBmdW5jdGlvbihvYmosIGtleXMpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0aWYgKGtleXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBvYmpba2V5XSAhPT0ga2V5c1trZXldKVxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBvYmpba2V5XSwga2V5XSkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgZXJyb3JTdHIgPSBcIlVua25vd24gcHJvcGVydHksIFwiICsga2V5ICsgXCIuIFZhbGlkIHByb3BlcnRpZXMgYXJlOlwiO1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIgdmFsaWRLZXkgaW4ga2V5cylcblx0XHRcdFx0XHRcdFx0aWYgKGtleXMuaGFzT3duUHJvcGVydHkodmFsaWRLZXkpKVxuXHRcdFx0XHRcdFx0XHRcdGVycm9yU3RyID0gZXJyb3JTdHIrXCIgXCIrdmFsaWRLZXk7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyb3JTdHIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0ICogUmV0dXJuIGEgbmV3IGZ1bmN0aW9uIHdoaWNoIHJ1bnMgdGhlIHVzZXIgZnVuY3Rpb24gYm91bmRcblx0ICogdG8gYSBmaXhlZCBzY29wZS5cblx0ICogQHBhcmFtIHtmdW5jdGlvbn0gVXNlciBmdW5jdGlvblxuXHQgKiBAcGFyYW0ge29iamVjdH0gRnVuY3Rpb24gc2NvcGVcblx0ICogQHJldHVybiB7ZnVuY3Rpb259IFVzZXIgZnVuY3Rpb24gYm91bmQgdG8gYW5vdGhlciBzY29wZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0XHR2YXIgc2NvcGUgPSBmdW5jdGlvbiAoZiwgc2NvcGUpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBmLmFwcGx5KHNjb3BlLCBhcmd1bWVudHMpO1xuXHRcdFx0fTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdCAqIFVuaXF1ZSBtZXNzYWdlIHR5cGUgaWRlbnRpZmllcnMsIHdpdGggYXNzb2NpYXRlZFxuXHQgKiBhc3NvY2lhdGVkIGludGVnZXIgdmFsdWVzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0XHR2YXIgRVJST1IgPSB7XG5cdFx0XHRPSzoge2NvZGU6MCwgdGV4dDpcIkFNUUpTQzAwMDBJIE9LLlwifSxcblx0XHRcdENPTk5FQ1RfVElNRU9VVDoge2NvZGU6MSwgdGV4dDpcIkFNUUpTQzAwMDFFIENvbm5lY3QgdGltZWQgb3V0LlwifSxcblx0XHRcdFNVQlNDUklCRV9USU1FT1VUOiB7Y29kZToyLCB0ZXh0OlwiQU1RSlMwMDAyRSBTdWJzY3JpYmUgdGltZWQgb3V0LlwifSxcblx0XHRcdFVOU1VCU0NSSUJFX1RJTUVPVVQ6IHtjb2RlOjMsIHRleHQ6XCJBTVFKUzAwMDNFIFVuc3Vic2NyaWJlIHRpbWVkIG91dC5cIn0sXG5cdFx0XHRQSU5HX1RJTUVPVVQ6IHtjb2RlOjQsIHRleHQ6XCJBTVFKUzAwMDRFIFBpbmcgdGltZWQgb3V0LlwifSxcblx0XHRcdElOVEVSTkFMX0VSUk9SOiB7Y29kZTo1LCB0ZXh0OlwiQU1RSlMwMDA1RSBJbnRlcm5hbCBlcnJvci4gRXJyb3IgTWVzc2FnZTogezB9LCBTdGFjayB0cmFjZTogezF9XCJ9LFxuXHRcdFx0Q09OTkFDS19SRVRVUk5DT0RFOiB7Y29kZTo2LCB0ZXh0OlwiQU1RSlMwMDA2RSBCYWQgQ29ubmFjayByZXR1cm4gY29kZTp7MH0gezF9LlwifSxcblx0XHRcdFNPQ0tFVF9FUlJPUjoge2NvZGU6NywgdGV4dDpcIkFNUUpTMDAwN0UgU29ja2V0IGVycm9yOnswfS5cIn0sXG5cdFx0XHRTT0NLRVRfQ0xPU0U6IHtjb2RlOjgsIHRleHQ6XCJBTVFKUzAwMDhJIFNvY2tldCBjbG9zZWQuXCJ9LFxuXHRcdFx0TUFMRk9STUVEX1VURjoge2NvZGU6OSwgdGV4dDpcIkFNUUpTMDAwOUUgTWFsZm9ybWVkIFVURiBkYXRhOnswfSB7MX0gezJ9LlwifSxcblx0XHRcdFVOU1VQUE9SVEVEOiB7Y29kZToxMCwgdGV4dDpcIkFNUUpTMDAxMEUgezB9IGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyLlwifSxcblx0XHRcdElOVkFMSURfU1RBVEU6IHtjb2RlOjExLCB0ZXh0OlwiQU1RSlMwMDExRSBJbnZhbGlkIHN0YXRlIHswfS5cIn0sXG5cdFx0XHRJTlZBTElEX1RZUEU6IHtjb2RlOjEyLCB0ZXh0OlwiQU1RSlMwMDEyRSBJbnZhbGlkIHR5cGUgezB9IGZvciB7MX0uXCJ9LFxuXHRcdFx0SU5WQUxJRF9BUkdVTUVOVDoge2NvZGU6MTMsIHRleHQ6XCJBTVFKUzAwMTNFIEludmFsaWQgYXJndW1lbnQgezB9IGZvciB7MX0uXCJ9LFxuXHRcdFx0VU5TVVBQT1JURURfT1BFUkFUSU9OOiB7Y29kZToxNCwgdGV4dDpcIkFNUUpTMDAxNEUgVW5zdXBwb3J0ZWQgb3BlcmF0aW9uLlwifSxcblx0XHRcdElOVkFMSURfU1RPUkVEX0RBVEE6IHtjb2RlOjE1LCB0ZXh0OlwiQU1RSlMwMDE1RSBJbnZhbGlkIGRhdGEgaW4gbG9jYWwgc3RvcmFnZSBrZXk9ezB9IHZhbHVlPXsxfS5cIn0sXG5cdFx0XHRJTlZBTElEX01RVFRfTUVTU0FHRV9UWVBFOiB7Y29kZToxNiwgdGV4dDpcIkFNUUpTMDAxNkUgSW52YWxpZCBNUVRUIG1lc3NhZ2UgdHlwZSB7MH0uXCJ9LFxuXHRcdFx0TUFMRk9STUVEX1VOSUNPREU6IHtjb2RlOjE3LCB0ZXh0OlwiQU1RSlMwMDE3RSBNYWxmb3JtZWQgVW5pY29kZSBzdHJpbmc6ezB9IHsxfS5cIn0sXG5cdFx0XHRCVUZGRVJfRlVMTDoge2NvZGU6MTgsIHRleHQ6XCJBTVFKUzAwMThFIE1lc3NhZ2UgYnVmZmVyIGlzIGZ1bGwsIG1heGltdW0gYnVmZmVyIHNpemU6IHswfS5cIn0sXG5cdFx0fTtcblxuXHRcdC8qKiBDT05OQUNLIFJDIE1lYW5pbmcuICovXG5cdFx0dmFyIENPTk5BQ0tfUkMgPSB7XG5cdFx0XHQwOlwiQ29ubmVjdGlvbiBBY2NlcHRlZFwiLFxuXHRcdFx0MTpcIkNvbm5lY3Rpb24gUmVmdXNlZDogdW5hY2NlcHRhYmxlIHByb3RvY29sIHZlcnNpb25cIixcblx0XHRcdDI6XCJDb25uZWN0aW9uIFJlZnVzZWQ6IGlkZW50aWZpZXIgcmVqZWN0ZWRcIixcblx0XHRcdDM6XCJDb25uZWN0aW9uIFJlZnVzZWQ6IHNlcnZlciB1bmF2YWlsYWJsZVwiLFxuXHRcdFx0NDpcIkNvbm5lY3Rpb24gUmVmdXNlZDogYmFkIHVzZXIgbmFtZSBvciBwYXNzd29yZFwiLFxuXHRcdFx0NTpcIkNvbm5lY3Rpb24gUmVmdXNlZDogbm90IGF1dGhvcml6ZWRcIlxuXHRcdH07XG5cblx0LyoqXG5cdCAqIEZvcm1hdCBhbiBlcnJvciBtZXNzYWdlIHRleHQuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7ZXJyb3J9IEVSUk9SIHZhbHVlIGFib3ZlLlxuXHQgKiBAcGFyYW0ge3N1YnN0aXR1dGlvbnN9IFthcnJheV0gc3Vic3RpdHV0ZWQgaW50byB0aGUgdGV4dC5cblx0ICogQHJldHVybiB0aGUgdGV4dCB3aXRoIHRoZSBzdWJzdGl0dXRpb25zIG1hZGUuXG5cdCAqL1xuXHRcdHZhciBmb3JtYXQgPSBmdW5jdGlvbihlcnJvciwgc3Vic3RpdHV0aW9ucykge1xuXHRcdFx0dmFyIHRleHQgPSBlcnJvci50ZXh0O1xuXHRcdFx0aWYgKHN1YnN0aXR1dGlvbnMpIHtcblx0XHRcdFx0dmFyIGZpZWxkLHN0YXJ0O1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8c3Vic3RpdHV0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGZpZWxkID0gXCJ7XCIraStcIn1cIjtcblx0XHRcdFx0XHRzdGFydCA9IHRleHQuaW5kZXhPZihmaWVsZCk7XG5cdFx0XHRcdFx0aWYoc3RhcnQgPiAwKSB7XG5cdFx0XHRcdFx0XHR2YXIgcGFydDEgPSB0ZXh0LnN1YnN0cmluZygwLHN0YXJ0KTtcblx0XHRcdFx0XHRcdHZhciBwYXJ0MiA9IHRleHQuc3Vic3RyaW5nKHN0YXJ0K2ZpZWxkLmxlbmd0aCk7XG5cdFx0XHRcdFx0XHR0ZXh0ID0gcGFydDErc3Vic3RpdHV0aW9uc1tpXStwYXJ0Mjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdH07XG5cblx0XHQvL01RVFQgcHJvdG9jb2wgYW5kIHZlcnNpb24gICAgICAgICAgNiAgICBNICAgIFEgICAgSSAgICBzICAgIGQgICAgcCAgICAzXG5cdFx0dmFyIE1xdHRQcm90b0lkZW50aWZpZXJ2MyA9IFsweDAwLDB4MDYsMHg0ZCwweDUxLDB4NDksMHg3MywweDY0LDB4NzAsMHgwM107XG5cdFx0Ly9NUVRUIHByb3RvL3ZlcnNpb24gZm9yIDMxMSAgICAgICAgIDQgICAgTSAgICBRICAgIFQgICAgVCAgICA0XG5cdFx0dmFyIE1xdHRQcm90b0lkZW50aWZpZXJ2NCA9IFsweDAwLDB4MDQsMHg0ZCwweDUxLDB4NTQsMHg1NCwweDA0XTtcblxuXHRcdC8qKlxuXHQgKiBDb25zdHJ1Y3QgYW4gTVFUVCB3aXJlIHByb3RvY29sIG1lc3NhZ2UuXG5cdCAqIEBwYXJhbSB0eXBlIE1RVFQgcGFja2V0IHR5cGUuXG5cdCAqIEBwYXJhbSBvcHRpb25zIG9wdGlvbmFsIHdpcmUgbWVzc2FnZSBhdHRyaWJ1dGVzLlxuXHQgKlxuXHQgKiBPcHRpb25hbCBwcm9wZXJ0aWVzXG5cdCAqXG5cdCAqIG1lc3NhZ2VJZGVudGlmaWVyOiBtZXNzYWdlIElEIGluIHRoZSByYW5nZSBbMC4uNjU1MzVdXG5cdCAqIHBheWxvYWRNZXNzYWdlOlx0QXBwbGljYXRpb24gTWVzc2FnZSAtIFBVQkxJU0ggb25seVxuXHQgKiBjb25uZWN0U3RyaW5nczpcdGFycmF5IG9mIDAgb3IgbW9yZSBTdHJpbmdzIHRvIGJlIHB1dCBpbnRvIHRoZSBDT05ORUNUIHBheWxvYWRcblx0ICogdG9waWNzOlx0XHRcdGFycmF5IG9mIHN0cmluZ3MgKFNVQlNDUklCRSwgVU5TVUJTQ1JJQkUpXG5cdCAqIHJlcXVlc3RRb1M6XHRcdGFycmF5IG9mIFFvUyB2YWx1ZXMgWzAuLjJdXG5cdCAqXG5cdCAqIFwiRmxhZ1wiIHByb3BlcnRpZXNcblx0ICogY2xlYW5TZXNzaW9uOlx0dHJ1ZSBpZiBwcmVzZW50IC8gZmFsc2UgaWYgYWJzZW50IChDT05ORUNUKVxuXHQgKiB3aWxsTWVzc2FnZTogIFx0dHJ1ZSBpZiBwcmVzZW50IC8gZmFsc2UgaWYgYWJzZW50IChDT05ORUNUKVxuXHQgKiBpc1JldGFpbmVkOlx0XHR0cnVlIGlmIHByZXNlbnQgLyBmYWxzZSBpZiBhYnNlbnQgKENPTk5FQ1QpXG5cdCAqIHVzZXJOYW1lOlx0XHR0cnVlIGlmIHByZXNlbnQgLyBmYWxzZSBpZiBhYnNlbnQgKENPTk5FQ1QpXG5cdCAqIHBhc3N3b3JkOlx0XHR0cnVlIGlmIHByZXNlbnQgLyBmYWxzZSBpZiBhYnNlbnQgKENPTk5FQ1QpXG5cdCAqIGtlZXBBbGl2ZUludGVydmFsOlx0aW50ZWdlciBbMC4uNjU1MzVdICAoQ09OTkVDVClcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQGlnbm9yZVxuXHQgKi9cblx0XHR2YXIgV2lyZU1lc3NhZ2UgPSBmdW5jdGlvbiAodHlwZSwgb3B0aW9ucykge1xuXHRcdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHRcdGZvciAodmFyIG5hbWUgaW4gb3B0aW9ucykge1xuXHRcdFx0XHRpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuXHRcdFx0XHRcdHRoaXNbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdFdpcmVNZXNzYWdlLnByb3RvdHlwZS5lbmNvZGUgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBDb21wdXRlIHRoZSBmaXJzdCBieXRlIG9mIHRoZSBmaXhlZCBoZWFkZXJcblx0XHRcdHZhciBmaXJzdCA9ICgodGhpcy50eXBlICYgMHgwZikgPDwgNCk7XG5cblx0XHRcdC8qXG5cdFx0ICogTm93IGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSB2YXJpYWJsZSBoZWFkZXIgKyBwYXlsb2FkIGJ5IGFkZGluZyB1cCB0aGUgbGVuZ3Roc1xuXHRcdCAqIG9mIGFsbCB0aGUgY29tcG9uZW50IHBhcnRzXG5cdFx0ICovXG5cblx0XHRcdHZhciByZW1MZW5ndGggPSAwO1xuXHRcdFx0dmFyIHRvcGljU3RyTGVuZ3RoID0gW107XG5cdFx0XHR2YXIgZGVzdGluYXRpb25OYW1lTGVuZ3RoID0gMDtcblx0XHRcdHZhciB3aWxsTWVzc2FnZVBheWxvYWRCeXRlcztcblxuXHRcdFx0Ly8gaWYgdGhlIG1lc3NhZ2UgY29udGFpbnMgYSBtZXNzYWdlSWRlbnRpZmllciB0aGVuIHdlIG5lZWQgdHdvIGJ5dGVzIGZvciB0aGF0XG5cdFx0XHRpZiAodGhpcy5tZXNzYWdlSWRlbnRpZmllciAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRyZW1MZW5ndGggKz0gMjtcblxuXHRcdFx0c3dpdGNoKHRoaXMudHlwZSkge1xuXHRcdFx0Ly8gSWYgdGhpcyBhIENvbm5lY3QgdGhlbiB3ZSBuZWVkIHRvIGluY2x1ZGUgMTIgYnl0ZXMgZm9yIGl0cyBoZWFkZXJcblx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLkNPTk5FQ1Q6XG5cdFx0XHRcdHN3aXRjaCh0aGlzLm1xdHRWZXJzaW9uKSB7XG5cdFx0XHRcdGNhc2UgMzpcblx0XHRcdFx0XHRyZW1MZW5ndGggKz0gTXF0dFByb3RvSWRlbnRpZmllcnYzLmxlbmd0aCArIDM7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgNDpcblx0XHRcdFx0XHRyZW1MZW5ndGggKz0gTXF0dFByb3RvSWRlbnRpZmllcnY0Lmxlbmd0aCArIDM7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZW1MZW5ndGggKz0gVVRGOExlbmd0aCh0aGlzLmNsaWVudElkKSArIDI7XG5cdFx0XHRcdGlmICh0aGlzLndpbGxNZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRyZW1MZW5ndGggKz0gVVRGOExlbmd0aCh0aGlzLndpbGxNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSkgKyAyO1xuXHRcdFx0XHRcdC8vIFdpbGwgbWVzc2FnZSBpcyBhbHdheXMgYSBzdHJpbmcsIHNlbnQgYXMgVVRGLTggY2hhcmFjdGVycyB3aXRoIGEgcHJlY2VkaW5nIGxlbmd0aC5cblx0XHRcdFx0XHR3aWxsTWVzc2FnZVBheWxvYWRCeXRlcyA9IHRoaXMud2lsbE1lc3NhZ2UucGF5bG9hZEJ5dGVzO1xuXHRcdFx0XHRcdGlmICghKHdpbGxNZXNzYWdlUGF5bG9hZEJ5dGVzIGluc3RhbmNlb2YgVWludDhBcnJheSkpXG5cdFx0XHRcdFx0XHR3aWxsTWVzc2FnZVBheWxvYWRCeXRlcyA9IG5ldyBVaW50OEFycmF5KHBheWxvYWRCeXRlcyk7XG5cdFx0XHRcdFx0cmVtTGVuZ3RoICs9IHdpbGxNZXNzYWdlUGF5bG9hZEJ5dGVzLmJ5dGVMZW5ndGggKzI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMudXNlck5hbWUgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRyZW1MZW5ndGggKz0gVVRGOExlbmd0aCh0aGlzLnVzZXJOYW1lKSArIDI7XG5cdFx0XHRcdGlmICh0aGlzLnBhc3N3b3JkICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0cmVtTGVuZ3RoICs9IFVURjhMZW5ndGgodGhpcy5wYXNzd29yZCkgKyAyO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Ly8gU3Vic2NyaWJlLCBVbnN1YnNjcmliZSBjYW4gYm90aCBjb250YWluIHRvcGljIHN0cmluZ3Ncblx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlNVQlNDUklCRTpcblx0XHRcdFx0Zmlyc3QgfD0gMHgwMjsgLy8gUW9zID0gMTtcblx0XHRcdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy50b3BpY3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR0b3BpY1N0ckxlbmd0aFtpXSA9IFVURjhMZW5ndGgodGhpcy50b3BpY3NbaV0pO1xuXHRcdFx0XHRcdHJlbUxlbmd0aCArPSB0b3BpY1N0ckxlbmd0aFtpXSArIDI7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVtTGVuZ3RoICs9IHRoaXMucmVxdWVzdGVkUW9zLmxlbmd0aDsgLy8gMSBieXRlIGZvciBlYWNoIHRvcGljJ3MgUW9zXG5cdFx0XHRcdC8vIFFvUyBvbiBTdWJzY3JpYmUgb25seVxuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuVU5TVUJTQ1JJQkU6XG5cdFx0XHRcdGZpcnN0IHw9IDB4MDI7IC8vIFFvcyA9IDE7XG5cdFx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMudG9waWNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dG9waWNTdHJMZW5ndGhbaV0gPSBVVEY4TGVuZ3RoKHRoaXMudG9waWNzW2ldKTtcblx0XHRcdFx0XHRyZW1MZW5ndGggKz0gdG9waWNTdHJMZW5ndGhbaV0gKyAyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5QVUJSRUw6XG5cdFx0XHRcdGZpcnN0IHw9IDB4MDI7IC8vIFFvcyA9IDE7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5QVUJMSVNIOlxuXHRcdFx0XHRpZiAodGhpcy5wYXlsb2FkTWVzc2FnZS5kdXBsaWNhdGUpIGZpcnN0IHw9IDB4MDg7XG5cdFx0XHRcdGZpcnN0ICA9IGZpcnN0IHw9ICh0aGlzLnBheWxvYWRNZXNzYWdlLnFvcyA8PCAxKTtcblx0XHRcdFx0aWYgKHRoaXMucGF5bG9hZE1lc3NhZ2UucmV0YWluZWQpIGZpcnN0IHw9IDB4MDE7XG5cdFx0XHRcdGRlc3RpbmF0aW9uTmFtZUxlbmd0aCA9IFVURjhMZW5ndGgodGhpcy5wYXlsb2FkTWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUpO1xuXHRcdFx0XHRyZW1MZW5ndGggKz0gZGVzdGluYXRpb25OYW1lTGVuZ3RoICsgMjtcblx0XHRcdFx0dmFyIHBheWxvYWRCeXRlcyA9IHRoaXMucGF5bG9hZE1lc3NhZ2UucGF5bG9hZEJ5dGVzO1xuXHRcdFx0XHRyZW1MZW5ndGggKz0gcGF5bG9hZEJ5dGVzLmJ5dGVMZW5ndGg7XG5cdFx0XHRcdGlmIChwYXlsb2FkQnl0ZXMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcblx0XHRcdFx0XHRwYXlsb2FkQnl0ZXMgPSBuZXcgVWludDhBcnJheShwYXlsb2FkQnl0ZXMpO1xuXHRcdFx0XHRlbHNlIGlmICghKHBheWxvYWRCeXRlcyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKVxuXHRcdFx0XHRcdHBheWxvYWRCeXRlcyA9IG5ldyBVaW50OEFycmF5KHBheWxvYWRCeXRlcy5idWZmZXIpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuRElTQ09OTkVDVDpcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBOb3cgd2UgY2FuIGFsbG9jYXRlIGEgYnVmZmVyIGZvciB0aGUgbWVzc2FnZVxuXG5cdFx0XHR2YXIgbWJpID0gZW5jb2RlTUJJKHJlbUxlbmd0aCk7ICAvLyBDb252ZXJ0IHRoZSBsZW5ndGggdG8gTVFUVCBNQkkgZm9ybWF0XG5cdFx0XHR2YXIgcG9zID0gbWJpLmxlbmd0aCArIDE7ICAgICAgICAvLyBPZmZzZXQgb2Ygc3RhcnQgb2YgdmFyaWFibGUgaGVhZGVyXG5cdFx0XHR2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHJlbUxlbmd0aCArIHBvcyk7XG5cdFx0XHR2YXIgYnl0ZVN0cmVhbSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7ICAgIC8vIHZpZXcgaXQgYXMgYSBzZXF1ZW5jZSBvZiBieXRlc1xuXG5cdFx0XHQvL1dyaXRlIHRoZSBmaXhlZCBoZWFkZXIgaW50byB0aGUgYnVmZmVyXG5cdFx0XHRieXRlU3RyZWFtWzBdID0gZmlyc3Q7XG5cdFx0XHRieXRlU3RyZWFtLnNldChtYmksMSk7XG5cblx0XHRcdC8vIElmIHRoaXMgaXMgYSBQVUJMSVNIIHRoZW4gdGhlIHZhcmlhYmxlIGhlYWRlciBzdGFydHMgd2l0aCBhIHRvcGljXG5cdFx0XHRpZiAodGhpcy50eXBlID09IE1FU1NBR0VfVFlQRS5QVUJMSVNIKVxuXHRcdFx0XHRwb3MgPSB3cml0ZVN0cmluZyh0aGlzLnBheWxvYWRNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSwgZGVzdGluYXRpb25OYW1lTGVuZ3RoLCBieXRlU3RyZWFtLCBwb3MpO1xuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIENPTk5FQ1QgdGhlbiB0aGUgdmFyaWFibGUgaGVhZGVyIGNvbnRhaW5zIHRoZSBwcm90b2NvbCBuYW1lL3ZlcnNpb24sIGZsYWdzIGFuZCBrZWVwYWxpdmUgdGltZVxuXG5cdFx0XHRlbHNlIGlmICh0aGlzLnR5cGUgPT0gTUVTU0FHRV9UWVBFLkNPTk5FQ1QpIHtcblx0XHRcdFx0c3dpdGNoICh0aGlzLm1xdHRWZXJzaW9uKSB7XG5cdFx0XHRcdGNhc2UgMzpcblx0XHRcdFx0XHRieXRlU3RyZWFtLnNldChNcXR0UHJvdG9JZGVudGlmaWVydjMsIHBvcyk7XG5cdFx0XHRcdFx0cG9zICs9IE1xdHRQcm90b0lkZW50aWZpZXJ2My5sZW5ndGg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgNDpcblx0XHRcdFx0XHRieXRlU3RyZWFtLnNldChNcXR0UHJvdG9JZGVudGlmaWVydjQsIHBvcyk7XG5cdFx0XHRcdFx0cG9zICs9IE1xdHRQcm90b0lkZW50aWZpZXJ2NC5sZW5ndGg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGNvbm5lY3RGbGFncyA9IDA7XG5cdFx0XHRcdGlmICh0aGlzLmNsZWFuU2Vzc2lvbilcblx0XHRcdFx0XHRjb25uZWN0RmxhZ3MgPSAweDAyO1xuXHRcdFx0XHRpZiAodGhpcy53aWxsTWVzc2FnZSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdGNvbm5lY3RGbGFncyB8PSAweDA0O1xuXHRcdFx0XHRcdGNvbm5lY3RGbGFncyB8PSAodGhpcy53aWxsTWVzc2FnZS5xb3M8PDMpO1xuXHRcdFx0XHRcdGlmICh0aGlzLndpbGxNZXNzYWdlLnJldGFpbmVkKSB7XG5cdFx0XHRcdFx0XHRjb25uZWN0RmxhZ3MgfD0gMHgyMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMudXNlck5hbWUgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRjb25uZWN0RmxhZ3MgfD0gMHg4MDtcblx0XHRcdFx0aWYgKHRoaXMucGFzc3dvcmQgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRjb25uZWN0RmxhZ3MgfD0gMHg0MDtcblx0XHRcdFx0Ynl0ZVN0cmVhbVtwb3MrK10gPSBjb25uZWN0RmxhZ3M7XG5cdFx0XHRcdHBvcyA9IHdyaXRlVWludDE2ICh0aGlzLmtlZXBBbGl2ZUludGVydmFsLCBieXRlU3RyZWFtLCBwb3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBPdXRwdXQgdGhlIG1lc3NhZ2VJZGVudGlmaWVyIC0gaWYgdGhlcmUgaXMgb25lXG5cdFx0XHRpZiAodGhpcy5tZXNzYWdlSWRlbnRpZmllciAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRwb3MgPSB3cml0ZVVpbnQxNiAodGhpcy5tZXNzYWdlSWRlbnRpZmllciwgYnl0ZVN0cmVhbSwgcG9zKTtcblxuXHRcdFx0c3dpdGNoKHRoaXMudHlwZSkge1xuXHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuQ09OTkVDVDpcblx0XHRcdFx0cG9zID0gd3JpdGVTdHJpbmcodGhpcy5jbGllbnRJZCwgVVRGOExlbmd0aCh0aGlzLmNsaWVudElkKSwgYnl0ZVN0cmVhbSwgcG9zKTtcblx0XHRcdFx0aWYgKHRoaXMud2lsbE1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHBvcyA9IHdyaXRlU3RyaW5nKHRoaXMud2lsbE1lc3NhZ2UuZGVzdGluYXRpb25OYW1lLCBVVEY4TGVuZ3RoKHRoaXMud2lsbE1lc3NhZ2UuZGVzdGluYXRpb25OYW1lKSwgYnl0ZVN0cmVhbSwgcG9zKTtcblx0XHRcdFx0XHRwb3MgPSB3cml0ZVVpbnQxNih3aWxsTWVzc2FnZVBheWxvYWRCeXRlcy5ieXRlTGVuZ3RoLCBieXRlU3RyZWFtLCBwb3MpO1xuXHRcdFx0XHRcdGJ5dGVTdHJlYW0uc2V0KHdpbGxNZXNzYWdlUGF5bG9hZEJ5dGVzLCBwb3MpO1xuXHRcdFx0XHRcdHBvcyArPSB3aWxsTWVzc2FnZVBheWxvYWRCeXRlcy5ieXRlTGVuZ3RoO1xuXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMudXNlck5hbWUgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRwb3MgPSB3cml0ZVN0cmluZyh0aGlzLnVzZXJOYW1lLCBVVEY4TGVuZ3RoKHRoaXMudXNlck5hbWUpLCBieXRlU3RyZWFtLCBwb3MpO1xuXHRcdFx0XHRpZiAodGhpcy5wYXNzd29yZCAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdHBvcyA9IHdyaXRlU3RyaW5nKHRoaXMucGFzc3dvcmQsIFVURjhMZW5ndGgodGhpcy5wYXNzd29yZCksIGJ5dGVTdHJlYW0sIHBvcyk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5QVUJMSVNIOlxuXHRcdFx0XHQvLyBQVUJMSVNIIGhhcyBhIHRleHQgb3IgYmluYXJ5IHBheWxvYWQsIGlmIHRleHQgZG8gbm90IGFkZCBhIDIgYnl0ZSBsZW5ndGggZmllbGQsIGp1c3QgdGhlIFVURiBjaGFyYWN0ZXJzLlxuXHRcdFx0XHRieXRlU3RyZWFtLnNldChwYXlsb2FkQnl0ZXMsIHBvcyk7XG5cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Ly8gICAgXHQgICAgY2FzZSBNRVNTQUdFX1RZUEUuUFVCUkVDOlxuXHRcdFx0XHQvLyAgICBcdCAgICBjYXNlIE1FU1NBR0VfVFlQRS5QVUJSRUw6XG5cdFx0XHRcdC8vICAgIFx0ICAgIGNhc2UgTUVTU0FHRV9UWVBFLlBVQkNPTVA6XG5cdFx0XHRcdC8vICAgIFx0ICAgIFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlNVQlNDUklCRTpcblx0XHRcdFx0Ly8gU1VCU0NSSUJFIGhhcyBhIGxpc3Qgb2YgdG9waWMgc3RyaW5ncyBhbmQgcmVxdWVzdCBRb1Ncblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMudG9waWNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0cG9zID0gd3JpdGVTdHJpbmcodGhpcy50b3BpY3NbaV0sIHRvcGljU3RyTGVuZ3RoW2ldLCBieXRlU3RyZWFtLCBwb3MpO1xuXHRcdFx0XHRcdGJ5dGVTdHJlYW1bcG9zKytdID0gdGhpcy5yZXF1ZXN0ZWRRb3NbaV07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlVOU1VCU0NSSUJFOlxuXHRcdFx0XHQvLyBVTlNVQlNDUklCRSBoYXMgYSBsaXN0IG9mIHRvcGljIHN0cmluZ3Ncblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMudG9waWNzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdHBvcyA9IHdyaXRlU3RyaW5nKHRoaXMudG9waWNzW2ldLCB0b3BpY1N0ckxlbmd0aFtpXSwgYnl0ZVN0cmVhbSwgcG9zKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdC8vIERvIG5vdGhpbmcuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBidWZmZXI7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIGRlY29kZU1lc3NhZ2UoaW5wdXQscG9zKSB7XG5cdFx0XHR2YXIgc3RhcnRpbmdQb3MgPSBwb3M7XG5cdFx0XHR2YXIgZmlyc3QgPSBpbnB1dFtwb3NdO1xuXHRcdFx0dmFyIHR5cGUgPSBmaXJzdCA+PiA0O1xuXHRcdFx0dmFyIG1lc3NhZ2VJbmZvID0gZmlyc3QgJj0gMHgwZjtcblx0XHRcdHBvcyArPSAxO1xuXG5cblx0XHRcdC8vIERlY29kZSB0aGUgcmVtYWluaW5nIGxlbmd0aCAoTUJJIGZvcm1hdClcblxuXHRcdFx0dmFyIGRpZ2l0O1xuXHRcdFx0dmFyIHJlbUxlbmd0aCA9IDA7XG5cdFx0XHR2YXIgbXVsdGlwbGllciA9IDE7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGlmIChwb3MgPT0gaW5wdXQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtudWxsLHN0YXJ0aW5nUG9zXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkaWdpdCA9IGlucHV0W3BvcysrXTtcblx0XHRcdFx0cmVtTGVuZ3RoICs9ICgoZGlnaXQgJiAweDdGKSAqIG11bHRpcGxpZXIpO1xuXHRcdFx0XHRtdWx0aXBsaWVyICo9IDEyODtcblx0XHRcdH0gd2hpbGUgKChkaWdpdCAmIDB4ODApICE9PSAwKTtcblxuXHRcdFx0dmFyIGVuZFBvcyA9IHBvcytyZW1MZW5ndGg7XG5cdFx0XHRpZiAoZW5kUG9zID4gaW5wdXQubGVuZ3RoKSB7XG5cdFx0XHRcdHJldHVybiBbbnVsbCxzdGFydGluZ1Bvc107XG5cdFx0XHR9XG5cblx0XHRcdHZhciB3aXJlTWVzc2FnZSA9IG5ldyBXaXJlTWVzc2FnZSh0eXBlKTtcblx0XHRcdHN3aXRjaCh0eXBlKSB7XG5cdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5DT05OQUNLOlxuXHRcdFx0XHR2YXIgY29ubmVjdEFja25vd2xlZGdlRmxhZ3MgPSBpbnB1dFtwb3MrK107XG5cdFx0XHRcdGlmIChjb25uZWN0QWNrbm93bGVkZ2VGbGFncyAmIDB4MDEpXG5cdFx0XHRcdFx0d2lyZU1lc3NhZ2Uuc2Vzc2lvblByZXNlbnQgPSB0cnVlO1xuXHRcdFx0XHR3aXJlTWVzc2FnZS5yZXR1cm5Db2RlID0gaW5wdXRbcG9zKytdO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuUFVCTElTSDpcblx0XHRcdFx0dmFyIHFvcyA9IChtZXNzYWdlSW5mbyA+PiAxKSAmIDB4MDM7XG5cblx0XHRcdFx0dmFyIGxlbiA9IHJlYWRVaW50MTYoaW5wdXQsIHBvcyk7XG5cdFx0XHRcdHBvcyArPSAyO1xuXHRcdFx0XHR2YXIgdG9waWNOYW1lID0gcGFyc2VVVEY4KGlucHV0LCBwb3MsIGxlbik7XG5cdFx0XHRcdHBvcyArPSBsZW47XG5cdFx0XHRcdC8vIElmIFFvUyAxIG9yIDIgdGhlcmUgd2lsbCBiZSBhIG1lc3NhZ2VJZGVudGlmaWVyXG5cdFx0XHRcdGlmIChxb3MgPiAwKSB7XG5cdFx0XHRcdFx0d2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXIgPSByZWFkVWludDE2KGlucHV0LCBwb3MpO1xuXHRcdFx0XHRcdHBvcyArPSAyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIG1lc3NhZ2UgPSBuZXcgTWVzc2FnZShpbnB1dC5zdWJhcnJheShwb3MsIGVuZFBvcykpO1xuXHRcdFx0XHRpZiAoKG1lc3NhZ2VJbmZvICYgMHgwMSkgPT0gMHgwMSlcblx0XHRcdFx0XHRtZXNzYWdlLnJldGFpbmVkID0gdHJ1ZTtcblx0XHRcdFx0aWYgKChtZXNzYWdlSW5mbyAmIDB4MDgpID09IDB4MDgpXG5cdFx0XHRcdFx0bWVzc2FnZS5kdXBsaWNhdGUgPSAgdHJ1ZTtcblx0XHRcdFx0bWVzc2FnZS5xb3MgPSBxb3M7XG5cdFx0XHRcdG1lc3NhZ2UuZGVzdGluYXRpb25OYW1lID0gdG9waWNOYW1lO1xuXHRcdFx0XHR3aXJlTWVzc2FnZS5wYXlsb2FkTWVzc2FnZSA9IG1lc3NhZ2U7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlICBNRVNTQUdFX1RZUEUuUFVCQUNLOlxuXHRcdFx0Y2FzZSAgTUVTU0FHRV9UWVBFLlBVQlJFQzpcblx0XHRcdGNhc2UgIE1FU1NBR0VfVFlQRS5QVUJSRUw6XG5cdFx0XHRjYXNlICBNRVNTQUdFX1RZUEUuUFVCQ09NUDpcblx0XHRcdGNhc2UgIE1FU1NBR0VfVFlQRS5VTlNVQkFDSzpcblx0XHRcdFx0d2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXIgPSByZWFkVWludDE2KGlucHV0LCBwb3MpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAgTUVTU0FHRV9UWVBFLlNVQkFDSzpcblx0XHRcdFx0d2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXIgPSByZWFkVWludDE2KGlucHV0LCBwb3MpO1xuXHRcdFx0XHRwb3MgKz0gMjtcblx0XHRcdFx0d2lyZU1lc3NhZ2UucmV0dXJuQ29kZSA9IGlucHV0LnN1YmFycmF5KHBvcywgZW5kUG9zKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gW3dpcmVNZXNzYWdlLGVuZFBvc107XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gd3JpdGVVaW50MTYoaW5wdXQsIGJ1ZmZlciwgb2Zmc2V0KSB7XG5cdFx0XHRidWZmZXJbb2Zmc2V0KytdID0gaW5wdXQgPj4gODsgICAgICAvL01TQlxuXHRcdFx0YnVmZmVyW29mZnNldCsrXSA9IGlucHV0ICUgMjU2OyAgICAgLy9MU0Jcblx0XHRcdHJldHVybiBvZmZzZXQ7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gd3JpdGVTdHJpbmcoaW5wdXQsIHV0ZjhMZW5ndGgsIGJ1ZmZlciwgb2Zmc2V0KSB7XG5cdFx0XHRvZmZzZXQgPSB3cml0ZVVpbnQxNih1dGY4TGVuZ3RoLCBidWZmZXIsIG9mZnNldCk7XG5cdFx0XHRzdHJpbmdUb1VURjgoaW5wdXQsIGJ1ZmZlciwgb2Zmc2V0KTtcblx0XHRcdHJldHVybiBvZmZzZXQgKyB1dGY4TGVuZ3RoO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHJlYWRVaW50MTYoYnVmZmVyLCBvZmZzZXQpIHtcblx0XHRcdHJldHVybiAyNTYqYnVmZmVyW29mZnNldF0gKyBidWZmZXJbb2Zmc2V0KzFdO1xuXHRcdH1cblxuXHRcdC8qKlxuXHQgKiBFbmNvZGVzIGFuIE1RVFQgTXVsdGktQnl0ZSBJbnRlZ2VyXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRcdGZ1bmN0aW9uIGVuY29kZU1CSShudW1iZXIpIHtcblx0XHRcdHZhciBvdXRwdXQgPSBuZXcgQXJyYXkoMSk7XG5cdFx0XHR2YXIgbnVtQnl0ZXMgPSAwO1xuXG5cdFx0XHRkbyB7XG5cdFx0XHRcdHZhciBkaWdpdCA9IG51bWJlciAlIDEyODtcblx0XHRcdFx0bnVtYmVyID0gbnVtYmVyID4+IDc7XG5cdFx0XHRcdGlmIChudW1iZXIgPiAwKSB7XG5cdFx0XHRcdFx0ZGlnaXQgfD0gMHg4MDtcblx0XHRcdFx0fVxuXHRcdFx0XHRvdXRwdXRbbnVtQnl0ZXMrK10gPSBkaWdpdDtcblx0XHRcdH0gd2hpbGUgKCAobnVtYmVyID4gMCkgJiYgKG51bUJ5dGVzPDQpICk7XG5cblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdCAqIFRha2VzIGEgU3RyaW5nIGFuZCBjYWxjdWxhdGVzIGl0cyBsZW5ndGggaW4gYnl0ZXMgd2hlbiBlbmNvZGVkIGluIFVURjguXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRcdGZ1bmN0aW9uIFVURjhMZW5ndGgoaW5wdXQpIHtcblx0XHRcdHZhciBvdXRwdXQgPSAwO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGk8aW5wdXQubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmIChjaGFyQ29kZSA+IDB4N0ZGKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly8gU3Vycm9nYXRlIHBhaXIgbWVhbnMgaXRzIGEgNCBieXRlIGNoYXJhY3RlclxuXHRcdFx0XHRcdGlmICgweEQ4MDAgPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHhEQkZGKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGkrKztcblx0XHRcdFx0XHRcdG91dHB1dCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRvdXRwdXQgKz0zO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGNoYXJDb2RlID4gMHg3Rilcblx0XHRcdFx0XHRvdXRwdXQgKz0yO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0b3V0cHV0Kys7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH1cblxuXHRcdC8qKlxuXHQgKiBUYWtlcyBhIFN0cmluZyBhbmQgd3JpdGVzIGl0IGludG8gYW4gYXJyYXkgYXMgVVRGOCBlbmNvZGVkIGJ5dGVzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0XHRmdW5jdGlvbiBzdHJpbmdUb1VURjgoaW5wdXQsIG91dHB1dCwgc3RhcnQpIHtcblx0XHRcdHZhciBwb3MgPSBzdGFydDtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpPGlucHV0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG5cblx0XHRcdFx0Ly8gQ2hlY2sgZm9yIGEgc3Vycm9nYXRlIHBhaXIuXG5cdFx0XHRcdGlmICgweEQ4MDAgPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHhEQkZGKSB7XG5cdFx0XHRcdFx0dmFyIGxvd0NoYXJDb2RlID0gaW5wdXQuY2hhckNvZGVBdCgrK2kpO1xuXHRcdFx0XHRcdGlmIChpc05hTihsb3dDaGFyQ29kZSkpIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuTUFMRk9STUVEX1VOSUNPREUsIFtjaGFyQ29kZSwgbG93Q2hhckNvZGVdKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNoYXJDb2RlID0gKChjaGFyQ29kZSAtIDB4RDgwMCk8PDEwKSArIChsb3dDaGFyQ29kZSAtIDB4REMwMCkgKyAweDEwMDAwO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY2hhckNvZGUgPD0gMHg3Rikge1xuXHRcdFx0XHRcdG91dHB1dFtwb3MrK10gPSBjaGFyQ29kZTtcblx0XHRcdFx0fSBlbHNlIGlmIChjaGFyQ29kZSA8PSAweDdGRikge1xuXHRcdFx0XHRcdG91dHB1dFtwb3MrK10gPSBjaGFyQ29kZT4+NiAgJiAweDFGIHwgMHhDMDtcblx0XHRcdFx0XHRvdXRwdXRbcG9zKytdID0gY2hhckNvZGUgICAgICYgMHgzRiB8IDB4ODA7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY2hhckNvZGUgPD0gMHhGRkZGKSB7XG5cdFx0XHRcdFx0b3V0cHV0W3BvcysrXSA9IGNoYXJDb2RlPj4xMiAmIDB4MEYgfCAweEUwO1xuXHRcdFx0XHRcdG91dHB1dFtwb3MrK10gPSBjaGFyQ29kZT4+NiAgJiAweDNGIHwgMHg4MDtcblx0XHRcdFx0XHRvdXRwdXRbcG9zKytdID0gY2hhckNvZGUgICAgICYgMHgzRiB8IDB4ODA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b3V0cHV0W3BvcysrXSA9IGNoYXJDb2RlPj4xOCAmIDB4MDcgfCAweEYwO1xuXHRcdFx0XHRcdG91dHB1dFtwb3MrK10gPSBjaGFyQ29kZT4+MTIgJiAweDNGIHwgMHg4MDtcblx0XHRcdFx0XHRvdXRwdXRbcG9zKytdID0gY2hhckNvZGU+PjYgICYgMHgzRiB8IDB4ODA7XG5cdFx0XHRcdFx0b3V0cHV0W3BvcysrXSA9IGNoYXJDb2RlICAgICAmIDB4M0YgfCAweDgwO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHBhcnNlVVRGOChpbnB1dCwgb2Zmc2V0LCBsZW5ndGgpIHtcblx0XHRcdHZhciBvdXRwdXQgPSBcIlwiO1xuXHRcdFx0dmFyIHV0ZjE2O1xuXHRcdFx0dmFyIHBvcyA9IG9mZnNldDtcblxuXHRcdFx0d2hpbGUgKHBvcyA8IG9mZnNldCtsZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBieXRlMSA9IGlucHV0W3BvcysrXTtcblx0XHRcdFx0aWYgKGJ5dGUxIDwgMTI4KVxuXHRcdFx0XHRcdHV0ZjE2ID0gYnl0ZTE7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciBieXRlMiA9IGlucHV0W3BvcysrXS0xMjg7XG5cdFx0XHRcdFx0aWYgKGJ5dGUyIDwgMClcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuTUFMRk9STUVEX1VURiwgW2J5dGUxLnRvU3RyaW5nKDE2KSwgYnl0ZTIudG9TdHJpbmcoMTYpLFwiXCJdKSk7XG5cdFx0XHRcdFx0aWYgKGJ5dGUxIDwgMHhFMCkgICAgICAgICAgICAgLy8gMiBieXRlIGNoYXJhY3RlclxuXHRcdFx0XHRcdFx0dXRmMTYgPSA2NCooYnl0ZTEtMHhDMCkgKyBieXRlMjtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dmFyIGJ5dGUzID0gaW5wdXRbcG9zKytdLTEyODtcblx0XHRcdFx0XHRcdGlmIChieXRlMyA8IDApXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuTUFMRk9STUVEX1VURiwgW2J5dGUxLnRvU3RyaW5nKDE2KSwgYnl0ZTIudG9TdHJpbmcoMTYpLCBieXRlMy50b1N0cmluZygxNildKSk7XG5cdFx0XHRcdFx0XHRpZiAoYnl0ZTEgPCAweEYwKSAgICAgICAgLy8gMyBieXRlIGNoYXJhY3RlclxuXHRcdFx0XHRcdFx0XHR1dGYxNiA9IDQwOTYqKGJ5dGUxLTB4RTApICsgNjQqYnl0ZTIgKyBieXRlMztcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0dmFyIGJ5dGU0ID0gaW5wdXRbcG9zKytdLTEyODtcblx0XHRcdFx0XHRcdFx0aWYgKGJ5dGU0IDwgMClcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLk1BTEZPUk1FRF9VVEYsIFtieXRlMS50b1N0cmluZygxNiksIGJ5dGUyLnRvU3RyaW5nKDE2KSwgYnl0ZTMudG9TdHJpbmcoMTYpLCBieXRlNC50b1N0cmluZygxNildKSk7XG5cdFx0XHRcdFx0XHRcdGlmIChieXRlMSA8IDB4RjgpICAgICAgICAvLyA0IGJ5dGUgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHRcdFx0dXRmMTYgPSAyNjIxNDQqKGJ5dGUxLTB4RjApICsgNDA5NipieXRlMiArIDY0KmJ5dGUzICsgYnl0ZTQ7XG5cdFx0XHRcdFx0XHRcdGVsc2UgICAgICAgICAgICAgICAgICAgICAvLyBsb25nZXIgZW5jb2RpbmdzIGFyZSBub3Qgc3VwcG9ydGVkXG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5NQUxGT1JNRURfVVRGLCBbYnl0ZTEudG9TdHJpbmcoMTYpLCBieXRlMi50b1N0cmluZygxNiksIGJ5dGUzLnRvU3RyaW5nKDE2KSwgYnl0ZTQudG9TdHJpbmcoMTYpXSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh1dGYxNiA+IDB4RkZGRikgICAvLyA0IGJ5dGUgY2hhcmFjdGVyIC0gZXhwcmVzcyBhcyBhIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR1dGYxNiAtPSAweDEwMDAwO1xuXHRcdFx0XHRcdG91dHB1dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RDgwMCArICh1dGYxNiA+PiAxMCkpOyAvLyBsZWFkIGNoYXJhY3RlclxuXHRcdFx0XHRcdHV0ZjE2ID0gMHhEQzAwICsgKHV0ZjE2ICYgMHgzRkYpOyAgLy8gdHJhaWwgY2hhcmFjdGVyXG5cdFx0XHRcdH1cblx0XHRcdFx0b3V0cHV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodXRmMTYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHR9XG5cblx0XHQvKipcblx0ICogUmVwZWF0IGtlZXBhbGl2ZSByZXF1ZXN0cywgbW9uaXRvciByZXNwb25zZXMuXG5cdCAqIEBpZ25vcmVcblx0ICovXG5cdFx0dmFyIFBpbmdlciA9IGZ1bmN0aW9uKGNsaWVudCwga2VlcEFsaXZlSW50ZXJ2YWwpIHtcblx0XHRcdHRoaXMuX2NsaWVudCA9IGNsaWVudDtcblx0XHRcdHRoaXMuX2tlZXBBbGl2ZUludGVydmFsID0ga2VlcEFsaXZlSW50ZXJ2YWwqMTAwMDtcblx0XHRcdHRoaXMuaXNSZXNldCA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgcGluZ1JlcSA9IG5ldyBXaXJlTWVzc2FnZShNRVNTQUdFX1RZUEUuUElOR1JFUSkuZW5jb2RlKCk7XG5cblx0XHRcdHZhciBkb1RpbWVvdXQgPSBmdW5jdGlvbiAocGluZ2VyKSB7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRvUGluZy5hcHBseShwaW5nZXIpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblxuXHRcdFx0LyoqIEBpZ25vcmUgKi9cblx0XHRcdHZhciBkb1BpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCF0aGlzLmlzUmVzZXQpIHtcblx0XHRcdFx0XHR0aGlzLl9jbGllbnQuX3RyYWNlKFwiUGluZ2VyLmRvUGluZ1wiLCBcIlRpbWVkIG91dFwiKTtcblx0XHRcdFx0XHR0aGlzLl9jbGllbnQuX2Rpc2Nvbm5lY3RlZCggRVJST1IuUElOR19USU1FT1VULmNvZGUgLCBmb3JtYXQoRVJST1IuUElOR19USU1FT1VUKSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5pc1Jlc2V0ID0gZmFsc2U7XG5cdFx0XHRcdFx0dGhpcy5fY2xpZW50Ll90cmFjZShcIlBpbmdlci5kb1BpbmdcIiwgXCJzZW5kIFBJTkdSRVFcIik7XG5cdFx0XHRcdFx0dGhpcy5fY2xpZW50LnNvY2tldC5zZW5kKHBpbmdSZXEpO1xuXHRcdFx0XHRcdHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZG9UaW1lb3V0KHRoaXMpLCB0aGlzLl9rZWVwQWxpdmVJbnRlcnZhbCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5pc1Jlc2V0ID0gdHJ1ZTtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cdFx0XHRcdGlmICh0aGlzLl9rZWVwQWxpdmVJbnRlcnZhbCA+IDApXG5cdFx0XHRcdFx0dGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChkb1RpbWVvdXQodGhpcyksIHRoaXMuX2tlZXBBbGl2ZUludGVydmFsKTtcblx0XHRcdH07XG5cblx0XHRcdHRoaXMuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXHRcdFx0fTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdCAqIE1vbml0b3IgcmVxdWVzdCBjb21wbGV0aW9uLlxuXHQgKiBAaWdub3JlXG5cdCAqL1xuXHRcdHZhciBUaW1lb3V0ID0gZnVuY3Rpb24oY2xpZW50LCB0aW1lb3V0U2Vjb25kcywgYWN0aW9uLCBhcmdzKSB7XG5cdFx0XHRpZiAoIXRpbWVvdXRTZWNvbmRzKVxuXHRcdFx0XHR0aW1lb3V0U2Vjb25kcyA9IDMwO1xuXG5cdFx0XHR2YXIgZG9UaW1lb3V0ID0gZnVuY3Rpb24gKGFjdGlvbiwgY2xpZW50LCBhcmdzKSB7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFjdGlvbi5hcHBseShjbGllbnQsIGFyZ3MpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHRcdHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZG9UaW1lb3V0KGFjdGlvbiwgY2xpZW50LCBhcmdzKSwgdGltZW91dFNlY29uZHMgKiAxMDAwKTtcblxuXHRcdFx0dGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cdFx0XHR9O1xuXHRcdH07XG5cblx0LyoqXG5cdCAqIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIHRoZSBXZWJzb2NrZXRzIE1RVFQgVjMuMSBjbGllbnQuXG5cdCAqXG5cdCAqIEBuYW1lIFBhaG8uQ2xpZW50SW1wbCBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtTdHJpbmd9IGhvc3QgdGhlIEROUyBuYW1lb2YgdGhlIHdlYlNvY2tldCBob3N0LlxuXHQgKiBAcGFyYW0ge051bWJlcn0gcG9ydCB0aGUgcG9ydCBudW1iZXIgZm9yIHRoYXQgaG9zdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGNsaWVudElkIHRoZSBNUSBjbGllbnQgaWRlbnRpZmllci5cblx0ICovXG5cdFx0dmFyIENsaWVudEltcGwgPSBmdW5jdGlvbiAodXJpLCBob3N0LCBwb3J0LCBwYXRoLCBjbGllbnRJZCkge1xuXHRcdC8vIENoZWNrIGRlcGVuZGVuY2llcyBhcmUgc2F0aXNmaWVkIGluIHRoaXMgYnJvd3Nlci5cblx0XHRcdGlmICghKFwiV2ViU29ja2V0XCIgaW4gZ2xvYmFsICYmIGdsb2JhbC5XZWJTb2NrZXQgIT09IG51bGwpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuVU5TVVBQT1JURUQsIFtcIldlYlNvY2tldFwiXSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEoXCJBcnJheUJ1ZmZlclwiIGluIGdsb2JhbCAmJiBnbG9iYWwuQXJyYXlCdWZmZXIgIT09IG51bGwpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuVU5TVVBQT1JURUQsIFtcIkFycmF5QnVmZmVyXCJdKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl90cmFjZShcIlBhaG8uQ2xpZW50XCIsIHVyaSwgaG9zdCwgcG9ydCwgcGF0aCwgY2xpZW50SWQpO1xuXG5cdFx0XHR0aGlzLmhvc3QgPSBob3N0O1xuXHRcdFx0dGhpcy5wb3J0ID0gcG9ydDtcblx0XHRcdHRoaXMucGF0aCA9IHBhdGg7XG5cdFx0XHR0aGlzLnVyaSA9IHVyaTtcblx0XHRcdHRoaXMuY2xpZW50SWQgPSBjbGllbnRJZDtcblx0XHRcdHRoaXMuX3dzdXJpID0gbnVsbDtcblxuXHRcdFx0Ly8gTG9jYWwgc3RvcmFnZWtleXMgYXJlIHF1YWxpZmllZCB3aXRoIHRoZSBmb2xsb3dpbmcgc3RyaW5nLlxuXHRcdFx0Ly8gVGhlIGNvbmRpdGlvbmFsIGluY2x1c2lvbiBvZiBwYXRoIGluIHRoZSBrZXkgaXMgZm9yIGJhY2t3YXJkXG5cdFx0XHQvLyBjb21wYXRpYmlsaXR5IHRvIHdoZW4gdGhlIHBhdGggd2FzIG5vdCBjb25maWd1cmFibGUgYW5kIGFzc3VtZWQgdG9cblx0XHRcdC8vIGJlIC9tcXR0XG5cdFx0XHR0aGlzLl9sb2NhbEtleT1ob3N0K1wiOlwiK3BvcnQrKHBhdGghPVwiL21xdHRcIj9cIjpcIitwYXRoOlwiXCIpK1wiOlwiK2NsaWVudElkK1wiOlwiO1xuXG5cdFx0XHQvLyBDcmVhdGUgcHJpdmF0ZSBpbnN0YW5jZS1vbmx5IG1lc3NhZ2UgcXVldWVcblx0XHRcdC8vIEludGVybmFsIHF1ZXVlIG9mIG1lc3NhZ2VzIHRvIGJlIHNlbnQsIGluIHNlbmRpbmcgb3JkZXIuXG5cdFx0XHR0aGlzLl9tc2dfcXVldWUgPSBbXTtcblx0XHRcdHRoaXMuX2J1ZmZlcmVkX21zZ19xdWV1ZSA9IFtdO1xuXG5cdFx0XHQvLyBNZXNzYWdlcyB3ZSBoYXZlIHNlbnQgYW5kIGFyZSBleHBlY3RpbmcgYSByZXNwb25zZSBmb3IsIGluZGV4ZWQgYnkgdGhlaXIgcmVzcGVjdGl2ZSBtZXNzYWdlIGlkcy5cblx0XHRcdHRoaXMuX3NlbnRNZXNzYWdlcyA9IHt9O1xuXG5cdFx0XHQvLyBNZXNzYWdlcyB3ZSBoYXZlIHJlY2VpdmVkIGFuZCBhY2tub3dsZWdlZCBhbmQgYXJlIGV4cGVjdGluZyBhIGNvbmZpcm0gbWVzc2FnZSBmb3Jcblx0XHRcdC8vIGluZGV4ZWQgYnkgdGhlaXIgcmVzcGVjdGl2ZSBtZXNzYWdlIGlkcy5cblx0XHRcdHRoaXMuX3JlY2VpdmVkTWVzc2FnZXMgPSB7fTtcblxuXHRcdFx0Ly8gSW50ZXJuYWwgbGlzdCBvZiBjYWxsYmFja3MgdG8gYmUgZXhlY3V0ZWQgd2hlbiBtZXNzYWdlc1xuXHRcdFx0Ly8gaGF2ZSBiZWVuIHN1Y2Nlc3NmdWxseSBzZW50IG92ZXIgd2ViIHNvY2tldCwgZS5nLiBkaXNjb25uZWN0XG5cdFx0XHQvLyB3aGVuIGl0IGRvZXNuJ3QgaGF2ZSB0byB3YWl0IGZvciBBQ0ssIGp1c3QgbWVzc2FnZSBpcyBkaXNwYXRjaGVkLlxuXHRcdFx0dGhpcy5fbm90aWZ5X21zZ19zZW50ID0ge307XG5cblx0XHRcdC8vIFVuaXF1ZSBpZGVudGlmaWVyIGZvciBTRU5EIG1lc3NhZ2VzLCBpbmNyZW1lbnRpbmdcblx0XHRcdC8vIGNvdW50ZXIgYXMgbWVzc2FnZXMgYXJlIHNlbnQuXG5cdFx0XHR0aGlzLl9tZXNzYWdlX2lkZW50aWZpZXIgPSAxO1xuXG5cdFx0XHQvLyBVc2VkIHRvIGRldGVybWluZSB0aGUgdHJhbnNtaXNzaW9uIHNlcXVlbmNlIG9mIHN0b3JlZCBzZW50IG1lc3NhZ2VzLlxuXHRcdFx0dGhpcy5fc2VxdWVuY2UgPSAwO1xuXG5cblx0XHRcdC8vIExvYWQgdGhlIGxvY2FsIHN0YXRlLCBpZiBhbnksIGZyb20gdGhlIHNhdmVkIHZlcnNpb24sIG9ubHkgcmVzdG9yZSBzdGF0ZSByZWxldmFudCB0byB0aGlzIGNsaWVudC5cblx0XHRcdGZvciAodmFyIGtleSBpbiBsb2NhbFN0b3JhZ2UpXG5cdFx0XHRcdGlmICggICBrZXkuaW5kZXhPZihcIlNlbnQ6XCIrdGhpcy5fbG9jYWxLZXkpID09PSAwIHx8IGtleS5pbmRleE9mKFwiUmVjZWl2ZWQ6XCIrdGhpcy5fbG9jYWxLZXkpID09PSAwKVxuXHRcdFx0XHRcdHRoaXMucmVzdG9yZShrZXkpO1xuXHRcdH07XG5cblx0XHQvLyBNZXNzYWdpbmcgQ2xpZW50IHB1YmxpYyBpbnN0YW5jZSBtZW1iZXJzLlxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLmhvc3QgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnBvcnQgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnBhdGggPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnVyaSA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuY2xpZW50SWQgPSBudWxsO1xuXG5cdFx0Ly8gTWVzc2FnaW5nIENsaWVudCBwcml2YXRlIGluc3RhbmNlIG1lbWJlcnMuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuc29ja2V0ID0gbnVsbDtcblx0XHQvKiB0cnVlIG9uY2Ugd2UgaGF2ZSByZWNlaXZlZCBhbiBhY2tub3dsZWRnZW1lbnQgdG8gYSBDT05ORUNUIHBhY2tldC4gKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5jb25uZWN0ZWQgPSBmYWxzZTtcblx0XHQvKiBUaGUgbGFyZ2VzdCBtZXNzYWdlIGlkZW50aWZpZXIgYWxsb3dlZCwgbWF5IG5vdCBiZSBsYXJnZXIgdGhhbiAyKioxNiBidXRcblx0XHQgKiBpZiBzZXQgc21hbGxlciByZWR1Y2VzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBvdXRib3VuZCBtZXNzYWdlcyBhbGxvd2VkLlxuXHRcdCAqL1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLm1heE1lc3NhZ2VJZGVudGlmaWVyID0gNjU1MzY7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuY29ubmVjdE9wdGlvbnMgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLmhvc3RJbmRleCA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUub25Db25uZWN0ZWQgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLm9uQ29ubmVjdGlvbkxvc3QgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLm9uTWVzc2FnZURlbGl2ZXJlZCA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUub25NZXNzYWdlQXJyaXZlZCA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUudHJhY2VGdW5jdGlvbiA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX21zZ19xdWV1ZSA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX2J1ZmZlcmVkX21zZ19xdWV1ZSA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX2Nvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblx0XHQvKiBUaGUgc2VuZFBpbmdlciBtb25pdG9ycyBob3cgbG9uZyB3ZSBhbGxvdyBiZWZvcmUgd2Ugc2VuZCBkYXRhIHRvIHByb3ZlIHRvIHRoZSBzZXJ2ZXIgdGhhdCB3ZSBhcmUgYWxpdmUuICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuc2VuZFBpbmdlciA9IG51bGw7XG5cdFx0LyogVGhlIHJlY2VpdmVQaW5nZXIgbW9uaXRvcnMgaG93IGxvbmcgd2UgYWxsb3cgYmVmb3JlIHdlIHJlcXVpcmUgZXZpZGVuY2UgdGhhdCB0aGUgc2VydmVyIGlzIGFsaXZlLiAqL1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnJlY2VpdmVQaW5nZXIgPSBudWxsO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9yZWNvbm5lY3RJbnRlcnZhbCA9IDE7IC8vIFJlY29ubmVjdCBEZWxheSwgc3RhcnRzIGF0IDEgc2Vjb25kXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5kaXNjb25uZWN0ZWRQdWJsaXNoaW5nID0gZmFsc2U7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuZGlzY29ubmVjdGVkQnVmZmVyU2l6ZSA9IDUwMDA7XG5cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5yZWNlaXZlQnVmZmVyID0gbnVsbDtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl90cmFjZUJ1ZmZlciA9IG51bGw7XG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX01BWF9UUkFDRV9FTlRSSUVTID0gMTAwO1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uIChjb25uZWN0T3B0aW9ucykge1xuXHRcdFx0dmFyIGNvbm5lY3RPcHRpb25zTWFza2VkID0gdGhpcy5fdHJhY2VNYXNrKGNvbm5lY3RPcHRpb25zLCBcInBhc3N3b3JkXCIpO1xuXHRcdFx0dGhpcy5fdHJhY2UoXCJDbGllbnQuY29ubmVjdFwiLCBjb25uZWN0T3B0aW9uc01hc2tlZCwgdGhpcy5zb2NrZXQsIHRoaXMuY29ubmVjdGVkKTtcblxuXHRcdFx0aWYgKHRoaXMuY29ubmVjdGVkKVxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfU1RBVEUsIFtcImFscmVhZHkgY29ubmVjdGVkXCJdKSk7XG5cdFx0XHRpZiAodGhpcy5zb2NrZXQpXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9TVEFURSwgW1wiYWxyZWFkeSBjb25uZWN0ZWRcIl0pKTtcblxuXHRcdFx0aWYgKHRoaXMuX3JlY29ubmVjdGluZykge1xuXHRcdFx0Ly8gY29ubmVjdCgpIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGlsZSByZWNvbm5lY3QgaXMgaW4gcHJvZ3Jlc3MuXG5cdFx0XHQvLyBUZXJtaW5hdGUgdGhlIGF1dG8gcmVjb25uZWN0IHByb2Nlc3MgdG8gdXNlIG5ldyBjb25uZWN0IG9wdGlvbnMuXG5cdFx0XHRcdHRoaXMuX3JlY29ubmVjdFRpbWVvdXQuY2FuY2VsKCk7XG5cdFx0XHRcdHRoaXMuX3JlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXHRcdFx0XHR0aGlzLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5jb25uZWN0T3B0aW9ucyA9IGNvbm5lY3RPcHRpb25zO1xuXHRcdFx0dGhpcy5fcmVjb25uZWN0SW50ZXJ2YWwgPSAxO1xuXHRcdFx0dGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG5cdFx0XHRpZiAoY29ubmVjdE9wdGlvbnMudXJpcykge1xuXHRcdFx0XHR0aGlzLmhvc3RJbmRleCA9IDA7XG5cdFx0XHRcdHRoaXMuX2RvQ29ubmVjdChjb25uZWN0T3B0aW9ucy51cmlzWzBdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX2RvQ29ubmVjdCh0aGlzLnVyaSk7XG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGZpbHRlciwgc3Vic2NyaWJlT3B0aW9ucykge1xuXHRcdFx0dGhpcy5fdHJhY2UoXCJDbGllbnQuc3Vic2NyaWJlXCIsIGZpbHRlciwgc3Vic2NyaWJlT3B0aW9ucyk7XG5cblx0XHRcdGlmICghdGhpcy5jb25uZWN0ZWQpXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9TVEFURSwgW1wibm90IGNvbm5lY3RlZFwiXSkpO1xuXG4gICAgICAgICAgICB2YXIgd2lyZU1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlNVQlNDUklCRSk7XG4gICAgICAgICAgICB3aXJlTWVzc2FnZS50b3BpY3MgPSBmaWx0ZXIuY29uc3RydWN0b3IgPT09IEFycmF5ID8gZmlsdGVyIDogW2ZpbHRlcl07XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlT3B0aW9ucy5xb3MgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVPcHRpb25zLnFvcyA9IDA7XG4gICAgICAgICAgICB3aXJlTWVzc2FnZS5yZXF1ZXN0ZWRRb3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lyZU1lc3NhZ2UudG9waWNzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIHdpcmVNZXNzYWdlLnJlcXVlc3RlZFFvc1tpXSA9IHN1YnNjcmliZU9wdGlvbnMucW9zO1xuXG5cdFx0XHRpZiAoc3Vic2NyaWJlT3B0aW9ucy5vblN1Y2Nlc3MpIHtcblx0XHRcdFx0d2lyZU1lc3NhZ2Uub25TdWNjZXNzID0gZnVuY3Rpb24oZ3JhbnRlZFFvcykge3N1YnNjcmliZU9wdGlvbnMub25TdWNjZXNzKHtpbnZvY2F0aW9uQ29udGV4dDpzdWJzY3JpYmVPcHRpb25zLmludm9jYXRpb25Db250ZXh0LGdyYW50ZWRRb3M6Z3JhbnRlZFFvc30pO307XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdWJzY3JpYmVPcHRpb25zLm9uRmFpbHVyZSkge1xuXHRcdFx0XHR3aXJlTWVzc2FnZS5vbkZhaWx1cmUgPSBmdW5jdGlvbihlcnJvckNvZGUpIHtzdWJzY3JpYmVPcHRpb25zLm9uRmFpbHVyZSh7aW52b2NhdGlvbkNvbnRleHQ6c3Vic2NyaWJlT3B0aW9ucy5pbnZvY2F0aW9uQ29udGV4dCxlcnJvckNvZGU6ZXJyb3JDb2RlLCBlcnJvck1lc3NhZ2U6Zm9ybWF0KGVycm9yQ29kZSl9KTt9O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3Vic2NyaWJlT3B0aW9ucy50aW1lb3V0KSB7XG5cdFx0XHRcdHdpcmVNZXNzYWdlLnRpbWVPdXQgPSBuZXcgVGltZW91dCh0aGlzLCBzdWJzY3JpYmVPcHRpb25zLnRpbWVvdXQsIHN1YnNjcmliZU9wdGlvbnMub25GYWlsdXJlLFxuXHRcdFx0XHRcdFt7aW52b2NhdGlvbkNvbnRleHQ6c3Vic2NyaWJlT3B0aW9ucy5pbnZvY2F0aW9uQ29udGV4dCxcblx0XHRcdFx0XHRcdGVycm9yQ29kZTpFUlJPUi5TVUJTQ1JJQkVfVElNRU9VVC5jb2RlLFxuXHRcdFx0XHRcdFx0ZXJyb3JNZXNzYWdlOmZvcm1hdChFUlJPUi5TVUJTQ1JJQkVfVElNRU9VVCl9XSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFsbCBzdWJzY3JpcHRpb25zIHJldHVybiBhIFNVQkFDSy5cblx0XHRcdHRoaXMuX3JlcXVpcmVzX2Fjayh3aXJlTWVzc2FnZSk7XG5cdFx0XHR0aGlzLl9zY2hlZHVsZV9tZXNzYWdlKHdpcmVNZXNzYWdlKTtcblx0XHR9O1xuXG5cdFx0LyoqIEBpZ25vcmUgKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGZpbHRlciwgdW5zdWJzY3JpYmVPcHRpb25zKSB7XG5cdFx0XHR0aGlzLl90cmFjZShcIkNsaWVudC51bnN1YnNjcmliZVwiLCBmaWx0ZXIsIHVuc3Vic2NyaWJlT3B0aW9ucyk7XG5cblx0XHRcdGlmICghdGhpcy5jb25uZWN0ZWQpXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9TVEFURSwgW1wibm90IGNvbm5lY3RlZFwiXSkpO1xuXG4gICAgICAgICAgICB2YXIgd2lyZU1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlVOU1VCU0NSSUJFKTtcbiAgICAgICAgICAgIHdpcmVNZXNzYWdlLnRvcGljcyA9IGZpbHRlci5jb25zdHJ1Y3RvciA9PT0gQXJyYXkgPyBmaWx0ZXIgOiBbZmlsdGVyXTtcblxuXHRcdFx0aWYgKHVuc3Vic2NyaWJlT3B0aW9ucy5vblN1Y2Nlc3MpIHtcblx0XHRcdFx0d2lyZU1lc3NhZ2UuY2FsbGJhY2sgPSBmdW5jdGlvbigpIHt1bnN1YnNjcmliZU9wdGlvbnMub25TdWNjZXNzKHtpbnZvY2F0aW9uQ29udGV4dDp1bnN1YnNjcmliZU9wdGlvbnMuaW52b2NhdGlvbkNvbnRleHR9KTt9O1xuXHRcdFx0fVxuXHRcdFx0aWYgKHVuc3Vic2NyaWJlT3B0aW9ucy50aW1lb3V0KSB7XG5cdFx0XHRcdHdpcmVNZXNzYWdlLnRpbWVPdXQgPSBuZXcgVGltZW91dCh0aGlzLCB1bnN1YnNjcmliZU9wdGlvbnMudGltZW91dCwgdW5zdWJzY3JpYmVPcHRpb25zLm9uRmFpbHVyZSxcblx0XHRcdFx0XHRbe2ludm9jYXRpb25Db250ZXh0OnVuc3Vic2NyaWJlT3B0aW9ucy5pbnZvY2F0aW9uQ29udGV4dCxcblx0XHRcdFx0XHRcdGVycm9yQ29kZTpFUlJPUi5VTlNVQlNDUklCRV9USU1FT1VULmNvZGUsXG5cdFx0XHRcdFx0XHRlcnJvck1lc3NhZ2U6Zm9ybWF0KEVSUk9SLlVOU1VCU0NSSUJFX1RJTUVPVVQpfV0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBbGwgdW5zdWJzY3JpYmVzIHJldHVybiBhIFNVQkFDSy5cblx0XHRcdHRoaXMuX3JlcXVpcmVzX2Fjayh3aXJlTWVzc2FnZSk7XG5cdFx0XHR0aGlzLl9zY2hlZHVsZV9tZXNzYWdlKHdpcmVNZXNzYWdlKTtcblx0XHR9O1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHR0aGlzLl90cmFjZShcIkNsaWVudC5zZW5kXCIsIG1lc3NhZ2UpO1xuXG5cdFx0XHR2YXIgd2lyZU1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlBVQkxJU0gpO1xuXHRcdFx0d2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UgPSBtZXNzYWdlO1xuXG5cdFx0XHRpZiAodGhpcy5jb25uZWN0ZWQpIHtcblx0XHRcdC8vIE1hcmsgcW9zIDEgJiAyIG1lc3NhZ2UgYXMgXCJBQ0sgcmVxdWlyZWRcIlxuXHRcdFx0Ly8gRm9yIHFvcyAwIG1lc3NhZ2UsIGludm9rZSBvbk1lc3NhZ2VEZWxpdmVyZWQgY2FsbGJhY2sgaWYgdGhlcmUgaXMgb25lLlxuXHRcdFx0Ly8gVGhlbiBzY2hlZHVsZSB0aGUgbWVzc2FnZS5cblx0XHRcdFx0aWYgKG1lc3NhZ2UucW9zID4gMCkge1xuXHRcdFx0XHRcdHRoaXMuX3JlcXVpcmVzX2Fjayh3aXJlTWVzc2FnZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5vbk1lc3NhZ2VEZWxpdmVyZWQpIHtcblx0XHRcdFx0XHR0aGlzLl9ub3RpZnlfbXNnX3NlbnRbd2lyZU1lc3NhZ2VdID0gdGhpcy5vbk1lc3NhZ2VEZWxpdmVyZWQod2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX3NjaGVkdWxlX21lc3NhZ2Uod2lyZU1lc3NhZ2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdC8vIEN1cnJlbnRseSBkaXNjb25uZWN0ZWQsIHdpbGwgbm90IHNjaGVkdWxlIHRoaXMgbWVzc2FnZVxuXHRcdFx0Ly8gQ2hlY2sgaWYgcmVjb25uZWN0aW5nIGlzIGluIHByb2dyZXNzIGFuZCBkaXNjb25uZWN0ZWQgcHVibGlzaCBpcyBlbmFibGVkLlxuXHRcdFx0XHRpZiAodGhpcy5fcmVjb25uZWN0aW5nICYmIHRoaXMuZGlzY29ubmVjdGVkUHVibGlzaGluZykge1xuXHRcdFx0XHQvLyBDaGVjayB0aGUgbGltaXQgd2hpY2ggaW5jbHVkZSB0aGUgXCJyZXF1aXJlZCBBQ0tcIiBtZXNzYWdlc1xuXHRcdFx0XHRcdHZhciBtZXNzYWdlQ291bnQgPSBPYmplY3Qua2V5cyh0aGlzLl9zZW50TWVzc2FnZXMpLmxlbmd0aCArIHRoaXMuX2J1ZmZlcmVkX21zZ19xdWV1ZS5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2VDb3VudCA+IHRoaXMuZGlzY29ubmVjdGVkQnVmZmVyU2l6ZSkge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5CVUZGRVJfRlVMTCwgW3RoaXMuZGlzY29ubmVjdGVkQnVmZmVyU2l6ZV0pKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UucW9zID4gMCkge1xuXHRcdFx0XHRcdFx0Ly8gTWFyayB0aGlzIG1lc3NhZ2UgYXMgXCJBQ0sgcmVxdWlyZWRcIlxuXHRcdFx0XHRcdFx0XHR0aGlzLl9yZXF1aXJlc19hY2sod2lyZU1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0d2lyZU1lc3NhZ2Uuc2VxdWVuY2UgPSArK3RoaXMuX3NlcXVlbmNlO1xuXHRcdFx0XHRcdFx0XHQvLyBBZGQgbWVzc2FnZXMgaW4gZmlmbyBvcmRlciB0byBhcnJheSwgYnkgYWRkaW5nIHRvIHN0YXJ0XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2J1ZmZlcmVkX21zZ19xdWV1ZS51bnNoaWZ0KHdpcmVNZXNzYWdlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX1NUQVRFLCBbXCJub3QgY29ubmVjdGVkXCJdKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuX3RyYWNlKFwiQ2xpZW50LmRpc2Nvbm5lY3RcIik7XG5cblx0XHRcdGlmICh0aGlzLl9yZWNvbm5lY3RpbmcpIHtcblx0XHRcdC8vIGRpc2Nvbm5lY3QoKSBmdW5jdGlvbiBpcyBjYWxsZWQgd2hpbGUgcmVjb25uZWN0IGlzIGluIHByb2dyZXNzLlxuXHRcdFx0Ly8gVGVybWluYXRlIHRoZSBhdXRvIHJlY29ubmVjdCBwcm9jZXNzLlxuXHRcdFx0XHR0aGlzLl9yZWNvbm5lY3RUaW1lb3V0LmNhbmNlbCgpO1xuXHRcdFx0XHR0aGlzLl9yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblx0XHRcdFx0dGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5zb2NrZXQpXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9TVEFURSwgW1wibm90IGNvbm5lY3Rpbmcgb3IgY29ubmVjdGVkXCJdKSk7XG5cblx0XHRcdHZhciB3aXJlTWVzc2FnZSA9IG5ldyBXaXJlTWVzc2FnZShNRVNTQUdFX1RZUEUuRElTQ09OTkVDVCk7XG5cblx0XHRcdC8vIFJ1biB0aGUgZGlzY29ubmVjdGVkIGNhbGwgYmFjayBhcyBzb29uIGFzIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQsXG5cdFx0XHQvLyBpbiBjYXNlIG9mIGEgZmFpbHVyZSBsYXRlciBvbiBpbiB0aGUgZGlzY29ubmVjdCBwcm9jZXNzaW5nLlxuXHRcdFx0Ly8gYXMgYSBjb25zZXF1ZW5jZSwgdGhlIF9kaXNjb25lY3RlZCBjYWxsIGJhY2sgbWF5IGJlIHJ1biBzZXZlcmFsIHRpbWVzLlxuXHRcdFx0dGhpcy5fbm90aWZ5X21zZ19zZW50W3dpcmVNZXNzYWdlXSA9IHNjb3BlKHRoaXMuX2Rpc2Nvbm5lY3RlZCwgdGhpcyk7XG5cblx0XHRcdHRoaXMuX3NjaGVkdWxlX21lc3NhZ2Uod2lyZU1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5nZXRUcmFjZUxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICggdGhpcy5fdHJhY2VCdWZmZXIgIT09IG51bGwgKSB7XG5cdFx0XHRcdHRoaXMuX3RyYWNlKFwiQ2xpZW50LmdldFRyYWNlTG9nXCIsIG5ldyBEYXRlKCkpO1xuXHRcdFx0XHR0aGlzLl90cmFjZShcIkNsaWVudC5nZXRUcmFjZUxvZyBpbiBmbGlnaHQgbWVzc2FnZXNcIiwgdGhpcy5fc2VudE1lc3NhZ2VzLmxlbmd0aCk7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiB0aGlzLl9zZW50TWVzc2FnZXMpXG5cdFx0XHRcdFx0dGhpcy5fdHJhY2UoXCJfc2VudE1lc3NhZ2VzIFwiLGtleSwgdGhpcy5fc2VudE1lc3NhZ2VzW2tleV0pO1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fcmVjZWl2ZWRNZXNzYWdlcylcblx0XHRcdFx0XHR0aGlzLl90cmFjZShcIl9yZWNlaXZlZE1lc3NhZ2VzIFwiLGtleSwgdGhpcy5fcmVjZWl2ZWRNZXNzYWdlc1trZXldKTtcblxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdHJhY2VCdWZmZXI7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnN0YXJ0VHJhY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIHRoaXMuX3RyYWNlQnVmZmVyID09PSBudWxsICkge1xuXHRcdFx0XHR0aGlzLl90cmFjZUJ1ZmZlciA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5fdHJhY2UoXCJDbGllbnQuc3RhcnRUcmFjZVwiLCBuZXcgRGF0ZSgpLCB2ZXJzaW9uKTtcblx0XHR9O1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuc3RvcFRyYWNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuX3RyYWNlQnVmZmVyO1xuXHRcdH07XG5cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5fZG9Db25uZWN0ID0gZnVuY3Rpb24gKHdzdXJsKSB7XG5cdFx0Ly8gV2hlbiB0aGUgc29ja2V0IGlzIG9wZW4sIHRoaXMgY2xpZW50IHdpbGwgc2VuZCB0aGUgQ09OTkVDVCBXaXJlTWVzc2FnZSB1c2luZyB0aGUgc2F2ZWQgcGFyYW1ldGVycy5cblx0XHRcdGlmICh0aGlzLmNvbm5lY3RPcHRpb25zLnVzZVNTTCkge1xuXHRcdFx0XHR2YXIgdXJpUGFydHMgPSB3c3VybC5zcGxpdChcIjpcIik7XG5cdFx0XHRcdHVyaVBhcnRzWzBdID0gXCJ3c3NcIjtcblx0XHRcdFx0d3N1cmwgPSB1cmlQYXJ0cy5qb2luKFwiOlwiKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX3dzdXJpID0gd3N1cmw7XG5cdFx0XHR0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuXG5cblxuXHRcdFx0aWYgKHRoaXMuY29ubmVjdE9wdGlvbnMubXF0dFZlcnNpb24gPCA0KSB7XG5cdFx0XHRcdHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldCh3c3VybCwgW1wibXF0dHYzLjFcIl0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KHdzdXJsLCBbXCJtcXR0XCJdKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc29ja2V0LmJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG5cdFx0XHR0aGlzLnNvY2tldC5vbm9wZW4gPSBzY29wZSh0aGlzLl9vbl9zb2NrZXRfb3BlbiwgdGhpcyk7XG5cdFx0XHR0aGlzLnNvY2tldC5vbm1lc3NhZ2UgPSBzY29wZSh0aGlzLl9vbl9zb2NrZXRfbWVzc2FnZSwgdGhpcyk7XG5cdFx0XHR0aGlzLnNvY2tldC5vbmVycm9yID0gc2NvcGUodGhpcy5fb25fc29ja2V0X2Vycm9yLCB0aGlzKTtcblx0XHRcdHRoaXMuc29ja2V0Lm9uY2xvc2UgPSBzY29wZSh0aGlzLl9vbl9zb2NrZXRfY2xvc2UsIHRoaXMpO1xuXG5cdFx0XHR0aGlzLnNlbmRQaW5nZXIgPSBuZXcgUGluZ2VyKHRoaXMsIHRoaXMuY29ubmVjdE9wdGlvbnMua2VlcEFsaXZlSW50ZXJ2YWwpO1xuXHRcdFx0dGhpcy5yZWNlaXZlUGluZ2VyID0gbmV3IFBpbmdlcih0aGlzLCB0aGlzLmNvbm5lY3RPcHRpb25zLmtlZXBBbGl2ZUludGVydmFsKTtcblx0XHRcdGlmICh0aGlzLl9jb25uZWN0VGltZW91dCkge1xuXHRcdFx0XHR0aGlzLl9jb25uZWN0VGltZW91dC5jYW5jZWwoKTtcblx0XHRcdFx0dGhpcy5fY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5fY29ubmVjdFRpbWVvdXQgPSBuZXcgVGltZW91dCh0aGlzLCB0aGlzLmNvbm5lY3RPcHRpb25zLnRpbWVvdXQsIHRoaXMuX2Rpc2Nvbm5lY3RlZCwgIFtFUlJPUi5DT05ORUNUX1RJTUVPVVQuY29kZSwgZm9ybWF0KEVSUk9SLkNPTk5FQ1RfVElNRU9VVCldKTtcblx0XHR9O1xuXG5cblx0XHQvLyBTY2hlZHVsZSBhIG5ldyBtZXNzYWdlIHRvIGJlIHNlbnQgb3ZlciB0aGUgV2ViU29ja2V0c1xuXHRcdC8vIGNvbm5lY3Rpb24uIENPTk5FQ1QgbWVzc2FnZXMgY2F1c2UgV2ViU29ja2V0IGNvbm5lY3Rpb25cblx0XHQvLyB0byBiZSBzdGFydGVkLiBBbGwgb3RoZXIgbWVzc2FnZXMgYXJlIHF1ZXVlZCBpbnRlcm5hbGx5XG5cdFx0Ly8gdW50aWwgdGhpcyBoYXMgaGFwcGVuZWQuIFdoZW4gV1MgY29ubmVjdGlvbiBzdGFydHMsIHByb2Nlc3Ncblx0XHQvLyBhbGwgb3V0c3RhbmRpbmcgbWVzc2FnZXMuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX3NjaGVkdWxlX21lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0Ly8gQWRkIG1lc3NhZ2VzIGluIGZpZm8gb3JkZXIgdG8gYXJyYXksIGJ5IGFkZGluZyB0byBzdGFydFxuXHRcdFx0dGhpcy5fbXNnX3F1ZXVlLnVuc2hpZnQobWVzc2FnZSk7XG5cdFx0XHQvLyBQcm9jZXNzIG91dHN0YW5kaW5nIG1lc3NhZ2VzIGluIHRoZSBxdWV1ZSBpZiB3ZSBoYXZlIGFuICBvcGVuIHNvY2tldCwgYW5kIGhhdmUgcmVjZWl2ZWQgQ09OTkFDSy5cblx0XHRcdGlmICh0aGlzLmNvbm5lY3RlZCkge1xuXHRcdFx0XHR0aGlzLl9wcm9jZXNzX3F1ZXVlKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnN0b3JlID0gZnVuY3Rpb24ocHJlZml4LCB3aXJlTWVzc2FnZSkge1xuXHRcdFx0dmFyIHN0b3JlZE1lc3NhZ2UgPSB7dHlwZTp3aXJlTWVzc2FnZS50eXBlLCBtZXNzYWdlSWRlbnRpZmllcjp3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllciwgdmVyc2lvbjoxfTtcblxuXHRcdFx0c3dpdGNoKHdpcmVNZXNzYWdlLnR5cGUpIHtcblx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlBVQkxJU0g6XG5cdFx0XHRcdGlmKHdpcmVNZXNzYWdlLnB1YlJlY1JlY2VpdmVkKVxuXHRcdFx0XHRcdHN0b3JlZE1lc3NhZ2UucHViUmVjUmVjZWl2ZWQgPSB0cnVlO1xuXG5cdFx0XHRcdC8vIENvbnZlcnQgdGhlIHBheWxvYWQgdG8gYSBoZXggc3RyaW5nLlxuXHRcdFx0XHRzdG9yZWRNZXNzYWdlLnBheWxvYWRNZXNzYWdlID0ge307XG5cdFx0XHRcdHZhciBoZXggPSBcIlwiO1xuXHRcdFx0XHR2YXIgbWVzc2FnZUJ5dGVzID0gd2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UucGF5bG9hZEJ5dGVzO1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8bWVzc2FnZUJ5dGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2VCeXRlc1tpXSA8PSAweEYpXG5cdFx0XHRcdFx0XHRoZXggPSBoZXgrXCIwXCIrbWVzc2FnZUJ5dGVzW2ldLnRvU3RyaW5nKDE2KTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRoZXggPSBoZXgrbWVzc2FnZUJ5dGVzW2ldLnRvU3RyaW5nKDE2KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzdG9yZWRNZXNzYWdlLnBheWxvYWRNZXNzYWdlLnBheWxvYWRIZXggPSBoZXg7XG5cblx0XHRcdFx0c3RvcmVkTWVzc2FnZS5wYXlsb2FkTWVzc2FnZS5xb3MgPSB3aXJlTWVzc2FnZS5wYXlsb2FkTWVzc2FnZS5xb3M7XG5cdFx0XHRcdHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UuZGVzdGluYXRpb25OYW1lID0gd2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UuZGVzdGluYXRpb25OYW1lO1xuXHRcdFx0XHRpZiAod2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UuZHVwbGljYXRlKVxuXHRcdFx0XHRcdHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UuZHVwbGljYXRlID0gdHJ1ZTtcblx0XHRcdFx0aWYgKHdpcmVNZXNzYWdlLnBheWxvYWRNZXNzYWdlLnJldGFpbmVkKVxuXHRcdFx0XHRcdHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UucmV0YWluZWQgPSB0cnVlO1xuXG5cdFx0XHRcdC8vIEFkZCBhIHNlcXVlbmNlIG51bWJlciB0byBzZW50IG1lc3NhZ2VzLlxuXHRcdFx0XHRpZiAoIHByZWZpeC5pbmRleE9mKFwiU2VudDpcIikgPT09IDAgKSB7XG5cdFx0XHRcdFx0aWYgKCB3aXJlTWVzc2FnZS5zZXF1ZW5jZSA9PT0gdW5kZWZpbmVkIClcblx0XHRcdFx0XHRcdHdpcmVNZXNzYWdlLnNlcXVlbmNlID0gKyt0aGlzLl9zZXF1ZW5jZTtcblx0XHRcdFx0XHRzdG9yZWRNZXNzYWdlLnNlcXVlbmNlID0gd2lyZU1lc3NhZ2Uuc2VxdWVuY2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX1NUT1JFRF9EQVRBLCBbcHJlZml4K3RoaXMuX2xvY2FsS2V5K3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyLCBzdG9yZWRNZXNzYWdlXSkpO1xuXHRcdFx0fVxuXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJlZml4K3RoaXMuX2xvY2FsS2V5K3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyLCBKU09OLnN0cmluZ2lmeShzdG9yZWRNZXNzYWdlKSk7XG5cdFx0fTtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLnJlc3RvcmUgPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdHZhciB2YWx1ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG5cdFx0XHR2YXIgc3RvcmVkTWVzc2FnZSA9IEpTT04ucGFyc2UodmFsdWUpO1xuXG5cdFx0XHR2YXIgd2lyZU1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2Uoc3RvcmVkTWVzc2FnZS50eXBlLCBzdG9yZWRNZXNzYWdlKTtcblxuXHRcdFx0c3dpdGNoKHN0b3JlZE1lc3NhZ2UudHlwZSkge1xuXHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuUFVCTElTSDpcblx0XHRcdFx0Ly8gUmVwbGFjZSB0aGUgcGF5bG9hZCBtZXNzYWdlIHdpdGggYSBNZXNzYWdlIG9iamVjdC5cblx0XHRcdFx0dmFyIGhleCA9IHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UucGF5bG9hZEhleDtcblx0XHRcdFx0dmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigoaGV4Lmxlbmd0aCkvMik7XG5cdFx0XHRcdHZhciBieXRlU3RyZWFtID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcblx0XHRcdFx0dmFyIGkgPSAwO1xuXHRcdFx0XHR3aGlsZSAoaGV4Lmxlbmd0aCA+PSAyKSB7XG5cdFx0XHRcdFx0dmFyIHggPSBwYXJzZUludChoZXguc3Vic3RyaW5nKDAsIDIpLCAxNik7XG5cdFx0XHRcdFx0aGV4ID0gaGV4LnN1YnN0cmluZygyLCBoZXgubGVuZ3RoKTtcblx0XHRcdFx0XHRieXRlU3RyZWFtW2krK10gPSB4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBwYXlsb2FkTWVzc2FnZSA9IG5ldyBNZXNzYWdlKGJ5dGVTdHJlYW0pO1xuXG5cdFx0XHRcdHBheWxvYWRNZXNzYWdlLnFvcyA9IHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UucW9zO1xuXHRcdFx0XHRwYXlsb2FkTWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUgPSBzdG9yZWRNZXNzYWdlLnBheWxvYWRNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZTtcblx0XHRcdFx0aWYgKHN0b3JlZE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UuZHVwbGljYXRlKVxuXHRcdFx0XHRcdHBheWxvYWRNZXNzYWdlLmR1cGxpY2F0ZSA9IHRydWU7XG5cdFx0XHRcdGlmIChzdG9yZWRNZXNzYWdlLnBheWxvYWRNZXNzYWdlLnJldGFpbmVkKVxuXHRcdFx0XHRcdHBheWxvYWRNZXNzYWdlLnJldGFpbmVkID0gdHJ1ZTtcblx0XHRcdFx0d2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UgPSBwYXlsb2FkTWVzc2FnZTtcblxuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfU1RPUkVEX0RBVEEsIFtrZXksIHZhbHVlXSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoa2V5LmluZGV4T2YoXCJTZW50OlwiK3RoaXMuX2xvY2FsS2V5KSA9PT0gMCkge1xuXHRcdFx0XHR3aXJlTWVzc2FnZS5wYXlsb2FkTWVzc2FnZS5kdXBsaWNhdGUgPSB0cnVlO1xuXHRcdFx0XHR0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdID0gd2lyZU1lc3NhZ2U7XG5cdFx0XHR9IGVsc2UgaWYgKGtleS5pbmRleE9mKFwiUmVjZWl2ZWQ6XCIrdGhpcy5fbG9jYWxLZXkpID09PSAwKSB7XG5cdFx0XHRcdHRoaXMuX3JlY2VpdmVkTWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdID0gd2lyZU1lc3NhZ2U7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9wcm9jZXNzX3F1ZXVlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG1lc3NhZ2UgPSBudWxsO1xuXG5cdFx0XHQvLyBTZW5kIGFsbCBxdWV1ZWQgbWVzc2FnZXMgZG93biBzb2NrZXQgY29ubmVjdGlvblxuXHRcdFx0d2hpbGUgKChtZXNzYWdlID0gdGhpcy5fbXNnX3F1ZXVlLnBvcCgpKSkge1xuXHRcdFx0XHR0aGlzLl9zb2NrZXRfc2VuZChtZXNzYWdlKTtcblx0XHRcdFx0Ly8gTm90aWZ5IGxpc3RlbmVycyB0aGF0IG1lc3NhZ2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZW50XG5cdFx0XHRcdGlmICh0aGlzLl9ub3RpZnlfbXNnX3NlbnRbbWVzc2FnZV0pIHtcblx0XHRcdFx0XHR0aGlzLl9ub3RpZnlfbXNnX3NlbnRbbWVzc2FnZV0oKTtcblx0XHRcdFx0XHRkZWxldGUgdGhpcy5fbm90aWZ5X21zZ19zZW50W21lc3NhZ2VdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHQgKiBFeHBlY3QgYW4gQUNLIHJlc3BvbnNlIGZvciB0aGlzIG1lc3NhZ2UuIEFkZCBtZXNzYWdlIHRvIHRoZSBzZXQgb2YgaW4gcHJvZ3Jlc3Ncblx0ICogbWVzc2FnZXMgYW5kIHNldCBhbiB1bnVzZWQgaWRlbnRpZmllciBpbiB0aGlzIG1lc3NhZ2UuXG5cdCAqIEBpZ25vcmVcblx0ICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX3JlcXVpcmVzX2FjayA9IGZ1bmN0aW9uICh3aXJlTWVzc2FnZSkge1xuXHRcdFx0dmFyIG1lc3NhZ2VDb3VudCA9IE9iamVjdC5rZXlzKHRoaXMuX3NlbnRNZXNzYWdlcykubGVuZ3RoO1xuXHRcdFx0aWYgKG1lc3NhZ2VDb3VudCA+IHRoaXMubWF4TWVzc2FnZUlkZW50aWZpZXIpXG5cdFx0XHRcdHRocm93IEVycm9yIChcIlRvbyBtYW55IG1lc3NhZ2VzOlwiK21lc3NhZ2VDb3VudCk7XG5cblx0XHRcdHdoaWxlKHRoaXMuX3NlbnRNZXNzYWdlc1t0aGlzLl9tZXNzYWdlX2lkZW50aWZpZXJdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGhpcy5fbWVzc2FnZV9pZGVudGlmaWVyKys7XG5cdFx0XHR9XG5cdFx0XHR3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllciA9IHRoaXMuX21lc3NhZ2VfaWRlbnRpZmllcjtcblx0XHRcdHRoaXMuX3NlbnRNZXNzYWdlc1t3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllcl0gPSB3aXJlTWVzc2FnZTtcblx0XHRcdGlmICh3aXJlTWVzc2FnZS50eXBlID09PSBNRVNTQUdFX1RZUEUuUFVCTElTSCkge1xuXHRcdFx0XHR0aGlzLnN0b3JlKFwiU2VudDpcIiwgd2lyZU1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuX21lc3NhZ2VfaWRlbnRpZmllciA9PT0gdGhpcy5tYXhNZXNzYWdlSWRlbnRpZmllcikge1xuXHRcdFx0XHR0aGlzLl9tZXNzYWdlX2lkZW50aWZpZXIgPSAxO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0ICogQ2FsbGVkIHdoZW4gdGhlIHVuZGVybHlpbmcgd2Vic29ja2V0IGhhcyBiZWVuIG9wZW5lZC5cblx0ICogQGlnbm9yZVxuXHQgKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5fb25fc29ja2V0X29wZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gQ3JlYXRlIHRoZSBDT05ORUNUIG1lc3NhZ2Ugb2JqZWN0LlxuXHRcdFx0dmFyIHdpcmVNZXNzYWdlID0gbmV3IFdpcmVNZXNzYWdlKE1FU1NBR0VfVFlQRS5DT05ORUNULCB0aGlzLmNvbm5lY3RPcHRpb25zKTtcblx0XHRcdHdpcmVNZXNzYWdlLmNsaWVudElkID0gdGhpcy5jbGllbnRJZDtcblx0XHRcdHRoaXMuX3NvY2tldF9zZW5kKHdpcmVNZXNzYWdlKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdCAqIENhbGxlZCB3aGVuIHRoZSB1bmRlcmx5aW5nIHdlYnNvY2tldCBoYXMgcmVjZWl2ZWQgYSBjb21wbGV0ZSBwYWNrZXQuXG5cdCAqIEBpZ25vcmVcblx0ICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX29uX3NvY2tldF9tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0XHR0aGlzLl90cmFjZShcIkNsaWVudC5fb25fc29ja2V0X21lc3NhZ2VcIiwgZXZlbnQuZGF0YSk7XG5cdFx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLl9kZWZyYW1lTWVzc2FnZXMoZXZlbnQuZGF0YSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VzLmxlbmd0aDsgaSs9MSkge1xuXHRcdFx0XHR0aGlzLl9oYW5kbGVNZXNzYWdlKG1lc3NhZ2VzW2ldKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX2RlZnJhbWVNZXNzYWdlcyA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHZhciBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShkYXRhKTtcblx0XHRcdHZhciBtZXNzYWdlcyA9IFtdO1xuXHRcdFx0aWYgKHRoaXMucmVjZWl2ZUJ1ZmZlcikge1xuXHRcdFx0XHR2YXIgbmV3RGF0YSA9IG5ldyBVaW50OEFycmF5KHRoaXMucmVjZWl2ZUJ1ZmZlci5sZW5ndGgrYnl0ZUFycmF5Lmxlbmd0aCk7XG5cdFx0XHRcdG5ld0RhdGEuc2V0KHRoaXMucmVjZWl2ZUJ1ZmZlcik7XG5cdFx0XHRcdG5ld0RhdGEuc2V0KGJ5dGVBcnJheSx0aGlzLnJlY2VpdmVCdWZmZXIubGVuZ3RoKTtcblx0XHRcdFx0Ynl0ZUFycmF5ID0gbmV3RGF0YTtcblx0XHRcdFx0ZGVsZXRlIHRoaXMucmVjZWl2ZUJ1ZmZlcjtcblx0XHRcdH1cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHZhciBvZmZzZXQgPSAwO1xuXHRcdFx0XHR3aGlsZShvZmZzZXQgPCBieXRlQXJyYXkubGVuZ3RoKSB7XG5cdFx0XHRcdFx0dmFyIHJlc3VsdCA9IGRlY29kZU1lc3NhZ2UoYnl0ZUFycmF5LG9mZnNldCk7XG5cdFx0XHRcdFx0dmFyIHdpcmVNZXNzYWdlID0gcmVzdWx0WzBdO1xuXHRcdFx0XHRcdG9mZnNldCA9IHJlc3VsdFsxXTtcblx0XHRcdFx0XHRpZiAod2lyZU1lc3NhZ2UgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2VzLnB1c2god2lyZU1lc3NhZ2UpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG9mZnNldCA8IGJ5dGVBcnJheS5sZW5ndGgpIHtcblx0XHRcdFx0XHR0aGlzLnJlY2VpdmVCdWZmZXIgPSBieXRlQXJyYXkuc3ViYXJyYXkob2Zmc2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0dmFyIGVycm9yU3RhY2sgPSAoKGVycm9yLmhhc093blByb3BlcnR5KFwic3RhY2tcIikgPT0gXCJ1bmRlZmluZWRcIikgPyBlcnJvci5zdGFjay50b1N0cmluZygpIDogXCJObyBFcnJvciBTdGFjayBBdmFpbGFibGVcIik7XG5cdFx0XHRcdHRoaXMuX2Rpc2Nvbm5lY3RlZChFUlJPUi5JTlRFUk5BTF9FUlJPUi5jb2RlICwgZm9ybWF0KEVSUk9SLklOVEVSTkFMX0VSUk9SLCBbZXJyb3IubWVzc2FnZSxlcnJvclN0YWNrXSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWVzc2FnZXM7XG5cdFx0fTtcblxuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9oYW5kbGVNZXNzYWdlID0gZnVuY3Rpb24od2lyZU1lc3NhZ2UpIHtcblxuXHRcdFx0dGhpcy5fdHJhY2UoXCJDbGllbnQuX2hhbmRsZU1lc3NhZ2VcIiwgd2lyZU1lc3NhZ2UpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzd2l0Y2god2lyZU1lc3NhZ2UudHlwZSkge1xuXHRcdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5DT05OQUNLOlxuXHRcdFx0XHRcdHRoaXMuX2Nvbm5lY3RUaW1lb3V0LmNhbmNlbCgpO1xuXHRcdFx0XHRcdGlmICh0aGlzLl9yZWNvbm5lY3RUaW1lb3V0KVxuXHRcdFx0XHRcdFx0dGhpcy5fcmVjb25uZWN0VGltZW91dC5jYW5jZWwoKTtcblxuXHRcdFx0XHRcdC8vIElmIHdlIGhhdmUgc3RhcnRlZCB1c2luZyBjbGVhbiBzZXNzaW9uIHRoZW4gY2xlYXIgdXAgdGhlIGxvY2FsIHN0YXRlLlxuXHRcdFx0XHRcdGlmICh0aGlzLmNvbm5lY3RPcHRpb25zLmNsZWFuU2Vzc2lvbikge1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIga2V5IGluIHRoaXMuX3NlbnRNZXNzYWdlcykge1xuXHRcdFx0XHRcdFx0XHR2YXIgc2VudE1lc3NhZ2UgPSB0aGlzLl9zZW50TWVzc2FnZXNba2V5XTtcblx0XHRcdFx0XHRcdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oXCJTZW50OlwiK3RoaXMuX2xvY2FsS2V5K3NlbnRNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHRoaXMuX3NlbnRNZXNzYWdlcyA9IHt9O1xuXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fcmVjZWl2ZWRNZXNzYWdlcykge1xuXHRcdFx0XHRcdFx0XHR2YXIgcmVjZWl2ZWRNZXNzYWdlID0gdGhpcy5fcmVjZWl2ZWRNZXNzYWdlc1trZXldO1xuXHRcdFx0XHRcdFx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcIlJlY2VpdmVkOlwiK3RoaXMuX2xvY2FsS2V5K3JlY2VpdmVkTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLl9yZWNlaXZlZE1lc3NhZ2VzID0ge307XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENsaWVudCBjb25uZWN0ZWQgYW5kIHJlYWR5IGZvciBidXNpbmVzcy5cblx0XHRcdFx0XHRpZiAod2lyZU1lc3NhZ2UucmV0dXJuQ29kZSA9PT0gMCkge1xuXG5cdFx0XHRcdFx0XHR0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHQvLyBKdW1wIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3Qgb2YgdXJpcyBhbmQgc3RvcCBsb29raW5nIGZvciBhIGdvb2QgaG9zdC5cblxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuY29ubmVjdE9wdGlvbnMudXJpcylcblx0XHRcdFx0XHRcdFx0dGhpcy5ob3N0SW5kZXggPSB0aGlzLmNvbm5lY3RPcHRpb25zLnVyaXMubGVuZ3RoO1xuXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuX2Rpc2Nvbm5lY3RlZChFUlJPUi5DT05OQUNLX1JFVFVSTkNPREUuY29kZSAsIGZvcm1hdChFUlJPUi5DT05OQUNLX1JFVFVSTkNPREUsIFt3aXJlTWVzc2FnZS5yZXR1cm5Db2RlLCBDT05OQUNLX1JDW3dpcmVNZXNzYWdlLnJldHVybkNvZGVdXSkpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gUmVzZW5kIG1lc3NhZ2VzLlxuXHRcdFx0XHRcdHZhciBzZXF1ZW5jZWRNZXNzYWdlcyA9IFtdO1xuXHRcdFx0XHRcdGZvciAodmFyIG1zZ0lkIGluIHRoaXMuX3NlbnRNZXNzYWdlcykge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuX3NlbnRNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShtc2dJZCkpXG5cdFx0XHRcdFx0XHRcdHNlcXVlbmNlZE1lc3NhZ2VzLnB1c2godGhpcy5fc2VudE1lc3NhZ2VzW21zZ0lkXSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQWxzbyBzY2hlZHVsZSBxb3MgMCBidWZmZXJlZCBtZXNzYWdlcyBpZiBhbnlcblx0XHRcdFx0XHRpZiAodGhpcy5fYnVmZmVyZWRfbXNnX3F1ZXVlLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdHZhciBtc2cgPSBudWxsO1xuXHRcdFx0XHRcdFx0d2hpbGUgKChtc2cgPSB0aGlzLl9idWZmZXJlZF9tc2dfcXVldWUucG9wKCkpKSB7XG5cdFx0XHRcdFx0XHRcdHNlcXVlbmNlZE1lc3NhZ2VzLnB1c2gobXNnKTtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMub25NZXNzYWdlRGVsaXZlcmVkKVxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX25vdGlmeV9tc2dfc2VudFttc2ddID0gdGhpcy5vbk1lc3NhZ2VEZWxpdmVyZWQobXNnLnBheWxvYWRNZXNzYWdlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBTb3J0IHNlbnRNZXNzYWdlcyBpbnRvIHRoZSBvcmlnaW5hbCBzZW50IG9yZGVyLlxuXHRcdFx0XHRcdHZhciBzZXF1ZW5jZWRNZXNzYWdlcyA9IHNlcXVlbmNlZE1lc3NhZ2VzLnNvcnQoZnVuY3Rpb24oYSxiKSB7cmV0dXJuIGEuc2VxdWVuY2UgLSBiLnNlcXVlbmNlO30gKTtcblx0XHRcdFx0XHRmb3IgKHZhciBpPTAsIGxlbj1zZXF1ZW5jZWRNZXNzYWdlcy5sZW5ndGg7IGk8bGVuOyBpKyspIHtcblx0XHRcdFx0XHRcdHZhciBzZW50TWVzc2FnZSA9IHNlcXVlbmNlZE1lc3NhZ2VzW2ldO1xuXHRcdFx0XHRcdFx0aWYgKHNlbnRNZXNzYWdlLnR5cGUgPT0gTUVTU0FHRV9UWVBFLlBVQkxJU0ggJiYgc2VudE1lc3NhZ2UucHViUmVjUmVjZWl2ZWQpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHB1YlJlbE1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlBVQlJFTCwge21lc3NhZ2VJZGVudGlmaWVyOnNlbnRNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyfSk7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX3NjaGVkdWxlX21lc3NhZ2UocHViUmVsTWVzc2FnZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9zY2hlZHVsZV9tZXNzYWdlKHNlbnRNZXNzYWdlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBFeGVjdXRlIHRoZSBjb25uZWN0T3B0aW9ucy5vblN1Y2Nlc3MgY2FsbGJhY2sgaWYgdGhlcmUgaXMgb25lLlxuXHRcdFx0XHRcdC8vIFdpbGwgYWxzbyBub3cgcmV0dXJuIGlmIHRoaXMgY29ubmVjdGlvbiB3YXMgdGhlIHJlc3VsdCBvZiBhbiBhdXRvbWF0aWNcblx0XHRcdFx0XHQvLyByZWNvbm5lY3QgYW5kIHdoaWNoIFVSSSB3YXMgc3VjY2Vzc2Z1bGx5IGNvbm5lY3RlZCB0by5cblx0XHRcdFx0XHRpZiAodGhpcy5jb25uZWN0T3B0aW9ucy5vblN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRcdHRoaXMuY29ubmVjdE9wdGlvbnMub25TdWNjZXNzKHtpbnZvY2F0aW9uQ29udGV4dDp0aGlzLmNvbm5lY3RPcHRpb25zLmludm9jYXRpb25Db250ZXh0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyIHJlY29ubmVjdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0aWYgKHRoaXMuX3JlY29ubmVjdGluZykge1xuXHRcdFx0XHRcdFx0cmVjb25uZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dGhpcy5fcmVjb25uZWN0SW50ZXJ2YWwgPSAxO1xuXHRcdFx0XHRcdFx0dGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gRXhlY3V0ZSB0aGUgb25Db25uZWN0ZWQgY2FsbGJhY2sgaWYgdGhlcmUgaXMgb25lLlxuXHRcdFx0XHRcdHRoaXMuX2Nvbm5lY3RlZChyZWNvbm5lY3RlZCwgdGhpcy5fd3N1cmkpO1xuXG5cdFx0XHRcdFx0Ly8gUHJvY2VzcyBhbGwgcXVldWVkIG1lc3NhZ2VzIG5vdyB0aGF0IHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLlxuXHRcdFx0XHRcdHRoaXMuX3Byb2Nlc3NfcXVldWUoKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5QVUJMSVNIOlxuXHRcdFx0XHRcdHRoaXMuX3JlY2VpdmVQdWJsaXNoKHdpcmVNZXNzYWdlKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5QVUJBQ0s6XG5cdFx0XHRcdFx0dmFyIHNlbnRNZXNzYWdlID0gdGhpcy5fc2VudE1lc3NhZ2VzW3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyXTtcblx0XHRcdFx0XHQvLyBJZiB0aGlzIGlzIGEgcmUgZmxvdyBvZiBhIFBVQkFDSyBhZnRlciB3ZSBoYXZlIHJlc3RhcnRlZCByZWNlaXZlZE1lc3NhZ2Ugd2lsbCBub3QgZXhpc3QuXG5cdFx0XHRcdFx0aWYgKHNlbnRNZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgdGhpcy5fc2VudE1lc3NhZ2VzW3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyXTtcblx0XHRcdFx0XHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwiU2VudDpcIit0aGlzLl9sb2NhbEtleSt3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllcik7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vbk1lc3NhZ2VEZWxpdmVyZWQpXG5cdFx0XHRcdFx0XHRcdHRoaXMub25NZXNzYWdlRGVsaXZlcmVkKHNlbnRNZXNzYWdlLnBheWxvYWRNZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuUFVCUkVDOlxuXHRcdFx0XHRcdHZhciBzZW50TWVzc2FnZSA9IHRoaXMuX3NlbnRNZXNzYWdlc1t3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllcl07XG5cdFx0XHRcdFx0Ly8gSWYgdGhpcyBpcyBhIHJlIGZsb3cgb2YgYSBQVUJSRUMgYWZ0ZXIgd2UgaGF2ZSByZXN0YXJ0ZWQgcmVjZWl2ZWRNZXNzYWdlIHdpbGwgbm90IGV4aXN0LlxuXHRcdFx0XHRcdGlmIChzZW50TWVzc2FnZSkge1xuXHRcdFx0XHRcdFx0c2VudE1lc3NhZ2UucHViUmVjUmVjZWl2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0dmFyIHB1YlJlbE1lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlBVQlJFTCwge21lc3NhZ2VJZGVudGlmaWVyOndpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyfSk7XG5cdFx0XHRcdFx0XHR0aGlzLnN0b3JlKFwiU2VudDpcIiwgc2VudE1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0dGhpcy5fc2NoZWR1bGVfbWVzc2FnZShwdWJSZWxNZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuUFVCUkVMOlxuXHRcdFx0XHRcdHZhciByZWNlaXZlZE1lc3NhZ2UgPSB0aGlzLl9yZWNlaXZlZE1lc3NhZ2VzW3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyXTtcblx0XHRcdFx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcIlJlY2VpdmVkOlwiK3RoaXMuX2xvY2FsS2V5K3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyKTtcblx0XHRcdFx0XHQvLyBJZiB0aGlzIGlzIGEgcmUgZmxvdyBvZiBhIFBVQlJFTCBhZnRlciB3ZSBoYXZlIHJlc3RhcnRlZCByZWNlaXZlZE1lc3NhZ2Ugd2lsbCBub3QgZXhpc3QuXG5cdFx0XHRcdFx0aWYgKHJlY2VpdmVkTWVzc2FnZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5fcmVjZWl2ZU1lc3NhZ2UocmVjZWl2ZWRNZXNzYWdlKTtcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9yZWNlaXZlZE1lc3NhZ2VzW3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gQWx3YXlzIGZsb3cgUHViQ29tcCwgd2UgbWF5IGhhdmUgcHJldmlvdXNseSBmbG93ZWQgUHViQ29tcCBidXQgdGhlIHNlcnZlciBsb3N0IGl0IGFuZCByZXN0YXJ0ZWQuXG5cdFx0XHRcdFx0dmFyIHB1YkNvbXBNZXNzYWdlID0gbmV3IFdpcmVNZXNzYWdlKE1FU1NBR0VfVFlQRS5QVUJDT01QLCB7bWVzc2FnZUlkZW50aWZpZXI6d2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJ9KTtcblx0XHRcdFx0XHR0aGlzLl9zY2hlZHVsZV9tZXNzYWdlKHB1YkNvbXBNZXNzYWdlKTtcblxuXG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBNRVNTQUdFX1RZUEUuUFVCQ09NUDpcblx0XHRcdFx0XHR2YXIgc2VudE1lc3NhZ2UgPSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwiU2VudDpcIit0aGlzLl9sb2NhbEtleSt3aXJlTWVzc2FnZS5tZXNzYWdlSWRlbnRpZmllcik7XG5cdFx0XHRcdFx0aWYgKHRoaXMub25NZXNzYWdlRGVsaXZlcmVkKVxuXHRcdFx0XHRcdFx0dGhpcy5vbk1lc3NhZ2VEZWxpdmVyZWQoc2VudE1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlNVQkFDSzpcblx0XHRcdFx0XHR2YXIgc2VudE1lc3NhZ2UgPSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdGlmIChzZW50TWVzc2FnZSkge1xuXHRcdFx0XHRcdFx0aWYoc2VudE1lc3NhZ2UudGltZU91dClcblx0XHRcdFx0XHRcdFx0c2VudE1lc3NhZ2UudGltZU91dC5jYW5jZWwoKTtcblx0XHRcdFx0XHRcdC8vIFRoaXMgd2lsbCBuZWVkIHRvIGJlIGZpeGVkIHdoZW4gd2UgYWRkIG11bHRpcGxlIHRvcGljIHN1cHBvcnRcblx0XHRcdFx0XHRcdGlmICh3aXJlTWVzc2FnZS5yZXR1cm5Db2RlWzBdID09PSAweDgwKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChzZW50TWVzc2FnZS5vbkZhaWx1cmUpIHtcblx0XHRcdFx0XHRcdFx0XHRzZW50TWVzc2FnZS5vbkZhaWx1cmUod2lyZU1lc3NhZ2UucmV0dXJuQ29kZSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoc2VudE1lc3NhZ2Uub25TdWNjZXNzKSB7XG5cdFx0XHRcdFx0XHRcdHNlbnRNZXNzYWdlLm9uU3VjY2Vzcyh3aXJlTWVzc2FnZS5yZXR1cm5Db2RlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlIE1FU1NBR0VfVFlQRS5VTlNVQkFDSzpcblx0XHRcdFx0XHR2YXIgc2VudE1lc3NhZ2UgPSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdGlmIChzZW50TWVzc2FnZSkge1xuXHRcdFx0XHRcdFx0aWYgKHNlbnRNZXNzYWdlLnRpbWVPdXQpXG5cdFx0XHRcdFx0XHRcdHNlbnRNZXNzYWdlLnRpbWVPdXQuY2FuY2VsKCk7XG5cdFx0XHRcdFx0XHRpZiAoc2VudE1lc3NhZ2UuY2FsbGJhY2spIHtcblx0XHRcdFx0XHRcdFx0c2VudE1lc3NhZ2UuY2FsbGJhY2soKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzLl9zZW50TWVzc2FnZXNbd2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJdO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLlBJTkdSRVNQOlxuXHRcdFx0XHQvKiBUaGUgc2VuZFBpbmdlciBvciByZWNlaXZlUGluZ2VyIG1heSBoYXZlIHNlbnQgYSBwaW5nLCB0aGUgcmVjZWl2ZVBpbmdlciBoYXMgYWxyZWFkeSBiZWVuIHJlc2V0LiAqL1xuXHRcdFx0XHRcdHRoaXMuc2VuZFBpbmdlci5yZXNldCgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgTUVTU0FHRV9UWVBFLkRJU0NPTk5FQ1Q6XG5cdFx0XHRcdC8vIENsaWVudHMgZG8gbm90IGV4cGVjdCB0byByZWNlaXZlIGRpc2Nvbm5lY3QgcGFja2V0cy5cblx0XHRcdFx0XHR0aGlzLl9kaXNjb25uZWN0ZWQoRVJST1IuSU5WQUxJRF9NUVRUX01FU1NBR0VfVFlQRS5jb2RlICwgZm9ybWF0KEVSUk9SLklOVkFMSURfTVFUVF9NRVNTQUdFX1RZUEUsIFt3aXJlTWVzc2FnZS50eXBlXSkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dGhpcy5fZGlzY29ubmVjdGVkKEVSUk9SLklOVkFMSURfTVFUVF9NRVNTQUdFX1RZUEUuY29kZSAsIGZvcm1hdChFUlJPUi5JTlZBTElEX01RVFRfTUVTU0FHRV9UWVBFLCBbd2lyZU1lc3NhZ2UudHlwZV0pKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0dmFyIGVycm9yU3RhY2sgPSAoKGVycm9yLmhhc093blByb3BlcnR5KFwic3RhY2tcIikgPT0gXCJ1bmRlZmluZWRcIikgPyBlcnJvci5zdGFjay50b1N0cmluZygpIDogXCJObyBFcnJvciBTdGFjayBBdmFpbGFibGVcIik7XG5cdFx0XHRcdHRoaXMuX2Rpc2Nvbm5lY3RlZChFUlJPUi5JTlRFUk5BTF9FUlJPUi5jb2RlICwgZm9ybWF0KEVSUk9SLklOVEVSTkFMX0VSUk9SLCBbZXJyb3IubWVzc2FnZSxlcnJvclN0YWNrXSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBAaWdub3JlICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX29uX3NvY2tldF9lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdFx0aWYgKCF0aGlzLl9yZWNvbm5lY3RpbmcpIHtcblx0XHRcdFx0dGhpcy5fZGlzY29ubmVjdGVkKEVSUk9SLlNPQ0tFVF9FUlJPUi5jb2RlICwgZm9ybWF0KEVSUk9SLlNPQ0tFVF9FUlJPUiwgW2Vycm9yLmRhdGFdKSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBAaWdub3JlICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX29uX3NvY2tldF9jbG9zZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghdGhpcy5fcmVjb25uZWN0aW5nKSB7XG5cdFx0XHRcdHRoaXMuX2Rpc2Nvbm5lY3RlZChFUlJPUi5TT0NLRVRfQ0xPU0UuY29kZSAsIGZvcm1hdChFUlJPUi5TT0NLRVRfQ0xPU0UpKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIEBpZ25vcmUgKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5fc29ja2V0X3NlbmQgPSBmdW5jdGlvbiAod2lyZU1lc3NhZ2UpIHtcblxuXHRcdFx0aWYgKHdpcmVNZXNzYWdlLnR5cGUgPT0gMSkge1xuXHRcdFx0XHR2YXIgd2lyZU1lc3NhZ2VNYXNrZWQgPSB0aGlzLl90cmFjZU1hc2sod2lyZU1lc3NhZ2UsIFwicGFzc3dvcmRcIik7XG5cdFx0XHRcdHRoaXMuX3RyYWNlKFwiQ2xpZW50Ll9zb2NrZXRfc2VuZFwiLCB3aXJlTWVzc2FnZU1hc2tlZCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHRoaXMuX3RyYWNlKFwiQ2xpZW50Ll9zb2NrZXRfc2VuZFwiLCB3aXJlTWVzc2FnZSk7XG5cblx0XHRcdHRoaXMuc29ja2V0LnNlbmQod2lyZU1lc3NhZ2UuZW5jb2RlKCkpO1xuXHRcdFx0LyogV2UgaGF2ZSBwcm92ZWQgdG8gdGhlIHNlcnZlciB3ZSBhcmUgYWxpdmUuICovXG5cdFx0XHR0aGlzLnNlbmRQaW5nZXIucmVzZXQoKTtcblx0XHR9O1xuXG5cdFx0LyoqIEBpZ25vcmUgKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5fcmVjZWl2ZVB1Ymxpc2ggPSBmdW5jdGlvbiAod2lyZU1lc3NhZ2UpIHtcblx0XHRcdHN3aXRjaCh3aXJlTWVzc2FnZS5wYXlsb2FkTWVzc2FnZS5xb3MpIHtcblx0XHRcdGNhc2UgXCJ1bmRlZmluZWRcIjpcblx0XHRcdGNhc2UgMDpcblx0XHRcdFx0dGhpcy5fcmVjZWl2ZU1lc3NhZ2Uod2lyZU1lc3NhZ2UpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR2YXIgcHViQWNrTWVzc2FnZSA9IG5ldyBXaXJlTWVzc2FnZShNRVNTQUdFX1RZUEUuUFVCQUNLLCB7bWVzc2FnZUlkZW50aWZpZXI6d2lyZU1lc3NhZ2UubWVzc2FnZUlkZW50aWZpZXJ9KTtcblx0XHRcdFx0dGhpcy5fc2NoZWR1bGVfbWVzc2FnZShwdWJBY2tNZXNzYWdlKTtcblx0XHRcdFx0dGhpcy5fcmVjZWl2ZU1lc3NhZ2Uod2lyZU1lc3NhZ2UpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0aGlzLl9yZWNlaXZlZE1lc3NhZ2VzW3dpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyXSA9IHdpcmVNZXNzYWdlO1xuXHRcdFx0XHR0aGlzLnN0b3JlKFwiUmVjZWl2ZWQ6XCIsIHdpcmVNZXNzYWdlKTtcblx0XHRcdFx0dmFyIHB1YlJlY01lc3NhZ2UgPSBuZXcgV2lyZU1lc3NhZ2UoTUVTU0FHRV9UWVBFLlBVQlJFQywge21lc3NhZ2VJZGVudGlmaWVyOndpcmVNZXNzYWdlLm1lc3NhZ2VJZGVudGlmaWVyfSk7XG5cdFx0XHRcdHRoaXMuX3NjaGVkdWxlX21lc3NhZ2UocHViUmVjTWVzc2FnZSk7XG5cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IEVycm9yKFwiSW52YWlsZCBxb3M9XCIgKyB3aXJlTWVzc2FnZS5wYXlsb2FkTWVzc2FnZS5xb3MpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKiogQGlnbm9yZSAqL1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9yZWNlaXZlTWVzc2FnZSA9IGZ1bmN0aW9uICh3aXJlTWVzc2FnZSkge1xuXHRcdFx0aWYgKHRoaXMub25NZXNzYWdlQXJyaXZlZCkge1xuXHRcdFx0XHR0aGlzLm9uTWVzc2FnZUFycml2ZWQod2lyZU1lc3NhZ2UucGF5bG9hZE1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0ICogQ2xpZW50IGhhcyBjb25uZWN0ZWQuXG5cdCAqIEBwYXJhbSB7cmVjb25uZWN0fSBbYm9vbGVhbl0gaW5kaWNhdGUgaWYgdGhpcyB3YXMgYSByZXN1bHQgb2YgcmVjb25uZWN0IG9wZXJhdGlvbi5cblx0ICogQHBhcmFtIHt1cml9IFtzdHJpbmddIGZ1bGx5IHF1YWxpZmllZCBXZWJTb2NrZXQgVVJJIG9mIHRoZSBzZXJ2ZXIuXG5cdCAqL1xuXHRcdENsaWVudEltcGwucHJvdG90eXBlLl9jb25uZWN0ZWQgPSBmdW5jdGlvbiAocmVjb25uZWN0LCB1cmkpIHtcblx0XHQvLyBFeGVjdXRlIHRoZSBvbkNvbm5lY3RlZCBjYWxsYmFjayBpZiB0aGVyZSBpcyBvbmUuXG5cdFx0XHRpZiAodGhpcy5vbkNvbm5lY3RlZClcblx0XHRcdFx0dGhpcy5vbkNvbm5lY3RlZChyZWNvbm5lY3QsIHVyaSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHQgKiBBdHRlbXB0cyB0byByZWNvbm5lY3QgdGhlIGNsaWVudCB0byB0aGUgc2VydmVyLlxuICAgKiBGb3IgZWFjaCByZWNvbm5lY3QgYXR0ZW1wdCwgd2lsbCBkb3VibGUgdGhlIHJlY29ubmVjdCBpbnRlcnZhbFxuICAgKiB1cCB0byAxMjggc2Vjb25kcy5cblx0ICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuX3RyYWNlKFwiQ2xpZW50Ll9yZWNvbm5lY3RcIik7XG5cdFx0XHRpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG5cdFx0XHRcdHRoaXMuX3JlY29ubmVjdGluZyA9IHRydWU7XG5cdFx0XHRcdHRoaXMuc2VuZFBpbmdlci5jYW5jZWwoKTtcblx0XHRcdFx0dGhpcy5yZWNlaXZlUGluZ2VyLmNhbmNlbCgpO1xuXHRcdFx0XHRpZiAodGhpcy5fcmVjb25uZWN0SW50ZXJ2YWwgPCAxMjgpXG5cdFx0XHRcdFx0dGhpcy5fcmVjb25uZWN0SW50ZXJ2YWwgPSB0aGlzLl9yZWNvbm5lY3RJbnRlcnZhbCAqIDI7XG5cdFx0XHRcdGlmICh0aGlzLmNvbm5lY3RPcHRpb25zLnVyaXMpIHtcblx0XHRcdFx0XHR0aGlzLmhvc3RJbmRleCA9IDA7XG5cdFx0XHRcdFx0dGhpcy5fZG9Db25uZWN0KHRoaXMuY29ubmVjdE9wdGlvbnMudXJpc1swXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5fZG9Db25uZWN0KHRoaXMudXJpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0ICogQ2xpZW50IGhhcyBkaXNjb25uZWN0ZWQgZWl0aGVyIGF0IGl0cyBvd24gcmVxdWVzdCBvciBiZWNhdXNlIHRoZSBzZXJ2ZXJcblx0ICogb3IgbmV0d29yayBkaXNjb25uZWN0ZWQgaXQuIFJlbW92ZSBhbGwgbm9uLWR1cmFibGUgc3RhdGUuXG5cdCAqIEBwYXJhbSB7ZXJyb3JDb2RlfSBbbnVtYmVyXSB0aGUgZXJyb3IgbnVtYmVyLlxuXHQgKiBAcGFyYW0ge2Vycm9yVGV4dH0gW3N0cmluZ10gdGhlIGVycm9yIHRleHQuXG5cdCAqIEBpZ25vcmVcblx0ICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX2Rpc2Nvbm5lY3RlZCA9IGZ1bmN0aW9uIChlcnJvckNvZGUsIGVycm9yVGV4dCkge1xuXHRcdFx0dGhpcy5fdHJhY2UoXCJDbGllbnQuX2Rpc2Nvbm5lY3RlZFwiLCBlcnJvckNvZGUsIGVycm9yVGV4dCk7XG5cblx0XHRcdGlmIChlcnJvckNvZGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9yZWNvbm5lY3RpbmcpIHtcblx0XHRcdFx0Ly9Db250aW51ZSBhdXRvbWF0aWMgcmVjb25uZWN0IHByb2Nlc3Ncblx0XHRcdFx0dGhpcy5fcmVjb25uZWN0VGltZW91dCA9IG5ldyBUaW1lb3V0KHRoaXMsIHRoaXMuX3JlY29ubmVjdEludGVydmFsLCB0aGlzLl9yZWNvbm5lY3QpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2VuZFBpbmdlci5jYW5jZWwoKTtcblx0XHRcdHRoaXMucmVjZWl2ZVBpbmdlci5jYW5jZWwoKTtcblx0XHRcdGlmICh0aGlzLl9jb25uZWN0VGltZW91dCkge1xuXHRcdFx0XHR0aGlzLl9jb25uZWN0VGltZW91dC5jYW5jZWwoKTtcblx0XHRcdFx0dGhpcy5fY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDbGVhciBtZXNzYWdlIGJ1ZmZlcnMuXG5cdFx0XHR0aGlzLl9tc2dfcXVldWUgPSBbXTtcblx0XHRcdHRoaXMuX2J1ZmZlcmVkX21zZ19xdWV1ZSA9IFtdO1xuXHRcdFx0dGhpcy5fbm90aWZ5X21zZ19zZW50ID0ge307XG5cblx0XHRcdGlmICh0aGlzLnNvY2tldCkge1xuXHRcdFx0Ly8gQ2FuY2VsIGFsbCBzb2NrZXQgY2FsbGJhY2tzIHNvIHRoYXQgdGhleSBjYW5ub3QgYmUgZHJpdmVuIGFnYWluIGJ5IHRoaXMgc29ja2V0LlxuXHRcdFx0XHR0aGlzLnNvY2tldC5vbm9wZW4gPSBudWxsO1xuXHRcdFx0XHR0aGlzLnNvY2tldC5vbm1lc3NhZ2UgPSBudWxsO1xuXHRcdFx0XHR0aGlzLnNvY2tldC5vbmVycm9yID0gbnVsbDtcblx0XHRcdFx0dGhpcy5zb2NrZXQub25jbG9zZSA9IG51bGw7XG5cdFx0XHRcdGlmICh0aGlzLnNvY2tldC5yZWFkeVN0YXRlID09PSAxKVxuXHRcdFx0XHRcdHRoaXMuc29ja2V0LmNsb3NlKCk7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLnNvY2tldDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuY29ubmVjdE9wdGlvbnMudXJpcyAmJiB0aGlzLmhvc3RJbmRleCA8IHRoaXMuY29ubmVjdE9wdGlvbnMudXJpcy5sZW5ndGgtMSkge1xuXHRcdFx0Ly8gVHJ5IHRoZSBuZXh0IGhvc3QuXG5cdFx0XHRcdHRoaXMuaG9zdEluZGV4Kys7XG5cdFx0XHRcdHRoaXMuX2RvQ29ubmVjdCh0aGlzLmNvbm5lY3RPcHRpb25zLnVyaXNbdGhpcy5ob3N0SW5kZXhdKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0aWYgKGVycm9yQ29kZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0ZXJyb3JDb2RlID0gRVJST1IuT0suY29kZTtcblx0XHRcdFx0XHRlcnJvclRleHQgPSBmb3JtYXQoRVJST1IuT0spO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUnVuIGFueSBhcHBsaWNhdGlvbiBjYWxsYmFja3MgbGFzdCBhcyB0aGV5IG1heSBhdHRlbXB0IHRvIHJlY29ubmVjdCBhbmQgaGVuY2UgY3JlYXRlIGEgbmV3IHNvY2tldC5cblx0XHRcdFx0aWYgKHRoaXMuY29ubmVjdGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHQvLyBFeGVjdXRlIHRoZSBjb25uZWN0aW9uTG9zdENhbGxiYWNrIGlmIHRoZXJlIGlzIG9uZSwgYW5kIHdlIHdlcmUgY29ubmVjdGVkLlxuXHRcdFx0XHRcdGlmICh0aGlzLm9uQ29ubmVjdGlvbkxvc3QpIHtcblx0XHRcdFx0XHRcdHRoaXMub25Db25uZWN0aW9uTG9zdCh7ZXJyb3JDb2RlOmVycm9yQ29kZSwgZXJyb3JNZXNzYWdlOmVycm9yVGV4dCwgcmVjb25uZWN0OnRoaXMuY29ubmVjdE9wdGlvbnMucmVjb25uZWN0LCB1cmk6dGhpcy5fd3N1cml9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGVycm9yQ29kZSAhPT0gRVJST1IuT0suY29kZSAmJiB0aGlzLmNvbm5lY3RPcHRpb25zLnJlY29ubmVjdCkge1xuXHRcdFx0XHRcdC8vIFN0YXJ0IGF1dG9tYXRpYyByZWNvbm5lY3QgcHJvY2VzcyBmb3IgdGhlIHZlcnkgZmlyc3QgdGltZSBzaW5jZSBsYXN0IHN1Y2Nlc3NmdWwgY29ubmVjdC5cblx0XHRcdFx0XHRcdHRoaXMuX3JlY29ubmVjdEludGVydmFsID0gMTtcblx0XHRcdFx0XHRcdHRoaXMuX3JlY29ubmVjdCgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHdlIG5ldmVyIGhhZCBhIGNvbm5lY3Rpb24sIHNvIGluZGljYXRlIHRoYXQgdGhlIGNvbm5lY3QgaGFzIGZhaWxlZC5cblx0XHRcdFx0XHRpZiAodGhpcy5jb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvbiA9PT0gNCAmJiB0aGlzLmNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uRXhwbGljaXQgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl90cmFjZShcIkZhaWxlZCB0byBjb25uZWN0IFY0LCBkcm9wcGluZyBiYWNrIHRvIFYzXCIpO1xuXHRcdFx0XHRcdFx0dGhpcy5jb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvbiA9IDM7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5jb25uZWN0T3B0aW9ucy51cmlzKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaG9zdEluZGV4ID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5fZG9Db25uZWN0KHRoaXMuY29ubmVjdE9wdGlvbnMudXJpc1swXSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9kb0Nvbm5lY3QodGhpcy51cmkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZih0aGlzLmNvbm5lY3RPcHRpb25zLm9uRmFpbHVyZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5jb25uZWN0T3B0aW9ucy5vbkZhaWx1cmUoe2ludm9jYXRpb25Db250ZXh0OnRoaXMuY29ubmVjdE9wdGlvbnMuaW52b2NhdGlvbkNvbnRleHQsIGVycm9yQ29kZTplcnJvckNvZGUsIGVycm9yTWVzc2FnZTplcnJvclRleHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIEBpZ25vcmUgKi9cblx0XHRDbGllbnRJbXBsLnByb3RvdHlwZS5fdHJhY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gUGFzcyB0cmFjZSBtZXNzYWdlIGJhY2sgdG8gY2xpZW50J3MgY2FsbGJhY2sgZnVuY3Rpb25cblx0XHRcdGlmICh0aGlzLnRyYWNlRnVuY3Rpb24pIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdFx0XHRmb3IgKHZhciBpIGluIGFyZ3MpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGFyZ3NbaV0gIT09IFwidW5kZWZpbmVkXCIpXG5cdFx0XHRcdFx0XHRhcmdzLnNwbGljZShpLCAxLCBKU09OLnN0cmluZ2lmeShhcmdzW2ldKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIHJlY29yZCA9IGFyZ3Muam9pbihcIlwiKTtcblx0XHRcdFx0dGhpcy50cmFjZUZ1bmN0aW9uICh7c2V2ZXJpdHk6IFwiRGVidWdcIiwgbWVzc2FnZTogcmVjb3JkXHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly9idWZmZXIgc3R5bGUgdHJhY2Vcblx0XHRcdGlmICggdGhpcy5fdHJhY2VCdWZmZXIgIT09IG51bGwgKSB7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBtYXggPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcblx0XHRcdFx0XHRpZiAoIHRoaXMuX3RyYWNlQnVmZmVyLmxlbmd0aCA9PSB0aGlzLl9NQVhfVFJBQ0VfRU5UUklFUyApIHtcblx0XHRcdFx0XHRcdHRoaXMuX3RyYWNlQnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChpID09PSAwKSB0aGlzLl90cmFjZUJ1ZmZlci5wdXNoKGFyZ3VtZW50c1tpXSk7XG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gXCJ1bmRlZmluZWRcIiApIHRoaXMuX3RyYWNlQnVmZmVyLnB1c2goYXJndW1lbnRzW2ldKTtcblx0XHRcdFx0XHRlbHNlIHRoaXMuX3RyYWNlQnVmZmVyLnB1c2goXCIgIFwiK0pTT04uc3RyaW5naWZ5KGFyZ3VtZW50c1tpXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBAaWdub3JlICovXG5cdFx0Q2xpZW50SW1wbC5wcm90b3R5cGUuX3RyYWNlTWFzayA9IGZ1bmN0aW9uICh0cmFjZU9iamVjdCwgbWFza2VkKSB7XG5cdFx0XHR2YXIgdHJhY2VPYmplY3RNYXNrZWQgPSB7fTtcblx0XHRcdGZvciAodmFyIGF0dHIgaW4gdHJhY2VPYmplY3QpIHtcblx0XHRcdFx0aWYgKHRyYWNlT2JqZWN0Lmhhc093blByb3BlcnR5KGF0dHIpKSB7XG5cdFx0XHRcdFx0aWYgKGF0dHIgPT0gbWFza2VkKVxuXHRcdFx0XHRcdFx0dHJhY2VPYmplY3RNYXNrZWRbYXR0cl0gPSBcIioqKioqKlwiO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHRyYWNlT2JqZWN0TWFza2VkW2F0dHJdID0gdHJhY2VPYmplY3RbYXR0cl07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB0cmFjZU9iamVjdE1hc2tlZDtcblx0XHR9O1xuXG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Ly8gUHVibGljIFByb2dyYW1taW5nIGludGVyZmFjZS5cblx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdC8qKlxuXHQgKiBUaGUgSmF2YVNjcmlwdCBhcHBsaWNhdGlvbiBjb21tdW5pY2F0ZXMgdG8gdGhlIHNlcnZlciB1c2luZyBhIHtAbGluayBQYWhvLkNsaWVudH0gb2JqZWN0LlxuXHQgKiA8cD5cblx0ICogTW9zdCBhcHBsaWNhdGlvbnMgd2lsbCBjcmVhdGUganVzdCBvbmUgQ2xpZW50IG9iamVjdCBhbmQgdGhlbiBjYWxsIGl0cyBjb25uZWN0KCkgbWV0aG9kLFxuXHQgKiBob3dldmVyIGFwcGxpY2F0aW9ucyBjYW4gY3JlYXRlIG1vcmUgdGhhbiBvbmUgQ2xpZW50IG9iamVjdCBpZiB0aGV5IHdpc2guXG5cdCAqIEluIHRoaXMgY2FzZSB0aGUgY29tYmluYXRpb24gb2YgaG9zdCwgcG9ydCBhbmQgY2xpZW50SWQgYXR0cmlidXRlcyBtdXN0IGJlIGRpZmZlcmVudCBmb3IgZWFjaCBDbGllbnQgb2JqZWN0LlxuXHQgKiA8cD5cblx0ICogVGhlIHNlbmQsIHN1YnNjcmliZSBhbmQgdW5zdWJzY3JpYmUgbWV0aG9kcyBhcmUgaW1wbGVtZW50ZWQgYXMgYXN5bmNocm9ub3VzIEphdmFTY3JpcHQgbWV0aG9kc1xuXHQgKiAoZXZlbiB0aG91Z2ggdGhlIHVuZGVybHlpbmcgcHJvdG9jb2wgZXhjaGFuZ2UgbWlnaHQgYmUgc3luY2hyb25vdXMgaW4gbmF0dXJlKS5cblx0ICogVGhpcyBtZWFucyB0aGV5IHNpZ25hbCB0aGVpciBjb21wbGV0aW9uIGJ5IGNhbGxpbmcgYmFjayB0byB0aGUgYXBwbGljYXRpb24sXG5cdCAqIHZpYSBTdWNjZXNzIG9yIEZhaWx1cmUgY2FsbGJhY2sgZnVuY3Rpb25zIHByb3ZpZGVkIGJ5IHRoZSBhcHBsaWNhdGlvbiBvbiB0aGUgbWV0aG9kIGluIHF1ZXN0aW9uLlxuXHQgKiBTdWNoIGNhbGxiYWNrcyBhcmUgY2FsbGVkIGF0IG1vc3Qgb25jZSBwZXIgbWV0aG9kIGludm9jYXRpb24gYW5kIGRvIG5vdCBwZXJzaXN0IGJleW9uZCB0aGUgbGlmZXRpbWVcblx0ICogb2YgdGhlIHNjcmlwdCB0aGF0IG1hZGUgdGhlIGludm9jYXRpb24uXG5cdCAqIDxwPlxuXHQgKiBJbiBjb250cmFzdCB0aGVyZSBhcmUgc29tZSBjYWxsYmFjayBmdW5jdGlvbnMsIG1vc3Qgbm90YWJseSA8aT5vbk1lc3NhZ2VBcnJpdmVkPC9pPixcblx0ICogdGhhdCBhcmUgZGVmaW5lZCBvbiB0aGUge0BsaW5rIFBhaG8uQ2xpZW50fSBvYmplY3QuXG5cdCAqIFRoZXNlIG1heSBnZXQgY2FsbGVkIG11bHRpcGxlIHRpbWVzLCBhbmQgYXJlbid0IGRpcmVjdGx5IHJlbGF0ZWQgdG8gc3BlY2lmaWMgbWV0aG9kIGludm9jYXRpb25zIG1hZGUgYnkgdGhlIGNsaWVudC5cblx0ICpcblx0ICogQG5hbWUgUGFoby5DbGllbnRcblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBob3N0IC0gdGhlIGFkZHJlc3Mgb2YgdGhlIG1lc3NhZ2luZyBzZXJ2ZXIsIGFzIGEgZnVsbHkgcXVhbGlmaWVkIFdlYlNvY2tldCBVUkksIGFzIGEgRE5TIG5hbWUgb3IgZG90dGVkIGRlY2ltYWwgSVAgYWRkcmVzcy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHBvcnQgLSB0aGUgcG9ydCBudW1iZXIgdG8gY29ubmVjdCB0byAtIG9ubHkgcmVxdWlyZWQgaWYgaG9zdCBpcyBub3QgYSBVUklcblx0ICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgcGF0aCBvbiB0aGUgaG9zdCB0byBjb25uZWN0IHRvIC0gb25seSB1c2VkIGlmIGhvc3QgaXMgbm90IGEgVVJJLiBEZWZhdWx0OiAnL21xdHQnLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gY2xpZW50SWQgLSB0aGUgTWVzc2FnaW5nIGNsaWVudCBpZGVudGlmaWVyLCBiZXR3ZWVuIDEgYW5kIDIzIGNoYXJhY3RlcnMgaW4gbGVuZ3RoLlxuXHQgKlxuXHQgKiBAcHJvcGVydHkge3N0cmluZ30gaG9zdCAtIDxpPnJlYWQgb25seTwvaT4gdGhlIHNlcnZlcidzIEROUyBob3N0bmFtZSBvciBkb3R0ZWQgZGVjaW1hbCBJUCBhZGRyZXNzLlxuXHQgKiBAcHJvcGVydHkge251bWJlcn0gcG9ydCAtIDxpPnJlYWQgb25seTwvaT4gdGhlIHNlcnZlcidzIHBvcnQuXG5cdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoIC0gPGk+cmVhZCBvbmx5PC9pPiB0aGUgc2VydmVyJ3MgcGF0aC5cblx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGNsaWVudElkIC0gPGk+cmVhZCBvbmx5PC9pPiB1c2VkIHdoZW4gY29ubmVjdGluZyB0byB0aGUgc2VydmVyLlxuXHQgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBvbkNvbm5lY3Rpb25Mb3N0IC0gY2FsbGVkIHdoZW4gYSBjb25uZWN0aW9uIGhhcyBiZWVuIGxvc3QuXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyIGEgY29ubmVjdCgpIG1ldGhvZCBoYXMgc3VjY2VlZGVkLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFc3RhYmxpc2ggdGhlIGNhbGwgYmFjayB1c2VkIHdoZW4gYSBjb25uZWN0aW9uIGhhcyBiZWVuIGxvc3QuIFRoZSBjb25uZWN0aW9uIG1heSBiZVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0IGJlY2F1c2UgdGhlIGNsaWVudCBpbml0aWF0ZXMgYSBkaXNjb25uZWN0IG9yIGJlY2F1c2UgdGhlIHNlcnZlciBvciBuZXR3b3JrXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdXNlIHRoZSBjbGllbnQgdG8gYmUgZGlzY29ubmVjdGVkLiBUaGUgZGlzY29ubmVjdCBjYWxsIGJhY2sgbWF5IGJlIGNhbGxlZCB3aXRob3V0XG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBjb25uZWN0aW9uQ29tcGxldGUgY2FsbCBiYWNrIGJlaW5nIGludm9rZWQgaWYsIGZvciBleGFtcGxlIHRoZSBjbGllbnQgZmFpbHMgdG9cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdC5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgQSBzaW5nbGUgcmVzcG9uc2Ugb2JqZWN0IHBhcmFtZXRlciBpcyBwYXNzZWQgdG8gdGhlIG9uQ29ubmVjdGlvbkxvc3QgY2FsbGJhY2sgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIGZpZWxkczpcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+ZXJyb3JDb2RlXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5lcnJvck1lc3NhZ2Vcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9vbD5cblx0ICogQHByb3BlcnR5IHtmdW5jdGlvbn0gb25NZXNzYWdlRGVsaXZlcmVkIC0gY2FsbGVkIHdoZW4gYSBtZXNzYWdlIGhhcyBiZWVuIGRlbGl2ZXJlZC5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxsIHByb2Nlc3NpbmcgdGhhdCB0aGlzIENsaWVudCB3aWxsIGV2ZXIgZG8gaGFzIGJlZW4gY29tcGxldGVkLiBTbywgZm9yIGV4YW1wbGUsXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluIHRoZSBjYXNlIG9mIGEgUW9zPTIgbWVzc2FnZSBzZW50IGJ5IHRoaXMgY2xpZW50LCB0aGUgUHViQ29tcCBmbG93IGhhcyBiZWVuIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlclxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIHBlcnNpc3RlbnQgc3RvcmFnZSBiZWZvcmUgdGhpcyBjYWxsYmFjayBpcyBpbnZva2VkLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQYXJhbWV0ZXJzIHBhc3NlZCB0byB0aGUgb25NZXNzYWdlRGVsaXZlcmVkIGNhbGxiYWNrIGFyZTpcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+e0BsaW5rIFBhaG8uTWVzc2FnZX0gdGhhdCB3YXMgZGVsaXZlcmVkLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29sPlxuXHQgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBvbk1lc3NhZ2VBcnJpdmVkIC0gY2FsbGVkIHdoZW4gYSBtZXNzYWdlIGhhcyBhcnJpdmVkIGluIHRoaXMgUGFoby5jbGllbnQuXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBhcmFtZXRlcnMgcGFzc2VkIHRvIHRoZSBvbk1lc3NhZ2VBcnJpdmVkIGNhbGxiYWNrIGFyZTpcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+e0BsaW5rIFBhaG8uTWVzc2FnZX0gdGhhdCBoYXMgYXJyaXZlZC5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9vbD5cblx0ICogQHByb3BlcnR5IHtmdW5jdGlvbn0gb25Db25uZWN0ZWQgLSBjYWxsZWQgd2hlbiBhIGNvbm5lY3Rpb24gaXMgc3VjY2Vzc2Z1bGx5IG1hZGUgdG8gdGhlIHNlcnZlci5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXIgYSBjb25uZWN0KCkgbWV0aG9kLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQYXJhbWV0ZXJzIHBhc3NlZCB0byB0aGUgb25Db25uZWN0ZWQgY2FsbGJhY2sgYXJlOlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b2w+XG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5yZWNvbm5lY3QgKGJvb2xlYW4pIC0gSWYgdHJ1ZSwgdGhlIGNvbm5lY3Rpb24gd2FzIHRoZSByZXN1bHQgb2YgYSByZWNvbm5lY3QuPC9saT5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPlVSSSAoc3RyaW5nKSAtIFRoZSBVUkkgdXNlZCB0byBjb25uZWN0IHRvIHRoZSBzZXJ2ZXIuPC9saT5cblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9vbD5cblx0ICogQHByb3BlcnR5IHtib29sZWFufSBkaXNjb25uZWN0ZWRQdWJsaXNoaW5nIC0gaWYgc2V0LCB3aWxsIGVuYWJsZSBkaXNjb25uZWN0ZWQgcHVibGlzaGluZyBpblxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gdGhlIGV2ZW50IHRoYXQgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlciBpcyBsb3N0LlxuXHQgKiBAcHJvcGVydHkge251bWJlcn0gZGlzY29ubmVjdGVkQnVmZmVyU2l6ZSAtIFVzZWQgdG8gc2V0IHRoZSBtYXhpbXVtIG51bWJlciBvZiBtZXNzYWdlcyB0aGF0IHRoZSBkaXNjb25uZWN0ZWRcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgd2lsbCBob2xkIGJlZm9yZSByZWplY3RpbmcgbmV3IG1lc3NhZ2VzLiBEZWZhdWx0IHNpemU6IDUwMDAgbWVzc2FnZXNcblx0ICogQHByb3BlcnR5IHtmdW5jdGlvbn0gdHJhY2UgLSBjYWxsZWQgd2hlbmV2ZXIgdHJhY2UgaXMgY2FsbGVkLiBUT0RPXG5cdCAqL1xuXHRcdHZhciBDbGllbnQgPSBmdW5jdGlvbiAoaG9zdCwgcG9ydCwgcGF0aCwgY2xpZW50SWQpIHtcblxuXHRcdFx0dmFyIHVyaTtcblxuXHRcdFx0aWYgKHR5cGVvZiBob3N0ICE9PSBcInN0cmluZ1wiKVxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBob3N0LCBcImhvc3RcIl0pKTtcblxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMikge1xuXHRcdFx0Ly8gaG9zdDogbXVzdCBiZSBmdWxsIHdzOi8vIHVyaVxuXHRcdFx0Ly8gcG9ydDogY2xpZW50SWRcblx0XHRcdFx0Y2xpZW50SWQgPSBwb3J0O1xuXHRcdFx0XHR1cmkgPSBob3N0O1xuXHRcdFx0XHR2YXIgbWF0Y2ggPSB1cmkubWF0Y2goL14od3NzPyk6XFwvXFwvKChcXFsoLispXFxdKXwoW15cXC9dKz8pKSg6KFxcZCspKT8oXFwvLiopJC8pO1xuXHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRob3N0ID0gbWF0Y2hbNF18fG1hdGNoWzJdO1xuXHRcdFx0XHRcdHBvcnQgPSBwYXJzZUludChtYXRjaFs3XSk7XG5cdFx0XHRcdFx0cGF0aCA9IG1hdGNoWzhdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCxbaG9zdCxcImhvc3RcIl0pKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMykge1xuXHRcdFx0XHRcdGNsaWVudElkID0gcGF0aDtcblx0XHRcdFx0XHRwYXRoID0gXCIvbXF0dFwiO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgcG9ydCAhPT0gXCJudW1iZXJcIiB8fCBwb3J0IDwgMClcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBwb3J0LCBcInBvcnRcIl0pKTtcblx0XHRcdFx0aWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKVxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9UWVBFLCBbdHlwZW9mIHBhdGgsIFwicGF0aFwiXSkpO1xuXG5cdFx0XHRcdHZhciBpcHY2QWRkU0JyYWNrZXQgPSAoaG9zdC5pbmRleE9mKFwiOlwiKSAhPT0gLTEgJiYgaG9zdC5zbGljZSgwLDEpICE9PSBcIltcIiAmJiBob3N0LnNsaWNlKC0xKSAhPT0gXCJdXCIpO1xuXHRcdFx0XHR1cmkgPSBcIndzOi8vXCIrKGlwdjZBZGRTQnJhY2tldD9cIltcIitob3N0K1wiXVwiOmhvc3QpK1wiOlwiK3BvcnQrcGF0aDtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGNsaWVudElkTGVuZ3RoID0gMDtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpPGNsaWVudElkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA9IGNsaWVudElkLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmICgweEQ4MDAgPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHhEQkZGKSAge1xuXHRcdFx0XHRcdGkrKzsgLy8gU3Vycm9nYXRlIHBhaXIuXG5cdFx0XHRcdH1cblx0XHRcdFx0Y2xpZW50SWRMZW5ndGgrKztcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2YgY2xpZW50SWQgIT09IFwic3RyaW5nXCIgfHwgY2xpZW50SWRMZW5ndGggPiA2NTUzNSlcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY2xpZW50SWQsIFwiY2xpZW50SWRcIl0pKTtcblxuXHRcdFx0dmFyIGNsaWVudCA9IG5ldyBDbGllbnRJbXBsKHVyaSwgaG9zdCwgcG9ydCwgcGF0aCwgY2xpZW50SWQpO1xuXG5cdFx0XHQvL1B1YmxpYyBQcm9wZXJ0aWVzXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLHtcblx0XHRcdFx0XCJob3N0XCI6e1xuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBob3N0OyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24oKSB7IHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuVU5TVVBQT1JURURfT1BFUkFUSU9OKSk7IH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJwb3J0XCI6e1xuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBwb3J0OyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24oKSB7IHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuVU5TVVBQT1JURURfT1BFUkFUSU9OKSk7IH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJwYXRoXCI6e1xuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBwYXRoOyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24oKSB7IHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuVU5TVVBQT1JURURfT1BFUkFUSU9OKSk7IH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJ1cmlcIjp7XG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHVyaTsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKCkgeyB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLlVOU1VQUE9SVEVEX09QRVJBVElPTikpOyB9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY2xpZW50SWRcIjp7XG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGNsaWVudC5jbGllbnRJZDsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKCkgeyB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLlVOU1VQUE9SVEVEX09QRVJBVElPTikpOyB9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwib25Db25uZWN0ZWRcIjp7XG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGNsaWVudC5vbkNvbm5lY3RlZDsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld09uQ29ubmVjdGVkKSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIG5ld09uQ29ubmVjdGVkID09PSBcImZ1bmN0aW9uXCIpXG5cdFx0XHRcdFx0XHRcdGNsaWVudC5vbkNvbm5lY3RlZCA9IG5ld09uQ29ubmVjdGVkO1xuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBuZXdPbkNvbm5lY3RlZCwgXCJvbkNvbm5lY3RlZFwiXSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJkaXNjb25uZWN0ZWRQdWJsaXNoaW5nXCI6e1xuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBjbGllbnQuZGlzY29ubmVjdGVkUHVibGlzaGluZzsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld0Rpc2Nvbm5lY3RlZFB1Ymxpc2hpbmcpIHtcblx0XHRcdFx0XHRcdGNsaWVudC5kaXNjb25uZWN0ZWRQdWJsaXNoaW5nID0gbmV3RGlzY29ubmVjdGVkUHVibGlzaGluZztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiZGlzY29ubmVjdGVkQnVmZmVyU2l6ZVwiOntcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gY2xpZW50LmRpc2Nvbm5lY3RlZEJ1ZmZlclNpemU7IH0sXG5cdFx0XHRcdFx0c2V0OiBmdW5jdGlvbihuZXdEaXNjb25uZWN0ZWRCdWZmZXJTaXplKSB7XG5cdFx0XHRcdFx0XHRjbGllbnQuZGlzY29ubmVjdGVkQnVmZmVyU2l6ZSA9IG5ld0Rpc2Nvbm5lY3RlZEJ1ZmZlclNpemU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcIm9uQ29ubmVjdGlvbkxvc3RcIjp7XG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGNsaWVudC5vbkNvbm5lY3Rpb25Mb3N0OyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24obmV3T25Db25uZWN0aW9uTG9zdCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBuZXdPbkNvbm5lY3Rpb25Mb3N0ID09PSBcImZ1bmN0aW9uXCIpXG5cdFx0XHRcdFx0XHRcdGNsaWVudC5vbkNvbm5lY3Rpb25Mb3N0ID0gbmV3T25Db25uZWN0aW9uTG9zdDtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX1RZUEUsIFt0eXBlb2YgbmV3T25Db25uZWN0aW9uTG9zdCwgXCJvbkNvbm5lY3Rpb25Mb3N0XCJdKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcIm9uTWVzc2FnZURlbGl2ZXJlZFwiOntcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gY2xpZW50Lm9uTWVzc2FnZURlbGl2ZXJlZDsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld09uTWVzc2FnZURlbGl2ZXJlZCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBuZXdPbk1lc3NhZ2VEZWxpdmVyZWQgPT09IFwiZnVuY3Rpb25cIilcblx0XHRcdFx0XHRcdFx0Y2xpZW50Lm9uTWVzc2FnZURlbGl2ZXJlZCA9IG5ld09uTWVzc2FnZURlbGl2ZXJlZDtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX1RZUEUsIFt0eXBlb2YgbmV3T25NZXNzYWdlRGVsaXZlcmVkLCBcIm9uTWVzc2FnZURlbGl2ZXJlZFwiXSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJvbk1lc3NhZ2VBcnJpdmVkXCI6e1xuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBjbGllbnQub25NZXNzYWdlQXJyaXZlZDsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld09uTWVzc2FnZUFycml2ZWQpIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgbmV3T25NZXNzYWdlQXJyaXZlZCA9PT0gXCJmdW5jdGlvblwiKVxuXHRcdFx0XHRcdFx0XHRjbGllbnQub25NZXNzYWdlQXJyaXZlZCA9IG5ld09uTWVzc2FnZUFycml2ZWQ7XG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9UWVBFLCBbdHlwZW9mIG5ld09uTWVzc2FnZUFycml2ZWQsIFwib25NZXNzYWdlQXJyaXZlZFwiXSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJ0cmFjZVwiOntcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gY2xpZW50LnRyYWNlRnVuY3Rpb247IH0sXG5cdFx0XHRcdFx0c2V0OiBmdW5jdGlvbih0cmFjZSkge1xuXHRcdFx0XHRcdFx0aWYodHlwZW9mIHRyYWNlID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHRcdFx0XHRjbGllbnQudHJhY2VGdW5jdGlvbiA9IHRyYWNlO1xuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9UWVBFLCBbdHlwZW9mIHRyYWNlLCBcIm9uVHJhY2VcIl0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0LyoqXG5cdFx0ICogQ29ubmVjdCB0aGlzIE1lc3NhZ2luZyBjbGllbnQgdG8gaXRzIHNlcnZlci5cblx0XHQgKlxuXHRcdCAqIEBuYW1lIFBhaG8uQ2xpZW50I2Nvbm5lY3Rcblx0XHQgKiBAZnVuY3Rpb25cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gY29ubmVjdE9wdGlvbnMgLSBBdHRyaWJ1dGVzIHVzZWQgd2l0aCB0aGUgY29ubmVjdGlvbi5cblx0XHQgKiBAcGFyYW0ge251bWJlcn0gY29ubmVjdE9wdGlvbnMudGltZW91dCAtIElmIHRoZSBjb25uZWN0IGhhcyBub3Qgc3VjY2VlZGVkIHdpdGhpbiB0aGlzXG5cdFx0ICogICAgICAgICAgICAgICAgICAgIG51bWJlciBvZiBzZWNvbmRzLCBpdCBpcyBkZWVtZWQgdG8gaGF2ZSBmYWlsZWQuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgIFRoZSBkZWZhdWx0IGlzIDMwIHNlY29uZHMuXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGNvbm5lY3RPcHRpb25zLnVzZXJOYW1lIC0gQXV0aGVudGljYXRpb24gdXNlcm5hbWUgZm9yIHRoaXMgY29ubmVjdGlvbi5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gY29ubmVjdE9wdGlvbnMucGFzc3dvcmQgLSBBdXRoZW50aWNhdGlvbiBwYXNzd29yZCBmb3IgdGhpcyBjb25uZWN0aW9uLlxuXHRcdCAqIEBwYXJhbSB7UGFoby5NZXNzYWdlfSBjb25uZWN0T3B0aW9ucy53aWxsTWVzc2FnZSAtIHNlbnQgYnkgdGhlIHNlcnZlciB3aGVuIHRoZSBjbGllbnRcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgZGlzY29ubmVjdHMgYWJub3JtYWxseS5cblx0XHQgKiBAcGFyYW0ge251bWJlcn0gY29ubmVjdE9wdGlvbnMua2VlcEFsaXZlSW50ZXJ2YWwgLSB0aGUgc2VydmVyIGRpc2Nvbm5lY3RzIHRoaXMgY2xpZW50IGlmXG5cdFx0ICogICAgICAgICAgICAgICAgICAgIHRoZXJlIGlzIG5vIGFjdGl2aXR5IGZvciB0aGlzIG51bWJlciBvZiBzZWNvbmRzLlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICBUaGUgZGVmYXVsdCB2YWx1ZSBvZiA2MCBzZWNvbmRzIGlzIGFzc3VtZWQgaWYgbm90IHNldC5cblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbm5lY3RPcHRpb25zLmNsZWFuU2Vzc2lvbiAtIGlmIHRydWUoZGVmYXVsdCkgdGhlIGNsaWVudCBhbmQgc2VydmVyXG5cdFx0ICogICAgICAgICAgICAgICAgICAgIHBlcnNpc3RlbnQgc3RhdGUgaXMgZGVsZXRlZCBvbiBzdWNjZXNzZnVsIGNvbm5lY3QuXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBjb25uZWN0T3B0aW9ucy51c2VTU0wgLSBpZiBwcmVzZW50IGFuZCB0cnVlLCB1c2UgYW4gU1NMIFdlYnNvY2tldCBjb25uZWN0aW9uLlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBjb25uZWN0T3B0aW9ucy5pbnZvY2F0aW9uQ29udGV4dCAtIHBhc3NlZCB0byB0aGUgb25TdWNjZXNzIGNhbGxiYWNrIG9yIG9uRmFpbHVyZSBjYWxsYmFjay5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb25uZWN0T3B0aW9ucy5vblN1Y2Nlc3MgLSBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdCBhY2tub3dsZWRnZW1lbnRcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgaGFzIGJlZW4gcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyLlxuXHRcdCAqIEEgc2luZ2xlIHJlc3BvbnNlIG9iamVjdCBwYXJhbWV0ZXIgaXMgcGFzc2VkIHRvIHRoZSBvblN1Y2Nlc3MgY2FsbGJhY2sgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIGZpZWxkczpcblx0XHQgKiA8b2w+XG5cdFx0ICogPGxpPmludm9jYXRpb25Db250ZXh0IGFzIHBhc3NlZCBpbiB0byB0aGUgb25TdWNjZXNzIG1ldGhvZCBpbiB0aGUgY29ubmVjdE9wdGlvbnMuXG5cdFx0ICogPC9vbD5cblx0ICogQHBhcmFtIHtmdW5jdGlvbn0gY29ubmVjdE9wdGlvbnMub25GYWlsdXJlIC0gY2FsbGVkIHdoZW4gdGhlIGNvbm5lY3QgcmVxdWVzdCBoYXMgZmFpbGVkIG9yIHRpbWVkIG91dC5cblx0XHQgKiBBIHNpbmdsZSByZXNwb25zZSBvYmplY3QgcGFyYW1ldGVyIGlzIHBhc3NlZCB0byB0aGUgb25GYWlsdXJlIGNhbGxiYWNrIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG5cdFx0ICogPG9sPlxuXHRcdCAqIDxsaT5pbnZvY2F0aW9uQ29udGV4dCBhcyBwYXNzZWQgaW4gdG8gdGhlIG9uRmFpbHVyZSBtZXRob2QgaW4gdGhlIGNvbm5lY3RPcHRpb25zLlxuXHRcdCAqIDxsaT5lcnJvckNvZGUgYSBudW1iZXIgaW5kaWNhdGluZyB0aGUgbmF0dXJlIG9mIHRoZSBlcnJvci5cblx0XHQgKiA8bGk+ZXJyb3JNZXNzYWdlIHRleHQgZGVzY3JpYmluZyB0aGUgZXJyb3IuXG5cdFx0ICogPC9vbD5cblx0ICogQHBhcmFtIHthcnJheX0gY29ubmVjdE9wdGlvbnMuaG9zdHMgLSBJZiBwcmVzZW50IHRoaXMgY29udGFpbnMgZWl0aGVyIGEgc2V0IG9mIGhvc3RuYW1lcyBvciBmdWxseSBxdWFsaWZpZWRcblx0XHQgKiBXZWJTb2NrZXQgVVJJcyAod3M6Ly9pb3QuZWNsaXBzZS5vcmc6ODAvd3MpLCB0aGF0IGFyZSB0cmllZCBpbiBvcmRlciBpbiBwbGFjZVxuXHRcdCAqIG9mIHRoZSBob3N0IGFuZCBwb3J0IHBhcmFtYXRlciBvbiB0aGUgY29uc3RydXRvci4gVGhlIGhvc3RzIGFyZSB0cmllZCBvbmUgYXQgYXQgdGltZSBpbiBvcmRlciB1bnRpbFxuXHRcdCAqIG9uZSBvZiB0aGVuIHN1Y2NlZWRzLlxuXHQgKiBAcGFyYW0ge2FycmF5fSBjb25uZWN0T3B0aW9ucy5wb3J0cyAtIElmIHByZXNlbnQgdGhlIHNldCBvZiBwb3J0cyBtYXRjaGluZyB0aGUgaG9zdHMuIElmIGhvc3RzIGNvbnRhaW5zIFVSSXMsIHRoaXMgcHJvcGVydHlcblx0XHQgKiBpcyBub3QgdXNlZC5cblx0ICogQHBhcmFtIHtib29sZWFufSBjb25uZWN0T3B0aW9ucy5yZWNvbm5lY3QgLSBTZXRzIHdoZXRoZXIgdGhlIGNsaWVudCB3aWxsIGF1dG9tYXRpY2FsbHkgYXR0ZW1wdCB0byByZWNvbm5lY3Rcblx0ICogdG8gdGhlIHNlcnZlciBpZiB0aGUgY29ubmVjdGlvbiBpcyBsb3N0LlxuXHQgKjx1bD5cblx0ICo8bGk+SWYgc2V0IHRvIGZhbHNlLCB0aGUgY2xpZW50IHdpbGwgbm90IGF0dGVtcHQgdG8gYXV0b21hdGljYWxseSByZWNvbm5lY3QgdG8gdGhlIHNlcnZlciBpbiB0aGUgZXZlbnQgdGhhdCB0aGVcblx0ICogY29ubmVjdGlvbiBpcyBsb3N0LjwvbGk+XG5cdCAqPGxpPklmIHNldCB0byB0cnVlLCBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgY29ubmVjdGlvbiBpcyBsb3N0LCB0aGUgY2xpZW50IHdpbGwgYXR0ZW1wdCB0byByZWNvbm5lY3QgdG8gdGhlIHNlcnZlci5cblx0ICogSXQgd2lsbCBpbml0aWFsbHkgd2FpdCAxIHNlY29uZCBiZWZvcmUgaXQgYXR0ZW1wdHMgdG8gcmVjb25uZWN0LCBmb3IgZXZlcnkgZmFpbGVkIHJlY29ubmVjdCBhdHRlbXB0LCB0aGUgZGVsYXlcblx0ICogd2lsbCBkb3VibGUgdW50aWwgaXQgaXMgYXQgMiBtaW51dGVzIGF0IHdoaWNoIHBvaW50IHRoZSBkZWxheSB3aWxsIHN0YXkgYXQgMiBtaW51dGVzLjwvbGk+XG5cdCAqPC91bD5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uIC0gVGhlIHZlcnNpb24gb2YgTVFUVCB0byB1c2UgdG8gY29ubmVjdCB0byB0aGUgTVFUVCBCcm9rZXIuXG5cdCAqPHVsPlxuXHQgKjxsaT4zIC0gTVFUVCBWMy4xPC9saT5cblx0ICo8bGk+NCAtIE1RVFQgVjMuMS4xPC9saT5cblx0ICo8L3VsPlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uRXhwbGljaXQgLSBJZiBzZXQgdG8gdHJ1ZSwgd2lsbCBmb3JjZSB0aGUgY29ubmVjdGlvbiB0byB1c2UgdGhlXG5cdCAqIHNlbGVjdGVkIE1RVFQgVmVyc2lvbiBvciB3aWxsIGZhaWwgdG8gY29ubmVjdC5cblx0ICogQHBhcmFtIHthcnJheX0gY29ubmVjdE9wdGlvbnMudXJpcyAtIElmIHByZXNlbnQsIHNob3VsZCBjb250YWluIGEgbGlzdCBvZiBmdWxseSBxdWFsaWZpZWQgV2ViU29ja2V0IHVyaXNcblx0ICogKGUuZy4gd3M6Ly9pb3QuZWNsaXBzZS5vcmc6ODAvd3MpLCB0aGF0IGFyZSB0cmllZCBpbiBvcmRlciBpbiBwbGFjZSBvZiB0aGUgaG9zdCBhbmQgcG9ydCBwYXJhbWV0ZXIgb2YgdGhlIGNvbnN0cnV0b3IuXG5cdCAqIFRoZSB1cmlzIGFyZSB0cmllZCBvbmUgYXQgYSB0aW1lIGluIG9yZGVyIHVudGlsIG9uZSBvZiB0aGVtIHN1Y2NlZWRzLiBEbyBub3QgdXNlIHRoaXMgaW4gY29uanVuY3Rpb24gd2l0aCBob3N0cyBhc1xuXHQgKiB0aGUgaG9zdHMgYXJyYXkgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gdXJpcyBhbmQgd2lsbCBvdmVyd3JpdGUgdGhpcyBwcm9wZXJ0eS5cblx0XHQgKiBAdGhyb3dzIHtJbnZhbGlkU3RhdGV9IElmIHRoZSBjbGllbnQgaXMgbm90IGluIGRpc2Nvbm5lY3RlZCBzdGF0ZS4gVGhlIGNsaWVudCBtdXN0IGhhdmUgcmVjZWl2ZWQgY29ubmVjdGlvbkxvc3Rcblx0XHQgKiBvciBkaXNjb25uZWN0ZWQgYmVmb3JlIGNhbGxpbmcgY29ubmVjdCBmb3IgYSBzZWNvbmQgb3Igc3Vic2VxdWVudCB0aW1lLlxuXHRcdCAqL1xuXHRcdFx0dGhpcy5jb25uZWN0ID0gZnVuY3Rpb24gKGNvbm5lY3RPcHRpb25zKSB7XG5cdFx0XHRcdGNvbm5lY3RPcHRpb25zID0gY29ubmVjdE9wdGlvbnMgfHwge30gO1xuXHRcdFx0XHR2YWxpZGF0ZShjb25uZWN0T3B0aW9ucywgIHt0aW1lb3V0OlwibnVtYmVyXCIsXG5cdFx0XHRcdFx0dXNlck5hbWU6XCJzdHJpbmdcIixcblx0XHRcdFx0XHRwYXNzd29yZDpcInN0cmluZ1wiLFxuXHRcdFx0XHRcdHdpbGxNZXNzYWdlOlwib2JqZWN0XCIsXG5cdFx0XHRcdFx0a2VlcEFsaXZlSW50ZXJ2YWw6XCJudW1iZXJcIixcblx0XHRcdFx0XHRjbGVhblNlc3Npb246XCJib29sZWFuXCIsXG5cdFx0XHRcdFx0dXNlU1NMOlwiYm9vbGVhblwiLFxuXHRcdFx0XHRcdGludm9jYXRpb25Db250ZXh0Olwib2JqZWN0XCIsXG5cdFx0XHRcdFx0b25TdWNjZXNzOlwiZnVuY3Rpb25cIixcblx0XHRcdFx0XHRvbkZhaWx1cmU6XCJmdW5jdGlvblwiLFxuXHRcdFx0XHRcdGhvc3RzOlwib2JqZWN0XCIsXG5cdFx0XHRcdFx0cG9ydHM6XCJvYmplY3RcIixcblx0XHRcdFx0XHRyZWNvbm5lY3Q6XCJib29sZWFuXCIsXG5cdFx0XHRcdFx0bXF0dFZlcnNpb246XCJudW1iZXJcIixcblx0XHRcdFx0XHRtcXR0VmVyc2lvbkV4cGxpY2l0OlwiYm9vbGVhblwiLFxuXHRcdFx0XHRcdHVyaXM6IFwib2JqZWN0XCJ9KTtcblxuXHRcdFx0XHQvLyBJZiBubyBrZWVwIGFsaXZlIGludGVydmFsIGlzIHNldCwgYXNzdW1lIDYwIHNlY29uZHMuXG5cdFx0XHRcdGlmIChjb25uZWN0T3B0aW9ucy5rZWVwQWxpdmVJbnRlcnZhbCA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdGNvbm5lY3RPcHRpb25zLmtlZXBBbGl2ZUludGVydmFsID0gNjA7XG5cblx0XHRcdFx0aWYgKGNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uID4gNCB8fCBjb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvbiA8IDMpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfQVJHVU1FTlQsIFtjb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvbiwgXCJjb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvblwiXSkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjb25uZWN0T3B0aW9ucy5tcXR0VmVyc2lvbkV4cGxpY2l0ID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29ubmVjdE9wdGlvbnMubXF0dFZlcnNpb24gPSA0O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbm5lY3RPcHRpb25zLm1xdHRWZXJzaW9uRXhwbGljaXQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9DaGVjayB0aGF0IGlmIHBhc3N3b3JkIGlzIHNldCwgc28gaXMgdXNlcm5hbWVcblx0XHRcdFx0aWYgKGNvbm5lY3RPcHRpb25zLnBhc3N3b3JkICE9PSB1bmRlZmluZWQgJiYgY29ubmVjdE9wdGlvbnMudXNlck5hbWUgPT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfQVJHVU1FTlQsIFtjb25uZWN0T3B0aW9ucy5wYXNzd29yZCwgXCJjb25uZWN0T3B0aW9ucy5wYXNzd29yZFwiXSkpO1xuXG5cdFx0XHRcdGlmIChjb25uZWN0T3B0aW9ucy53aWxsTWVzc2FnZSkge1xuXHRcdFx0XHRcdGlmICghKGNvbm5lY3RPcHRpb25zLndpbGxNZXNzYWdlIGluc3RhbmNlb2YgTWVzc2FnZSkpXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW2Nvbm5lY3RPcHRpb25zLndpbGxNZXNzYWdlLCBcImNvbm5lY3RPcHRpb25zLndpbGxNZXNzYWdlXCJdKSk7XG5cdFx0XHRcdFx0Ly8gVGhlIHdpbGwgbWVzc2FnZSBtdXN0IGhhdmUgYSBwYXlsb2FkIHRoYXQgY2FuIGJlIHJlcHJlc2VudGVkIGFzIGEgc3RyaW5nLlxuXHRcdFx0XHRcdC8vIENhdXNlIHRoZSB3aWxsTWVzc2FnZSB0byB0aHJvdyBhbiBleGNlcHRpb24gaWYgdGhpcyBpcyBub3QgdGhlIGNhc2UuXG5cdFx0XHRcdFx0Y29ubmVjdE9wdGlvbnMud2lsbE1lc3NhZ2Uuc3RyaW5nUGF5bG9hZCA9IG51bGw7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbm5lY3RPcHRpb25zLndpbGxNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSA9PT0gXCJ1bmRlZmluZWRcIilcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9UWVBFLCBbdHlwZW9mIGNvbm5lY3RPcHRpb25zLndpbGxNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSwgXCJjb25uZWN0T3B0aW9ucy53aWxsTWVzc2FnZS5kZXN0aW5hdGlvbk5hbWVcIl0pKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodHlwZW9mIGNvbm5lY3RPcHRpb25zLmNsZWFuU2Vzc2lvbiA9PT0gXCJ1bmRlZmluZWRcIilcblx0XHRcdFx0XHRjb25uZWN0T3B0aW9ucy5jbGVhblNlc3Npb24gPSB0cnVlO1xuXHRcdFx0XHRpZiAoY29ubmVjdE9wdGlvbnMuaG9zdHMpIHtcblxuXHRcdFx0XHRcdGlmICghKGNvbm5lY3RPcHRpb25zLmhvc3RzIGluc3RhbmNlb2YgQXJyYXkpIClcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCwgW2Nvbm5lY3RPcHRpb25zLmhvc3RzLCBcImNvbm5lY3RPcHRpb25zLmhvc3RzXCJdKSk7XG5cdFx0XHRcdFx0aWYgKGNvbm5lY3RPcHRpb25zLmhvc3RzLmxlbmd0aCA8MSApXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfQVJHVU1FTlQsIFtjb25uZWN0T3B0aW9ucy5ob3N0cywgXCJjb25uZWN0T3B0aW9ucy5ob3N0c1wiXSkpO1xuXG5cdFx0XHRcdFx0dmFyIHVzaW5nVVJJcyA9IGZhbHNlO1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpPGNvbm5lY3RPcHRpb25zLmhvc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbm5lY3RPcHRpb25zLmhvc3RzW2ldICE9PSBcInN0cmluZ1wiKVxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBjb25uZWN0T3B0aW9ucy5ob3N0c1tpXSwgXCJjb25uZWN0T3B0aW9ucy5ob3N0c1tcIitpK1wiXVwiXSkpO1xuXHRcdFx0XHRcdFx0aWYgKC9eKHdzcz8pOlxcL1xcLygoXFxbKC4rKVxcXSl8KFteXFwvXSs/KSkoOihcXGQrKSk/KFxcLy4qKSQvLnRlc3QoY29ubmVjdE9wdGlvbnMuaG9zdHNbaV0pKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChpID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0dXNpbmdVUklzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICghdXNpbmdVUklzKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY29ubmVjdE9wdGlvbnMuaG9zdHNbaV0sIFwiY29ubmVjdE9wdGlvbnMuaG9zdHNbXCIraStcIl1cIl0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICh1c2luZ1VSSXMpIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY29ubmVjdE9wdGlvbnMuaG9zdHNbaV0sIFwiY29ubmVjdE9wdGlvbnMuaG9zdHNbXCIraStcIl1cIl0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIXVzaW5nVVJJcykge1xuXHRcdFx0XHRcdFx0aWYgKCFjb25uZWN0T3B0aW9ucy5wb3J0cylcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY29ubmVjdE9wdGlvbnMucG9ydHMsIFwiY29ubmVjdE9wdGlvbnMucG9ydHNcIl0pKTtcblx0XHRcdFx0XHRcdGlmICghKGNvbm5lY3RPcHRpb25zLnBvcnRzIGluc3RhbmNlb2YgQXJyYXkpIClcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY29ubmVjdE9wdGlvbnMucG9ydHMsIFwiY29ubmVjdE9wdGlvbnMucG9ydHNcIl0pKTtcblx0XHRcdFx0XHRcdGlmIChjb25uZWN0T3B0aW9ucy5ob3N0cy5sZW5ndGggIT09IGNvbm5lY3RPcHRpb25zLnBvcnRzLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbY29ubmVjdE9wdGlvbnMucG9ydHMsIFwiY29ubmVjdE9wdGlvbnMucG9ydHNcIl0pKTtcblxuXHRcdFx0XHRcdFx0Y29ubmVjdE9wdGlvbnMudXJpcyA9IFtdO1xuXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaTxjb25uZWN0T3B0aW9ucy5ob3N0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbm5lY3RPcHRpb25zLnBvcnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGNvbm5lY3RPcHRpb25zLnBvcnRzW2ldIDwgMClcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZm9ybWF0KEVSUk9SLklOVkFMSURfVFlQRSwgW3R5cGVvZiBjb25uZWN0T3B0aW9ucy5wb3J0c1tpXSwgXCJjb25uZWN0T3B0aW9ucy5wb3J0c1tcIitpK1wiXVwiXSkpO1xuXHRcdFx0XHRcdFx0XHR2YXIgaG9zdCA9IGNvbm5lY3RPcHRpb25zLmhvc3RzW2ldO1xuXHRcdFx0XHRcdFx0XHR2YXIgcG9ydCA9IGNvbm5lY3RPcHRpb25zLnBvcnRzW2ldO1xuXG5cdFx0XHRcdFx0XHRcdHZhciBpcHY2ID0gKGhvc3QuaW5kZXhPZihcIjpcIikgIT09IC0xKTtcblx0XHRcdFx0XHRcdFx0dXJpID0gXCJ3czovL1wiKyhpcHY2P1wiW1wiK2hvc3QrXCJdXCI6aG9zdCkrXCI6XCIrcG9ydCtwYXRoO1xuXHRcdFx0XHRcdFx0XHRjb25uZWN0T3B0aW9ucy51cmlzLnB1c2godXJpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29ubmVjdE9wdGlvbnMudXJpcyA9IGNvbm5lY3RPcHRpb25zLmhvc3RzO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNsaWVudC5jb25uZWN0KGNvbm5lY3RPcHRpb25zKTtcblx0XHRcdH07XG5cblx0XHRcdC8qKlxuXHRcdCAqIFN1YnNjcmliZSBmb3IgbWVzc2FnZXMsIHJlcXVlc3QgcmVjZWlwdCBvZiBhIGNvcHkgb2YgbWVzc2FnZXMgc2VudCB0byB0aGUgZGVzdGluYXRpb25zIGRlc2NyaWJlZCBieSB0aGUgZmlsdGVyLlxuXHRcdCAqXG5cdFx0ICogQG5hbWUgUGFoby5DbGllbnQjc3Vic2NyaWJlXG5cdFx0ICogQGZ1bmN0aW9uXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGZpbHRlciBkZXNjcmliaW5nIHRoZSBkZXN0aW5hdGlvbnMgdG8gcmVjZWl2ZSBtZXNzYWdlcyBmcm9tLlxuXHRcdCAqIDxicj5cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gc3Vic2NyaWJlT3B0aW9ucyAtIHVzZWQgdG8gY29udHJvbCB0aGUgc3Vic2NyaXB0aW9uXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gc3Vic2NyaWJlT3B0aW9ucy5xb3MgLSB0aGUgbWF4aW11bSBxb3Mgb2YgYW55IHB1YmxpY2F0aW9ucyBzZW50XG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgYSByZXN1bHQgb2YgbWFraW5nIHRoaXMgc3Vic2NyaXB0aW9uLlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBzdWJzY3JpYmVPcHRpb25zLmludm9jYXRpb25Db250ZXh0IC0gcGFzc2VkIHRvIHRoZSBvblN1Y2Nlc3MgY2FsbGJhY2tcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvciBvbkZhaWx1cmUgY2FsbGJhY2suXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gc3Vic2NyaWJlT3B0aW9ucy5vblN1Y2Nlc3MgLSBjYWxsZWQgd2hlbiB0aGUgc3Vic2NyaWJlIGFja25vd2xlZGdlbWVudFxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhcyBiZWVuIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlci5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBIHNpbmdsZSByZXNwb25zZSBvYmplY3QgcGFyYW1ldGVyIGlzIHBhc3NlZCB0byB0aGUgb25TdWNjZXNzIGNhbGxiYWNrIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5pbnZvY2F0aW9uQ29udGV4dCBpZiBzZXQgaW4gdGhlIHN1YnNjcmliZU9wdGlvbnMuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9vbD5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdWJzY3JpYmVPcHRpb25zLm9uRmFpbHVyZSAtIGNhbGxlZCB3aGVuIHRoZSBzdWJzY3JpYmUgcmVxdWVzdCBoYXMgZmFpbGVkIG9yIHRpbWVkIG91dC5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBIHNpbmdsZSByZXNwb25zZSBvYmplY3QgcGFyYW1ldGVyIGlzIHBhc3NlZCB0byB0aGUgb25GYWlsdXJlIGNhbGxiYWNrIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5pbnZvY2F0aW9uQ29udGV4dCAtIGlmIHNldCBpbiB0aGUgc3Vic2NyaWJlT3B0aW9ucy5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+ZXJyb3JDb2RlIC0gYSBudW1iZXIgaW5kaWNhdGluZyB0aGUgbmF0dXJlIG9mIHRoZSBlcnJvci5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+ZXJyb3JNZXNzYWdlIC0gdGV4dCBkZXNjcmliaW5nIHRoZSBlcnJvci5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29sPlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWJzY3JpYmVPcHRpb25zLnRpbWVvdXQgLSB3aGljaCwgaWYgcHJlc2VudCwgZGV0ZXJtaW5lcyB0aGUgbnVtYmVyIG9mXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyBhZnRlciB3aGljaCB0aGUgb25GYWlsdXJlIGNhbGJhY2sgaXMgY2FsbGVkLlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBwcmVzZW5jZSBvZiBhIHRpbWVvdXQgZG9lcyBub3QgcHJldmVudCB0aGUgb25TdWNjZXNzXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgZnJvbSBiZWluZyBjYWxsZWQgd2hlbiB0aGUgc3Vic2NyaWJlIGNvbXBsZXRlcy5cblx0XHQgKiBAdGhyb3dzIHtJbnZhbGlkU3RhdGV9IGlmIHRoZSBjbGllbnQgaXMgbm90IGluIGNvbm5lY3RlZCBzdGF0ZS5cblx0XHQgKi9cblx0XHRcdHRoaXMuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGZpbHRlciwgc3Vic2NyaWJlT3B0aW9ucykge1xuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlciAhPT0gXCJzdHJpbmdcIiAmJiBmaWx0ZXIuY29uc3RydWN0b3IgIT09IEFycmF5KVxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYXJndW1lbnQ6XCIrZmlsdGVyKTtcblx0XHRcdFx0c3Vic2NyaWJlT3B0aW9ucyA9IHN1YnNjcmliZU9wdGlvbnMgfHwge30gO1xuXHRcdFx0XHR2YWxpZGF0ZShzdWJzY3JpYmVPcHRpb25zLCAge3FvczpcIm51bWJlclwiLFxuXHRcdFx0XHRcdGludm9jYXRpb25Db250ZXh0Olwib2JqZWN0XCIsXG5cdFx0XHRcdFx0b25TdWNjZXNzOlwiZnVuY3Rpb25cIixcblx0XHRcdFx0XHRvbkZhaWx1cmU6XCJmdW5jdGlvblwiLFxuXHRcdFx0XHRcdHRpbWVvdXQ6XCJudW1iZXJcIlxuXHRcdFx0XHR9KTtcblx0XHRcdFx0aWYgKHN1YnNjcmliZU9wdGlvbnMudGltZW91dCAmJiAhc3Vic2NyaWJlT3B0aW9ucy5vbkZhaWx1cmUpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3Vic2NyaWJlT3B0aW9ucy50aW1lb3V0IHNwZWNpZmllZCB3aXRoIG5vIG9uRmFpbHVyZSBjYWxsYmFjay5cIik7XG5cdFx0XHRcdGlmICh0eXBlb2Ygc3Vic2NyaWJlT3B0aW9ucy5xb3MgIT09IFwidW5kZWZpbmVkXCIgJiYgIShzdWJzY3JpYmVPcHRpb25zLnFvcyA9PT0gMCB8fCBzdWJzY3JpYmVPcHRpb25zLnFvcyA9PT0gMSB8fCBzdWJzY3JpYmVPcHRpb25zLnFvcyA9PT0gMiApKVxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCwgW3N1YnNjcmliZU9wdGlvbnMucW9zLCBcInN1YnNjcmliZU9wdGlvbnMucW9zXCJdKSk7XG5cdFx0XHRcdGNsaWVudC5zdWJzY3JpYmUoZmlsdGVyLCBzdWJzY3JpYmVPcHRpb25zKTtcblx0XHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBVbnN1YnNjcmliZSBmb3IgbWVzc2FnZXMsIHN0b3AgcmVjZWl2aW5nIG1lc3NhZ2VzIHNlbnQgdG8gZGVzdGluYXRpb25zIGRlc2NyaWJlZCBieSB0aGUgZmlsdGVyLlxuXHRcdCAqXG5cdFx0ICogQG5hbWUgUGFoby5DbGllbnQjdW5zdWJzY3JpYmVcblx0XHQgKiBAZnVuY3Rpb25cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gZmlsdGVyIC0gZGVzY3JpYmluZyB0aGUgZGVzdGluYXRpb25zIHRvIHJlY2VpdmUgbWVzc2FnZXMgZnJvbS5cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gdW5zdWJzY3JpYmVPcHRpb25zIC0gdXNlZCB0byBjb250cm9sIHRoZSBzdWJzY3JpcHRpb25cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gdW5zdWJzY3JpYmVPcHRpb25zLmludm9jYXRpb25Db250ZXh0IC0gcGFzc2VkIHRvIHRoZSBvblN1Y2Nlc3MgY2FsbGJhY2tcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgIG9yIG9uRmFpbHVyZSBjYWxsYmFjay5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSB1bnN1YnNjcmliZU9wdGlvbnMub25TdWNjZXNzIC0gY2FsbGVkIHdoZW4gdGhlIHVuc3Vic2NyaWJlIGFja25vd2xlZGdlbWVudCBoYXMgYmVlbiByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXIuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBIHNpbmdsZSByZXNwb25zZSBvYmplY3QgcGFyYW1ldGVyIGlzIHBhc3NlZCB0byB0aGVcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyBjYWxsYmFjayBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9sPlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPmludm9jYXRpb25Db250ZXh0IC0gaWYgc2V0IGluIHRoZSB1bnN1YnNjcmliZU9wdGlvbnMuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29sPlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IHVuc3Vic2NyaWJlT3B0aW9ucy5vbkZhaWx1cmUgY2FsbGVkIHdoZW4gdGhlIHVuc3Vic2NyaWJlIHJlcXVlc3QgaGFzIGZhaWxlZCBvciB0aW1lZCBvdXQuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBIHNpbmdsZSByZXNwb25zZSBvYmplY3QgcGFyYW1ldGVyIGlzIHBhc3NlZCB0byB0aGUgb25GYWlsdXJlIGNhbGxiYWNrIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b2w+XG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+aW52b2NhdGlvbkNvbnRleHQgLSBpZiBzZXQgaW4gdGhlIHVuc3Vic2NyaWJlT3B0aW9ucy5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5lcnJvckNvZGUgLSBhIG51bWJlciBpbmRpY2F0aW5nIHRoZSBuYXR1cmUgb2YgdGhlIGVycm9yLlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPmVycm9yTWVzc2FnZSAtIHRleHQgZGVzY3JpYmluZyB0aGUgZXJyb3IuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29sPlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB1bnN1YnNjcmliZU9wdGlvbnMudGltZW91dCAtIHdoaWNoLCBpZiBwcmVzZW50LCBkZXRlcm1pbmVzIHRoZSBudW1iZXIgb2Ygc2Vjb25kc1xuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXIgd2hpY2ggdGhlIG9uRmFpbHVyZSBjYWxsYmFjayBpcyBjYWxsZWQuIFRoZSBwcmVzZW5jZSBvZlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSB0aW1lb3V0IGRvZXMgbm90IHByZXZlbnQgdGhlIG9uU3VjY2VzcyBjYWxsYmFjayBmcm9tIGJlaW5nXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWQgd2hlbiB0aGUgdW5zdWJzY3JpYmUgY29tcGxldGVzXG5cdFx0ICogQHRocm93cyB7SW52YWxpZFN0YXRlfSBpZiB0aGUgY2xpZW50IGlzIG5vdCBpbiBjb25uZWN0ZWQgc3RhdGUuXG5cdFx0ICovXG5cdFx0XHR0aGlzLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGZpbHRlciwgdW5zdWJzY3JpYmVPcHRpb25zKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyICE9PSBcInN0cmluZ1wiICYmIGZpbHRlci5jb25zdHJ1Y3RvciAhPT0gQXJyYXkpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBhcmd1bWVudDpcIitmaWx0ZXIpO1xuXHRcdFx0XHR1bnN1YnNjcmliZU9wdGlvbnMgPSB1bnN1YnNjcmliZU9wdGlvbnMgfHwge30gO1xuXHRcdFx0XHR2YWxpZGF0ZSh1bnN1YnNjcmliZU9wdGlvbnMsICB7aW52b2NhdGlvbkNvbnRleHQ6XCJvYmplY3RcIixcblx0XHRcdFx0XHRvblN1Y2Nlc3M6XCJmdW5jdGlvblwiLFxuXHRcdFx0XHRcdG9uRmFpbHVyZTpcImZ1bmN0aW9uXCIsXG5cdFx0XHRcdFx0dGltZW91dDpcIm51bWJlclwiXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRpZiAodW5zdWJzY3JpYmVPcHRpb25zLnRpbWVvdXQgJiYgIXVuc3Vic2NyaWJlT3B0aW9ucy5vbkZhaWx1cmUpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwidW5zdWJzY3JpYmVPcHRpb25zLnRpbWVvdXQgc3BlY2lmaWVkIHdpdGggbm8gb25GYWlsdXJlIGNhbGxiYWNrLlwiKTtcblx0XHRcdFx0Y2xpZW50LnVuc3Vic2NyaWJlKGZpbHRlciwgdW5zdWJzY3JpYmVPcHRpb25zKTtcblx0XHRcdH07XG5cblx0XHRcdC8qKlxuXHRcdCAqIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBjb25zdW1lcnMgb2YgdGhlIGRlc3RpbmF0aW9uIGluIHRoZSBNZXNzYWdlLlxuXHRcdCAqXG5cdFx0ICogQG5hbWUgUGFoby5DbGllbnQjc2VuZFxuXHRcdCAqIEBmdW5jdGlvblxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfFBhaG8uTWVzc2FnZX0gdG9waWMgLSA8Yj5tYW5kYXRvcnk8L2I+IFRoZSBuYW1lIG9mIHRoZSBkZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgbWVzc2FnZSBpcyB0byBiZSBzZW50LlxuXHRcdCAqIFx0XHRcdFx0XHQgICAtIElmIGl0IGlzIHRoZSBvbmx5IHBhcmFtZXRlciwgdXNlZCBhcyBQYWhvLk1lc3NhZ2Ugb2JqZWN0LlxuXHRcdCAqIEBwYXJhbSB7U3RyaW5nfEFycmF5QnVmZmVyfSBwYXlsb2FkIC0gVGhlIG1lc3NhZ2UgZGF0YSB0byBiZSBzZW50LlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBxb3MgVGhlIFF1YWxpdHkgb2YgU2VydmljZSB1c2VkIHRvIGRlbGl2ZXIgdGhlIG1lc3NhZ2UuXG5cdFx0ICogXHRcdDxkbD5cblx0XHQgKiBcdFx0XHQ8ZHQ+MCBCZXN0IGVmZm9ydCAoZGVmYXVsdCkuXG5cdFx0ICogICAgIFx0XHRcdDxkdD4xIEF0IGxlYXN0IG9uY2UuXG5cdFx0ICogICAgIFx0XHRcdDxkdD4yIEV4YWN0bHkgb25jZS5cblx0XHQgKiBcdFx0PC9kbD5cblx0XHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJldGFpbmVkIElmIHRydWUsIHRoZSBtZXNzYWdlIGlzIHRvIGJlIHJldGFpbmVkIGJ5IHRoZSBzZXJ2ZXIgYW5kIGRlbGl2ZXJlZFxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgdG8gYm90aCBjdXJyZW50IGFuZCBmdXR1cmUgc3Vic2NyaXB0aW9ucy5cblx0XHQgKiAgICAgICAgICAgICAgICAgICAgIElmIGZhbHNlIHRoZSBzZXJ2ZXIgb25seSBkZWxpdmVycyB0aGUgbWVzc2FnZSB0byBjdXJyZW50IHN1YnNjcmliZXJzLCB0aGlzIGlzIHRoZSBkZWZhdWx0IGZvciBuZXcgTWVzc2FnZXMuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICBBIHJlY2VpdmVkIG1lc3NhZ2UgaGFzIHRoZSByZXRhaW5lZCBib29sZWFuIHNldCB0byB0cnVlIGlmIHRoZSBtZXNzYWdlIHdhcyBwdWJsaXNoZWRcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgIHdpdGggdGhlIHJldGFpbmVkIGJvb2xlYW4gc2V0IHRvIHRydWVcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGUgc3Vic2NycHRpb24gd2FzIG1hZGUgYWZ0ZXIgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gcHVibGlzaGVkLlxuXHRcdCAqIEB0aHJvd3Mge0ludmFsaWRTdGF0ZX0gaWYgdGhlIGNsaWVudCBpcyBub3QgY29ubmVjdGVkLlxuXHRcdCAqL1xuXHRcdFx0dGhpcy5zZW5kID0gZnVuY3Rpb24gKHRvcGljLHBheWxvYWQscW9zLHJldGFpbmVkKSB7XG5cdFx0XHRcdHZhciBtZXNzYWdlIDtcblxuXHRcdFx0XHRpZihhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGFyZ3VtZW50LlwiK1wibGVuZ3RoXCIpO1xuXG5cdFx0XHRcdH1lbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xuXG5cdFx0XHRcdFx0aWYgKCEodG9waWMgaW5zdGFuY2VvZiBNZXNzYWdlKSAmJiAodHlwZW9mIHRvcGljICE9PSBcInN0cmluZ1wiKSlcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYXJndW1lbnQ6XCIrIHR5cGVvZiB0b3BpYyk7XG5cblx0XHRcdFx0XHRtZXNzYWdlID0gdG9waWM7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBtZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSA9PT0gXCJ1bmRlZmluZWRcIilcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCxbbWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUsXCJNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZVwiXSkpO1xuXHRcdFx0XHRcdGNsaWVudC5zZW5kKG1lc3NhZ2UpO1xuXG5cdFx0XHRcdH1lbHNlIHtcblx0XHRcdFx0Ly9wYXJhbWV0ZXIgY2hlY2tpbmcgaW4gTWVzc2FnZSBvYmplY3Rcblx0XHRcdFx0XHRtZXNzYWdlID0gbmV3IE1lc3NhZ2UocGF5bG9hZCk7XG5cdFx0XHRcdFx0bWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUgPSB0b3BpYztcblx0XHRcdFx0XHRpZihhcmd1bWVudHMubGVuZ3RoID49IDMpXG5cdFx0XHRcdFx0XHRtZXNzYWdlLnFvcyA9IHFvcztcblx0XHRcdFx0XHRpZihhcmd1bWVudHMubGVuZ3RoID49IDQpXG5cdFx0XHRcdFx0XHRtZXNzYWdlLnJldGFpbmVkID0gcmV0YWluZWQ7XG5cdFx0XHRcdFx0Y2xpZW50LnNlbmQobWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdC8qKlxuXHRcdCAqIFB1Ymxpc2ggYSBtZXNzYWdlIHRvIHRoZSBjb25zdW1lcnMgb2YgdGhlIGRlc3RpbmF0aW9uIGluIHRoZSBNZXNzYWdlLlxuXHRcdCAqIFN5bm9ueW0gZm9yIFBhaG8uTXF0dC5DbGllbnQjc2VuZFxuXHRcdCAqXG5cdFx0ICogQG5hbWUgUGFoby5DbGllbnQjcHVibGlzaFxuXHRcdCAqIEBmdW5jdGlvblxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfFBhaG8uTWVzc2FnZX0gdG9waWMgLSA8Yj5tYW5kYXRvcnk8L2I+IFRoZSBuYW1lIG9mIHRoZSB0b3BpYyB0byB3aGljaCB0aGUgbWVzc2FnZSBpcyB0byBiZSBwdWJsaXNoZWQuXG5cdFx0ICogXHRcdFx0XHRcdCAgIC0gSWYgaXQgaXMgdGhlIG9ubHkgcGFyYW1ldGVyLCB1c2VkIGFzIFBhaG8uTWVzc2FnZSBvYmplY3QuXG5cdFx0ICogQHBhcmFtIHtTdHJpbmd8QXJyYXlCdWZmZXJ9IHBheWxvYWQgLSBUaGUgbWVzc2FnZSBkYXRhIHRvIGJlIHB1Ymxpc2hlZC5cblx0XHQgKiBAcGFyYW0ge251bWJlcn0gcW9zIFRoZSBRdWFsaXR5IG9mIFNlcnZpY2UgdXNlZCB0byBkZWxpdmVyIHRoZSBtZXNzYWdlLlxuXHRcdCAqIFx0XHQ8ZGw+XG5cdFx0ICogXHRcdFx0PGR0PjAgQmVzdCBlZmZvcnQgKGRlZmF1bHQpLlxuXHRcdCAqICAgICBcdFx0XHQ8ZHQ+MSBBdCBsZWFzdCBvbmNlLlxuXHRcdCAqICAgICBcdFx0XHQ8ZHQ+MiBFeGFjdGx5IG9uY2UuXG5cdFx0ICogXHRcdDwvZGw+XG5cdFx0ICogQHBhcmFtIHtCb29sZWFufSByZXRhaW5lZCBJZiB0cnVlLCB0aGUgbWVzc2FnZSBpcyB0byBiZSByZXRhaW5lZCBieSB0aGUgc2VydmVyIGFuZCBkZWxpdmVyZWRcblx0XHQgKiAgICAgICAgICAgICAgICAgICAgIHRvIGJvdGggY3VycmVudCBhbmQgZnV0dXJlIHN1YnNjcmlwdGlvbnMuXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICBJZiBmYWxzZSB0aGUgc2VydmVyIG9ubHkgZGVsaXZlcnMgdGhlIG1lc3NhZ2UgdG8gY3VycmVudCBzdWJzY3JpYmVycywgdGhpcyBpcyB0aGUgZGVmYXVsdCBmb3IgbmV3IE1lc3NhZ2VzLlxuXHRcdCAqICAgICAgICAgICAgICAgICAgICAgQSByZWNlaXZlZCBtZXNzYWdlIGhhcyB0aGUgcmV0YWluZWQgYm9vbGVhbiBzZXQgdG8gdHJ1ZSBpZiB0aGUgbWVzc2FnZSB3YXMgcHVibGlzaGVkXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICB3aXRoIHRoZSByZXRhaW5lZCBib29sZWFuIHNldCB0byB0cnVlXG5cdFx0ICogICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIHN1YnNjcnB0aW9uIHdhcyBtYWRlIGFmdGVyIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHB1Ymxpc2hlZC5cblx0XHQgKiBAdGhyb3dzIHtJbnZhbGlkU3RhdGV9IGlmIHRoZSBjbGllbnQgaXMgbm90IGNvbm5lY3RlZC5cblx0XHQgKi9cblx0XHRcdHRoaXMucHVibGlzaCA9IGZ1bmN0aW9uKHRvcGljLHBheWxvYWQscW9zLHJldGFpbmVkKSB7XG5cdFx0XHRcdHZhciBtZXNzYWdlIDtcblxuXHRcdFx0XHRpZihhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGFyZ3VtZW50LlwiK1wibGVuZ3RoXCIpO1xuXG5cdFx0XHRcdH1lbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xuXG5cdFx0XHRcdFx0aWYgKCEodG9waWMgaW5zdGFuY2VvZiBNZXNzYWdlKSAmJiAodHlwZW9mIHRvcGljICE9PSBcInN0cmluZ1wiKSlcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYXJndW1lbnQ6XCIrIHR5cGVvZiB0b3BpYyk7XG5cblx0XHRcdFx0XHRtZXNzYWdlID0gdG9waWM7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBtZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSA9PT0gXCJ1bmRlZmluZWRcIilcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCxbbWVzc2FnZS5kZXN0aW5hdGlvbk5hbWUsXCJNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZVwiXSkpO1xuXHRcdFx0XHRcdGNsaWVudC5zZW5kKG1lc3NhZ2UpO1xuXG5cdFx0XHRcdH1lbHNlIHtcblx0XHRcdFx0XHQvL3BhcmFtZXRlciBjaGVja2luZyBpbiBNZXNzYWdlIG9iamVjdFxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBuZXcgTWVzc2FnZShwYXlsb2FkKTtcblx0XHRcdFx0XHRtZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSA9IHRvcGljO1xuXHRcdFx0XHRcdGlmKGFyZ3VtZW50cy5sZW5ndGggPj0gMylcblx0XHRcdFx0XHRcdG1lc3NhZ2UucW9zID0gcW9zO1xuXHRcdFx0XHRcdGlmKGFyZ3VtZW50cy5sZW5ndGggPj0gNClcblx0XHRcdFx0XHRcdG1lc3NhZ2UucmV0YWluZWQgPSByZXRhaW5lZDtcblx0XHRcdFx0XHRjbGllbnQuc2VuZChtZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0LyoqXG5cdFx0ICogTm9ybWFsIGRpc2Nvbm5lY3Qgb2YgdGhpcyBNZXNzYWdpbmcgY2xpZW50IGZyb20gaXRzIHNlcnZlci5cblx0XHQgKlxuXHRcdCAqIEBuYW1lIFBhaG8uQ2xpZW50I2Rpc2Nvbm5lY3Rcblx0XHQgKiBAZnVuY3Rpb25cblx0XHQgKiBAdGhyb3dzIHtJbnZhbGlkU3RhdGV9IGlmIHRoZSBjbGllbnQgaXMgYWxyZWFkeSBkaXNjb25uZWN0ZWQuXG5cdFx0ICovXG5cdFx0XHR0aGlzLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNsaWVudC5kaXNjb25uZWN0KCk7XG5cdFx0XHR9O1xuXG5cdFx0XHQvKipcblx0XHQgKiBHZXQgdGhlIGNvbnRlbnRzIG9mIHRoZSB0cmFjZSBsb2cuXG5cdFx0ICpcblx0XHQgKiBAbmFtZSBQYWhvLkNsaWVudCNnZXRUcmFjZUxvZ1xuXHRcdCAqIEBmdW5jdGlvblxuXHRcdCAqIEByZXR1cm4ge09iamVjdFtdfSB0cmFjZWJ1ZmZlciBjb250YWluaW5nIHRoZSB0aW1lIG9yZGVyZWQgdHJhY2UgcmVjb3Jkcy5cblx0XHQgKi9cblx0XHRcdHRoaXMuZ2V0VHJhY2VMb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBjbGllbnQuZ2V0VHJhY2VMb2coKTtcblx0XHRcdH07XG5cblx0XHRcdC8qKlxuXHRcdCAqIFN0YXJ0IHRyYWNpbmcuXG5cdFx0ICpcblx0XHQgKiBAbmFtZSBQYWhvLkNsaWVudCNzdGFydFRyYWNlXG5cdFx0ICogQGZ1bmN0aW9uXG5cdFx0ICovXG5cdFx0XHR0aGlzLnN0YXJ0VHJhY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNsaWVudC5zdGFydFRyYWNlKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHQvKipcblx0XHQgKiBTdG9wIHRyYWNpbmcuXG5cdFx0ICpcblx0XHQgKiBAbmFtZSBQYWhvLkNsaWVudCNzdG9wVHJhY2Vcblx0XHQgKiBAZnVuY3Rpb25cblx0XHQgKi9cblx0XHRcdHRoaXMuc3RvcFRyYWNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRjbGllbnQuc3RvcFRyYWNlKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBjbGllbnQuY29ubmVjdGVkO1xuXHRcdFx0fTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdCAqIEFuIGFwcGxpY2F0aW9uIG1lc3NhZ2UsIHNlbnQgb3IgcmVjZWl2ZWQuXG5cdCAqIDxwPlxuXHQgKiBBbGwgYXR0cmlidXRlcyBtYXkgYmUgbnVsbCwgd2hpY2ggaW1wbGllcyB0aGUgZGVmYXVsdCB2YWx1ZXMuXG5cdCAqXG5cdCAqIEBuYW1lIFBhaG8uTWVzc2FnZVxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtTdHJpbmd8QXJyYXlCdWZmZXJ9IHBheWxvYWQgVGhlIG1lc3NhZ2UgZGF0YSB0byBiZSBzZW50LlxuXHQgKiA8cD5cblx0ICogQHByb3BlcnR5IHtzdHJpbmd9IHBheWxvYWRTdHJpbmcgPGk+cmVhZCBvbmx5PC9pPiBUaGUgcGF5bG9hZCBhcyBhIHN0cmluZyBpZiB0aGUgcGF5bG9hZCBjb25zaXN0cyBvZiB2YWxpZCBVVEYtOCBjaGFyYWN0ZXJzLlxuXHQgKiBAcHJvcGVydHkge0FycmF5QnVmZmVyfSBwYXlsb2FkQnl0ZXMgPGk+cmVhZCBvbmx5PC9pPiBUaGUgcGF5bG9hZCBhcyBhbiBBcnJheUJ1ZmZlci5cblx0ICogPHA+XG5cdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBkZXN0aW5hdGlvbk5hbWUgPGI+bWFuZGF0b3J5PC9iPiBUaGUgbmFtZSBvZiB0aGUgZGVzdGluYXRpb24gdG8gd2hpY2ggdGhlIG1lc3NhZ2UgaXMgdG8gYmUgc2VudFxuXHQgKiAgICAgICAgICAgICAgICAgICAgKGZvciBtZXNzYWdlcyBhYm91dCB0byBiZSBzZW50KSBvciB0aGUgbmFtZSBvZiB0aGUgZGVzdGluYXRpb24gZnJvbSB3aGljaCB0aGUgbWVzc2FnZSBoYXMgYmVlbiByZWNlaXZlZC5cblx0ICogICAgICAgICAgICAgICAgICAgIChmb3IgbWVzc2FnZXMgcmVjZWl2ZWQgYnkgdGhlIG9uTWVzc2FnZSBmdW5jdGlvbikuXG5cdCAqIDxwPlxuXHQgKiBAcHJvcGVydHkge251bWJlcn0gcW9zIFRoZSBRdWFsaXR5IG9mIFNlcnZpY2UgdXNlZCB0byBkZWxpdmVyIHRoZSBtZXNzYWdlLlxuXHQgKiA8ZGw+XG5cdCAqICAgICA8ZHQ+MCBCZXN0IGVmZm9ydCAoZGVmYXVsdCkuXG5cdCAqICAgICA8ZHQ+MSBBdCBsZWFzdCBvbmNlLlxuXHQgKiAgICAgPGR0PjIgRXhhY3RseSBvbmNlLlxuXHQgKiA8L2RsPlxuXHQgKiA8cD5cblx0ICogQHByb3BlcnR5IHtCb29sZWFufSByZXRhaW5lZCBJZiB0cnVlLCB0aGUgbWVzc2FnZSBpcyB0byBiZSByZXRhaW5lZCBieSB0aGUgc2VydmVyIGFuZCBkZWxpdmVyZWRcblx0ICogICAgICAgICAgICAgICAgICAgICB0byBib3RoIGN1cnJlbnQgYW5kIGZ1dHVyZSBzdWJzY3JpcHRpb25zLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgIElmIGZhbHNlIHRoZSBzZXJ2ZXIgb25seSBkZWxpdmVycyB0aGUgbWVzc2FnZSB0byBjdXJyZW50IHN1YnNjcmliZXJzLCB0aGlzIGlzIHRoZSBkZWZhdWx0IGZvciBuZXcgTWVzc2FnZXMuXG5cdCAqICAgICAgICAgICAgICAgICAgICAgQSByZWNlaXZlZCBtZXNzYWdlIGhhcyB0aGUgcmV0YWluZWQgYm9vbGVhbiBzZXQgdG8gdHJ1ZSBpZiB0aGUgbWVzc2FnZSB3YXMgcHVibGlzaGVkXG5cdCAqICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aGUgcmV0YWluZWQgYm9vbGVhbiBzZXQgdG8gdHJ1ZVxuXHQgKiAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGUgc3Vic2NycHRpb24gd2FzIG1hZGUgYWZ0ZXIgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gcHVibGlzaGVkLlxuXHQgKiA8cD5cblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBkdXBsaWNhdGUgPGk+cmVhZCBvbmx5PC9pPiBJZiB0cnVlLCB0aGlzIG1lc3NhZ2UgbWlnaHQgYmUgYSBkdXBsaWNhdGUgb2Ygb25lIHdoaWNoIGhhcyBhbHJlYWR5IGJlZW4gcmVjZWl2ZWQuXG5cdCAqICAgICAgICAgICAgICAgICAgICAgVGhpcyBpcyBvbmx5IHNldCBvbiBtZXNzYWdlcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXIuXG5cdCAqXG5cdCAqL1xuXHRcdHZhciBNZXNzYWdlID0gZnVuY3Rpb24gKG5ld1BheWxvYWQpIHtcblx0XHRcdHZhciBwYXlsb2FkO1xuXHRcdFx0aWYgKCAgIHR5cGVvZiBuZXdQYXlsb2FkID09PSBcInN0cmluZ1wiIHx8XG5cdFx0bmV3UGF5bG9hZCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8XG5cdFx0KEFycmF5QnVmZmVyLmlzVmlldyhuZXdQYXlsb2FkKSAmJiAhKG5ld1BheWxvYWQgaW5zdGFuY2VvZiBEYXRhVmlldykpXG5cdFx0XHQpIHtcblx0XHRcdFx0cGF5bG9hZCA9IG5ld1BheWxvYWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyAoZm9ybWF0KEVSUk9SLklOVkFMSURfQVJHVU1FTlQsIFtuZXdQYXlsb2FkLCBcIm5ld1BheWxvYWRcIl0pKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGRlc3RpbmF0aW9uTmFtZTtcblx0XHRcdHZhciBxb3MgPSAwO1xuXHRcdFx0dmFyIHJldGFpbmVkID0gZmFsc2U7XG5cdFx0XHR2YXIgZHVwbGljYXRlID0gZmFsc2U7XG5cblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMse1xuXHRcdFx0XHRcInBheWxvYWRTdHJpbmdcIjp7XG5cdFx0XHRcdFx0ZW51bWVyYWJsZSA6IHRydWUsXG5cdFx0XHRcdFx0Z2V0IDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGF5bG9hZDtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHBhcnNlVVRGOChwYXlsb2FkLCAwLCBwYXlsb2FkLmxlbmd0aCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcInBheWxvYWRCeXRlc1wiOntcblx0XHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihVVEY4TGVuZ3RoKHBheWxvYWQpKTtcblx0XHRcdFx0XHRcdFx0dmFyIGJ5dGVTdHJlYW0gPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuXHRcdFx0XHRcdFx0XHRzdHJpbmdUb1VURjgocGF5bG9hZCwgYnl0ZVN0cmVhbSwgMCk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJ5dGVTdHJlYW07XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGF5bG9hZDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiZGVzdGluYXRpb25OYW1lXCI6e1xuXHRcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGRlc3RpbmF0aW9uTmFtZTsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld0Rlc3RpbmF0aW9uTmFtZSkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBuZXdEZXN0aW5hdGlvbk5hbWUgPT09IFwic3RyaW5nXCIpXG5cdFx0XHRcdFx0XHRcdGRlc3RpbmF0aW9uTmFtZSA9IG5ld0Rlc3RpbmF0aW9uTmFtZTtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGZvcm1hdChFUlJPUi5JTlZBTElEX0FSR1VNRU5ULCBbbmV3RGVzdGluYXRpb25OYW1lLCBcIm5ld0Rlc3RpbmF0aW9uTmFtZVwiXSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJxb3NcIjp7XG5cdFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gcW9zOyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24obmV3UW9zKSB7XG5cdFx0XHRcdFx0XHRpZiAobmV3UW9zID09PSAwIHx8IG5ld1FvcyA9PT0gMSB8fCBuZXdRb3MgPT09IDIgKVxuXHRcdFx0XHRcdFx0XHRxb3MgPSBuZXdRb3M7XG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYXJndW1lbnQ6XCIrbmV3UW9zKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwicmV0YWluZWRcIjp7XG5cdFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gcmV0YWluZWQ7IH0sXG5cdFx0XHRcdFx0c2V0OiBmdW5jdGlvbihuZXdSZXRhaW5lZCkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBuZXdSZXRhaW5lZCA9PT0gXCJib29sZWFuXCIpXG5cdFx0XHRcdFx0XHRcdHJldGFpbmVkID0gbmV3UmV0YWluZWQ7XG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihmb3JtYXQoRVJST1IuSU5WQUxJRF9BUkdVTUVOVCwgW25ld1JldGFpbmVkLCBcIm5ld1JldGFpbmVkXCJdKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcInRvcGljXCI6e1xuXHRcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRcdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGRlc3RpbmF0aW9uTmFtZTsgfSxcblx0XHRcdFx0XHRzZXQ6IGZ1bmN0aW9uKG5ld1RvcGljKSB7ZGVzdGluYXRpb25OYW1lPW5ld1RvcGljO31cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJkdXBsaWNhdGVcIjp7XG5cdFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZHVwbGljYXRlOyB9LFxuXHRcdFx0XHRcdHNldDogZnVuY3Rpb24obmV3RHVwbGljYXRlKSB7ZHVwbGljYXRlPW5ld0R1cGxpY2F0ZTt9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvLyBNb2R1bGUgY29udGVudHMuXG5cdFx0cmV0dXJuIHtcblx0XHRcdENsaWVudDogQ2xpZW50LFxuXHRcdFx0TWVzc2FnZTogTWVzc2FnZVxuXHRcdH07XG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuXHR9KSh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KTtcblx0cmV0dXJuIFBhaG9NUVRUO1xufSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5ITCA9IHZvaWQgMDtcbmNvbnN0IHBhaG9fbXF0dF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJwYWhvLW1xdHRcIikpO1xuZnVuY3Rpb24gZ2V0U2Vzc2lvbkNyZWRlbnRpYWxzKGhvc3QsIHBpcGVsaW5lSWQpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICB2YXIgdXJsID0gaG9zdCArIFwiL2dyYXBocWxcIjtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB5aWVsZCBmZXRjaCh1cmwsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBgXG4gICAgICAgICAgbXV0YXRpb24gKFxuICAgICAgICAgICAgJHBpcGVsaW5lSWQ6IFN0cmluZyFcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNyZWF0ZUhsU2VydmluZ1Nlc3Npb24ocGlwZWxpbmVJZDogJHBpcGVsaW5lSWQpIHtcbiAgICAgICAgICAgICAgc2Vzc2lvbkNyZWRlbnRpYWxzIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWRcbiAgICAgICAgICAgICAgICBzZXNzaW9uS2V5XG4gICAgICAgICAgICAgICAgd2Vic29ja2V0VXJsXG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0XG4gICAgICAgICAgICAgICAgaG9zdFxuICAgICAgICAgICAgICAgIHBvcnRcbiAgICAgICAgICAgICAgICB1c2VybmFtZVxuICAgICAgICAgICAgICAgIHBhc3N3b3JkXG4gICAgICAgICAgICAgICAgdG9waWNSZXF1ZXN0XG4gICAgICAgICAgICAgICAgdG9waWNSZXNwb25zZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVycm9yc1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgYCxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmVJZDogcGlwZWxpbmVJZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGV4dCA9IHlpZWxkIHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJSZXN1bHQ6IFwiICsgdGV4dCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgICB2YXIgY3JlZHMgPSByZXN1bHQuZGF0YS5jcmVhdGVIbFNlcnZpbmdTZXNzaW9uLnNlc3Npb25DcmVkZW50aWFscztcbiAgICAgICAgcmV0dXJuIGNyZWRzO1xuICAgIH0pO1xufVxuY2xhc3MgU3RyZWFtaW5nU2Vzc2lvbiB7XG4gICAgY29uc3RydWN0b3Ioc2Vzc2lvbkNyZWRlbnRpYWxzKSB7XG4gICAgICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IDIwMDA7XG4gICAgICAgIHRoaXMubXF0dENsaWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMub25NZXNzYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbkZhaWx1cmUgPSBudWxsO1xuICAgICAgICB0aGlzLnNlc3Npb25DcmVkZW50aWFscyA9IHNlc3Npb25DcmVkZW50aWFscztcbiAgICB9XG4gICAgX29uQ29ubmVjdGlvbkZhaWx1cmUobXF0dE1lc3NhZ2UpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkZhaWxlZCB0byBjb25uZWN0OiBcIiArIEpTT04uc3RyaW5naWZ5KG1xdHRNZXNzYWdlKSk7IC8vKyBtcXR0X2hvc3RfcG9ydCk7XG4gICAgICAgIGlmICh0aGlzLm9uRmFpbHVyZSAmJiB0eXBlb2YgdGhpcy5vbkZhaWx1cmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5vbkZhaWx1cmUobXF0dE1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5jb25uZWN0LCB0aGlzLnJlY29ubmVjdFRpbWVvdXQpO1xuICAgIH1cbiAgICBfb25NZXNzYWdlQXJyaXZlZChtcXR0TWVzc2FnZSkge1xuICAgICAgICBjb25zdCB0b3BpYyA9IG1xdHRNZXNzYWdlLmRlc3RpbmF0aW9uTmFtZTtcbiAgICAgICAgY29uc3QgbXF0dFBheWxvYWQgPSBtcXR0TWVzc2FnZS5wYXlsb2FkU3RyaW5nO1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQ6IFwiICsgdG9waWMgKyBcIjogXCIgKyBtcXR0UGF5bG9hZCk7XG4gICAgICAgIGNvbnN0IGhsTWVzc2FnZSA9IEpTT04ucGFyc2UobXF0dFBheWxvYWQpO1xuICAgICAgICBpZiAodGhpcy5vbk1lc3NhZ2UgJiYgdHlwZW9mIHRoaXMub25NZXNzYWdlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMub25NZXNzYWdlKGhsTWVzc2FnZS5jb21tYW5kLCBobE1lc3NhZ2UuZW50aXR5X2lkLCBobE1lc3NhZ2UucGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNvbm5lY3Rpbmcgd2l0aCBcIiArIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbkNyZWRlbnRpYWxzKSk7XG4gICAgICAgIHRoaXMubXF0dENsaWVudCA9IG5ldyBwYWhvX21xdHRfMS5kZWZhdWx0LkNsaWVudCh0aGlzLnNlc3Npb25DcmVkZW50aWFscy5ob3N0LCB0aGlzLnNlc3Npb25DcmVkZW50aWFscy5wb3J0LCB0aGlzLnNlc3Npb25DcmVkZW50aWFscy5zZXNzaW9uSWQpO1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgdGltZW91dDogMyxcbiAgICAgICAgICAgIHVzZVNTTDogdHJ1ZSxcbiAgICAgICAgICAgIHVzZXJOYW1lOiB0aGlzLnNlc3Npb25DcmVkZW50aWFscy51c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB0aGlzLnNlc3Npb25DcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgICAgICAgIG9uRmFpbHVyZTogdGhpcy5fb25Db25uZWN0aW9uRmFpbHVyZS5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgb25TdWNjZXNzOiB0aGlzLm9uQ29ubmVjdC5iaW5kKHRoaXMpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLm1xdHRDbGllbnQub25NZXNzYWdlQXJyaXZlZCA9IHRoaXMuX29uTWVzc2FnZUFycml2ZWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5tcXR0Q2xpZW50LmNvbm5lY3Qob3B0aW9ucyk7XG4gICAgfVxuICAgIG9uQ29ubmVjdCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWQgYW5kIHN1YnNjcmliaW5nIHRvOiBcIiArIHRoaXMuc2Vzc2lvbkNyZWRlbnRpYWxzLnRvcGljUmVzcG9uc2UpO1xuICAgICAgICBpZiAodGhpcy5tcXR0Q2xpZW50KSB7XG4gICAgICAgICAgICB0aGlzLm1xdHRDbGllbnQuc3Vic2NyaWJlKHRoaXMuc2Vzc2lvbkNyZWRlbnRpYWxzLnRvcGljUmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0cnlpbmcgdG8gY29ubmVjdCB3aXRob3V0IHNldHRpbmcgbXF0dENsaWVudFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdWJsaXNoKHBheWxvYWQpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBuZXcgcGFob19tcXR0XzEuZGVmYXVsdC5NZXNzYWdlKHBheWxvYWQpO1xuICAgICAgICBtZXNzYWdlLmRlc3RpbmF0aW9uTmFtZSA9IHRoaXMuc2Vzc2lvbkNyZWRlbnRpYWxzLnRvcGljUmVxdWVzdDtcbiAgICAgICAgbWVzc2FnZS5yZXRhaW5lZCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5tcXR0Q2xpZW50KVxuICAgICAgICAgICAgdGhpcy5tcXR0Q2xpZW50LnNlbmQobWVzc2FnZSk7XG4gICAgfVxuICAgIGluZmVyVGV4dChlbnRpdHlJZCwgcGF5bG9hZCwgZnJhbWVJZCkge1xuICAgICAgICB2YXIgdGV4dCA9IHtcbiAgICAgICAgICAgICd0eXBlJzogJ21sX3RleHQnLFxuICAgICAgICAgICAgJ2ZyYW1lcyc6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICdpZCc6IGZyYW1lSWQsXG4gICAgICAgICAgICAgICAgICAgICdzZW50ZW5jZSc6IHBheWxvYWQsXG4gICAgICAgICAgICAgICAgICAgICdlbnRpdHlfaWQnOiBlbnRpdHlJZCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgJ3ZlcnNpb24nOiAwLFxuICAgICAgICAgICAgJ2ZyYW1lX2lkJzogZnJhbWVJZCxcbiAgICAgICAgICAgICdjb21tYW5kJzogJ2luZmVyJyxcbiAgICAgICAgICAgICdzY2hlbWEnOiBbJ3RleHQnXSxcbiAgICAgICAgICAgICdlbnRpdHlfaWQnOiBlbnRpdHlJZCxcbiAgICAgICAgICAgICdwYXlsb2FkJzogdGV4dFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBtcXR0X3BheWxvYWQgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInB1Ymxpc2hpbmcgcGF5bG9hZDogXCIgKyBtcXR0X3BheWxvYWQpO1xuICAgICAgICB0aGlzLnB1Ymxpc2gobXF0dF9wYXlsb2FkKTtcbiAgICB9XG59XG5jb25zdCBITCA9IHtcbiAgICBnZXRTZXNzaW9uQ3JlZGVudGlhbHMsXG4gICAgU3RyZWFtaW5nU2Vzc2lvblxufTtcbmV4cG9ydHMuSEwgPSBITDtcbndpbmRvdy5ITCA9IEhMO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXgudHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=