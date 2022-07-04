import Paho from 'paho-mqtt'

async function getSessionCredentials(host: string, pipelineId: string): Promise<HLStreamingSession> {
  var url = host + "/graphql"
  const response = await fetch(url, {
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
  })
  var text = await response.text();
  console.log("Result: " + text)
  var result = JSON.parse(text);
  var creds: HlServingSessionCredentials = result.data.createHlServingSession.sessionCredentials
  var session = new HLStreamingSession(creds);
  return session;
}

interface HighlighterStreaming {
  openStreamingSession: any
}

type HlServingSessionCredentials = {
  sessionId: string,
  sessionKey: string,
  websocketUrl: string,
  transport: string,
  host: string,
  port: number,
  username: string,
  password: string,
  topicRequest: string,
  topicResponse: string,
}

export class HLStreamingSession {
  sessionCredentials: HlServingSessionCredentials;
  reconnectTimeout: number = 2000;
  mqttClient: Paho.Client | null = null;
  onMessage: Function | null = null;
  onFailure: Function | null = null;

  constructor(sessionCredentials: HlServingSessionCredentials) {
    this.sessionCredentials = sessionCredentials
  }

  _onConnectionFailure(mqttMessage: any) {
    console.debug("Failed to connect: " + JSON.stringify(mqttMessage)); //+ mqtt_host_port);
    if (this.onFailure && typeof this.onFailure === "function") {
      this.onFailure(mqttMessage);
    }
    setTimeout(this.connect, this.reconnectTimeout);
  }

  _onMessageArrived(mqttMessage: any) {
    const topic = mqttMessage.destinationName;
    const mqttPayload = mqttMessage.payloadString;
    console.debug("Received: " + topic + ": " + mqttPayload);
    const hlMessage: HlServingMessage = JSON.parse(mqttPayload);

    if (this.onMessage && typeof this.onMessage === "function") {
      this.onMessage(hlMessage.command, hlMessage.entity_id, hlMessage.payload);
    }
  }

  connect() {
    console.debug("Connecting with " + JSON.stringify(this.sessionCredentials))
    this.mqttClient = new Paho.Client(this.sessionCredentials.host,
      this.sessionCredentials.port,
      this.sessionCredentials.sessionId);
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
    } else {
      console.log("trying to connect without setting mqttClient");
    }
    // this.publish("[HL Web Browser] hello world");
  }

  publish(payload: string) {
    var message = new Paho.Message(payload);
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
  infer(entityId: string, payload: string) {
    var message: HlServingMessage = {
      'version': 0,
      'frame_id': 0,
      'command': 'infer',
      'schema': 'text',
      'entity_id': entityId,
      'payload': payload
    }
    const mqtt_payload: string = JSON.stringify(message);
    this.publish(mqtt_payload);
  }
}

type HlServingMessage = {
  version: number,
  frame_id: number,
  command: string,
  schema: string,
  entity_id: string,
  payload: string,
}

type HLWindow = (typeof window) & {
  HL: HighlighterStreaming;
}

export { getSessionCredentials };

//(window as HLWindow).HL = HL;
