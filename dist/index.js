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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HL = exports.getSessionCredentials = exports.HLStreamingSession = void 0;
const paho_mqtt_1 = __importDefault(require("paho-mqtt"));
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
        var session = new HLStreamingSession(creds);
        return session;
    });
}
exports.getSessionCredentials = getSessionCredentials;
class HLStreamingSession {
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
        // this.publish("[HL Web Browser] hello world");
    }
    publish(payload) {
        var message = new paho_mqtt_1.default.Message(payload);
        message.destinationName = this.sessionCredentials.topicRequest;
        message.retained = false;
        if (this.mqttClient)
            this.mqttClient.send(message);
    }
    //  {
    //      "version": 0,
    //      "frame_id":  0,
    //      "command":  "infer",
    //      "schema": "text",  # "[type, type]"
    //      "entity_id":  xxx-xxx-xxx-xxx,
    //      "payload": "My dog won't play fetch"
    //  }
    infer(entityId, payload) {
        var message = {
            'version': 0,
            'frame_id': 0,
            'command': 'infer',
            'schema': 'text',
            'entity_id': entityId,
            'payload': payload
        };
        const mqtt_payload = JSON.stringify(message);
        this.publish(mqtt_payload);
    }
}
exports.HLStreamingSession = HLStreamingSession;
const HL = {
    openStreamingSession: getSessionCredentials,
};
exports.HL = HL;
window.HL = HL;