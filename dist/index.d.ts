import Paho from 'paho-mqtt';
declare function getSessionCredentials(host: string, pipelineId: string): Promise<HLStreamingSession>;
interface HighlighterStreaming {
    openStreamingSession: any;
}
declare type HlServingSessionCredentials = {
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
export declare class HLStreamingSession {
    sessionCredentials: HlServingSessionCredentials;
    reconnectTimeout: number;
    mqttClient: Paho.Client | null;
    onMessage: Function | null;
    onFailure: Function | null;
    constructor(sessionCredentials: HlServingSessionCredentials);
    _onConnectionFailure(mqttMessage: any): void;
    _onMessageArrived(mqttMessage: any): void;
    connect(): void;
    onConnect(): void;
    publish(payload: string): void;
    infer(entityId: string, payload: string): void;
}
export { getSessionCredentials };
declare const HL: HighlighterStreaming;
export { HL };
