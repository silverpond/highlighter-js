import Paho from 'paho-mqtt'

async function getSessionCredentials(host: string, pipelineId: string): Promise<SessionCredentials> {
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
  var creds: SessionCredentials = result.data.createHlServingSession.sessionCredentials
  return creds
}

type SessionCredentials = {
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

type OnMessageFuncton = {
  (command: string, entityId: string, payload: HlEavt[] | HlText): void
}

class StreamingSession {
  sessionCredentials: SessionCredentials;
  reconnectTimeout: number = 2000;
  mqttClient: Paho.Client | null = null;
  onMessage: OnMessageFuncton | null = null;
  onFailure: Function | null = null;

  constructor(sessionCredentials: SessionCredentials) {
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
  }

  publish(payload: string) {
    var message = new Paho.Message(payload);
    message.destinationName = this.sessionCredentials.topicRequest;
    message.retained = false;
    if (this.mqttClient)
      this.mqttClient.send(message);
  }

  inferText(entityId: string, payload: string, frameId: number) {
    var text: HlText = {
      'type': 'ml_text',
      'frames': [
        {
          'id': frameId,
          'sentence': payload,
          'entity_id': entityId,
        }]
    }

    var message: HlServingMessage = {
      'version': 0,
      'frame_id': frameId,
      'command': 'infer',
      'schema': ['text'],
      'entity_id': entityId,
      'payload': text
    }
    const mqtt_payload: string = JSON.stringify(message);
    console.debug("publishing payload: " + mqtt_payload);
    this.publish(mqtt_payload);
  }
}

type HlText = {
  type: string,
  frames: Array<{
    id: number,
    sentence: string,
    entity_id: string,
  }>,
}

//
//  Received: session/demo_180/session/out: {"version": 0, "frame_id": 4, "command": "infer_response", "schema": ["eavt"], "entity_id": "4a1e9fdd-d4de-4b2b-aaf3-a9c6f799016f", "payload": [{"entity_id": "4a1e9fdd-d4de-4b2b-aaf3-a9c6f799016f", "attribute_id": "caf61fa6-abed-4941-847a-d247f5239a2d", "value": "c3ef87a8-f155-48f7-ae91-78a3e7811ca2", "time": "2022-07-13T17:10:02.573975", "datum_source": {"frameId": 4, "hostId": null, "pipelineElementName": null, "pipelineId": null, "pipelineElementId": null, "trainingRunId": null, "confidence": 0.9753193855285645}}, {"entity_id": "4a1e9fdd-d4de-4b2b-aaf3-a9c6f799016f", "attribute_id": "caf61fa6-abed-4941-847a-d247f5239a2d", "value": "e142f96f-9f2d-40a7-9256-74b2608247ca", "time": "2022-07-13T17:10:02.574082", "datum_source": {"frameId": 4, "hostId": null, "pipelineElementName": null, "pipelineId": null, "pipelineElementId": null, "trainingRunId": null, "confidence": 0.5444248914718628}}, {"entity_id": "4a1e9fdd-d4de-4b2b-aaf3-a9c6f799016f", "attribute_id": "caf61fa6-abed-4941-847a-d247f5239a2d", "value": "82053230-b06f-4c9f-bbd3-7591f2d11c19", "time": "2022-07-13T17:10:02.574144", "datum_source": {"frameId": 4, "hostId": null, "pipelineElementName": null, "pipelineId": null, "pipelineElementId": null, "trainingRunId": null, "confidence": 0.5430828332901001}}, {"entity_id": "4a1e9fdd-d4de-4b2b-aaf3-a9c6f799016f", "attribute_id": "caf61fa6-abed-4941-847a-d247f5239a2d", "value": "871b5f5c-aa3d-420a-85c1-f02a7de68911", "time": "2022-07-13T17:10:02.574201", "datum_source": {"frameId": 4, "hostId": null, "pipelineElementName": null, "pipelineId": null, "pipelineElementId": null, "trainingRunId": null, "confidence": 0.3508743643760681}}], "errors": []}

type HlServingMessage = {
  version: number,
  frame_id: number,
  command: string,
  schema: Array<string>,
  entity_id: string,
  payload: Array<HlEavt> | HlText,
  errors?: Array<string>,
}

type HlEavt = {
  entity_id: string,  //uuid
  attribute_id: string, //uuid
  attribute_name: string,
  attribute_type: string, // boolean, enum, integer, decimal, string, geometry, array
  attribute_enum_id?: string, //uuid
  attribute_enum_value?: string,
  value?: object, //boolean, integer, float, string, date, undefined
  time: Date,
  datum_source: {
    frame_id: number,
    host_id: string,
    pipeline_id: string,
    pipeline_element_id: string,
    pipeline_element_name: string,
    training_run_id: number,
    confidence: number,
  }
}

const HL = {
  getSessionCredentials,
  StreamingSession
};

type HLWindow = (typeof window) & {
  HL: any;
}

export { HL, SessionCredentials, HlServingMessage, HlEavt, HlText };

(window as HLWindow).HL = HL;
