import Paho from 'paho-mqtt';
declare function getSessionCredentials(host: string, pipelineId: string): Promise<SessionCredentials>;
declare type SessionCredentials = {
    sessionId: string;
    sessionKey: string;
    websocketUrl: string;
    transport: string;
    host: string;
    port: number;
    username: string;
    password: string;
    topicRequest: string;
    topicResponse: string;
};
declare type OnMessageFuncton = {
    (command: string, entityId: string, payload: HlEavt[] | HlText): void;
};
declare class StreamingSession {
    sessionCredentials: SessionCredentials;
    reconnectTimeout: number;
    mqttClient: Paho.Client | null;
    onMessage: OnMessageFuncton | null;
    onFailure: Function | null;
    constructor(sessionCredentials: SessionCredentials);
    _onConnectionFailure(mqttMessage: any): void;
    _onMessageArrived(mqttMessage: any): void;
    connect(): void;
    onConnect(): void;
    publish(payload: string): void;
    infer(entityId: string, payload: string, frameId: number): void;
}
declare type HlText = {
    type: string;
    frames: Array<{
        id: number;
        sentence: string;
        entity_id: string;
    }>;
};
declare type HlServingMessage = {
    version: number;
    frame_id: number;
    command: string;
    schema: Array<string>;
    entity_id: string;
    payload: Array<HlEavt> | HlText;
    errors?: Array<string>;
};
declare type HlEavt = {
    entity_id: string;
    attribute_id: string;
    attribute_name: string;
    attribute_type: string;
    attribute_enum_id?: string;
    attribute_enum_value?: string;
    value?: object;
    time: Date;
    datum_source: {
        frame_id: number;
        host_id: string;
        pipeline_id: string;
        pipeline_element_id: string;
        pipeline_element_name: string;
        training_run_id: number;
        confidence: number;
    };
};
declare const HL: {
    getSessionCredentials: typeof getSessionCredentials;
    StreamingSession: typeof StreamingSession;
};
export { HL, SessionCredentials, HlServingMessage, HlEavt, HlText };
