import { Injectable } from '@angular/core';
import { IClientOptions } from 'mqtt';
import { IStoreOptions } from 'mqtt/types/lib/store-options';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttStore } from './ngx-mqtt-store';

@Injectable()
export class MqttLiteService {
  private clients: Map<string, NgxMqttClient> = new Map<string, NgxMqttClient>();
  private stores: Map<string, NgxMqttStore> = new Map<string, NgxMqttStore>();

  /**
   * Register MQTT broker
   */
  registerClient(id: string, host: string, option?: IClientOptions) {
    this.clients.set(id, new NgxMqttClient(host, option));
  }

  /**
   * Get MQTT broker
   */
  client(id: string): NgxMqttClient {
    return this.clients.get(id);
  }

  /**
   * Register in-memory implementation of the message store
   */
  registerStore(id: string, option: IStoreOptions) {
    this.stores.set(id, new NgxMqttStore(option));
  }

  /**
   * Get message store
   */
  store(id: string): NgxMqttStore {
    return this.stores.get(id);
  }
}
