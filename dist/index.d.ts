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
    (command: string, entityId: string, payload: any): void;
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
    infer(entityId: string, payload: string): void;
}
declare const HL: {
    getSessionCredentials: typeof getSessionCredentials;
    StreamingSession: typeof StreamingSession;
};
export { HL, SessionCredentials };
