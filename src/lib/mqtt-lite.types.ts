import { IConnectPacket } from 'mqtt-packet';
import { MqttClient } from 'mqtt/types';

export interface ClientCreateResult {
  client: MqttClient;
  patket: IConnectPacket;
}
