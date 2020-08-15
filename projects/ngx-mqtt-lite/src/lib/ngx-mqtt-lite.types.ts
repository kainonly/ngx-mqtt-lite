import {
  IConnackPacket,
  IConnectPacket, IDisconnectPacket, IPingreqPacket, IPingrespPacket, IPubackPacket, IPubcompPacket,
  IPublishPacket, IPubrecPacket, IPubrelPacket,
  ISubackPacket,
  ISubscribePacket,
  IUnsubackPacket,
  IUnsubscribePacket
} from 'mqtt-packet';
import { ISubscriptionGrant, MqttClient } from 'mqtt';

export declare type Packet = IConnectPacket |
  IPublishPacket |
  IConnackPacket |
  ISubscribePacket |
  ISubackPacket |
  IUnsubscribePacket |
  IUnsubackPacket |
  IPubackPacket |
  IPubcompPacket |
  IPubrelPacket |
  IPingreqPacket |
  IPingrespPacket |
  IDisconnectPacket |
  IPubrecPacket

export interface ClientCreateResult {
  client: MqttClient;
  packet: Packet;
}

export interface MessageResult {
  topic: string;
  payload: Buffer;
  packet: Packet;
}

export interface PublishResult {
  error: Error;
  packet: Packet;
}

export interface SubscribeResult {
  error: Error;
  granted: ISubscriptionGrant[]
}

export interface UnsubscribeOption {
  properties?: {
    userProperties?: any
  }

  [key: string]: any;
}

export interface UnsubscribeResult {
  error: Error;
  packet: Packet;
}

export interface EndOption {
  reasonCode?: number;
  properties?: {
    sessionExpiryInterval?: number;
    reasonString?: string;
    userProperties?: any;
    serverReference?: string;
  }

  [key: string]: any;
}

export interface HandleMessageResult {
  error: Error;
  packet: Packet;
}

export interface PolicyTopicOption {
  topic: string;
  policy: number;
  username: string;
}
