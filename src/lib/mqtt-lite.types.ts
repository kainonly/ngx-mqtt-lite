import { IConnectPacket } from 'mqtt-packet';
import { MqttClient } from 'mqtt/types';

export interface ClientCreateResult {
  client: MqttClient;
  packet: IConnectPacket;
}

export interface MessageResult {
  topic: string;
  payload: Buffer;
}

export interface PolicyTopicOption {
  topic: string;
  policy: number;
  username: string;
}
