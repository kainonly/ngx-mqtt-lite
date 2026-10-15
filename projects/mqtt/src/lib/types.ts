import type { IConnackPacket, ISubscriptionGrant, IPublishPacket, MqttClient, Packet } from 'mqtt';

export type { Packet };

export interface ClientCreateResult {
  client: MqttClient;
  packet: IConnackPacket;
}

export interface MessageResult {
  topic: string;
  payload: Buffer;
  packet: IPublishPacket;
}

export interface PublishResult {
  error: Error | null;
  packet: Packet | undefined;
}

export interface SubscribeResult {
  error: Error | null;
  granted: ISubscriptionGrant[];
}

export interface UnsubscribeOption {
  properties?: {
    userProperties?: any;
  };

  [key: string]: any;
}

export interface UnsubscribeResult {
  error: Error | null;
  packet: Packet | undefined;
}

export interface EndOption {
  reasonCode?: number;
  properties?: {
    sessionExpiryInterval?: number;
    reasonString?: string;
    userProperties?: any;
    serverReference?: string;
  };

  [key: string]: any;
}

export interface HandleMessageResult {
  error: Error | null;
  packet: Packet | undefined;
}

export interface PolicyTopicOption {
  topic: string;
  policy: number;
  username: string;
}

export interface StoreOption {
  clean?: boolean;
}
