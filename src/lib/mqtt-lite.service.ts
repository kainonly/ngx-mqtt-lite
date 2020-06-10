import { Injectable } from '@angular/core';
import { IClientOptions } from 'mqtt';
import { Client } from './client';

@Injectable()
export class MqttLiteService {
  client: Map<string, Client> = new Map<string, Client>();

  set(id: string, host: string, option?: IClientOptions) {
    this.client.set(id, new Client(host, option));
  }

  get(id: string): Client {
    return this.client.get(id);
  }
}
