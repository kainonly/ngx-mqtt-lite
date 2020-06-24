import { Injectable } from '@angular/core';
import { IClientOptions } from 'mqtt';
import { IStoreOptions } from 'mqtt/types/lib/store-options';
import { AsyncSubject, fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttStore } from './ngx-mqtt-store';

declare let mqtt: any;
declare let document: Document;

@Injectable()
export class NgxMqttLiteService {
  private loaded: AsyncSubject<any>;
  private clients: Map<string, NgxMqttClient> = new Map<string, NgxMqttClient>();
  private stores: Map<string, NgxMqttStore> = new Map<string, NgxMqttStore>();

  /**
   * load script
   */
  loadScript(url: string): void {
    this.loaded = new AsyncSubject<any>();
    const scripts = document.createElement('script');
    scripts.setAttribute('type', 'text/javascript');
    scripts.setAttribute('src', url);
    document.body.appendChild(scripts);
    fromEvent(scripts, 'load').subscribe(() => {
      this.loaded.next(mqtt);
      this.loaded.complete();
    });
    /* istanbul ignore next */
    fromEvent(scripts, 'error').subscribe(() => {
      console.warn('mqtt load failed');
    });
  }

  /**
   * register MQTT broker
   */
  registerClient(id: string, host: string, option?: IClientOptions): Observable<boolean> {
    return this.loaded.pipe(
      map(plugins => {
        this.clients.set(id, new NgxMqttClient(plugins, host, option));
        return this.clients.has(id);
      })
    );
  }

  /**
   * unregister MQTT broker
   */
  unregisterClient(id: string): boolean {
    /* istanbul ignore next */
    if (!this.clients.has(id)) {
      return true;
    }
    this.clients.get(id).destory();
    return this.clients.delete(id);
  }

  /**
   * Get MQTT broker
   */
  client(id: string): NgxMqttClient {
    return this.clients.get(id);
  }

  /**
   * register in-memory implementation of the message store
   */
  registerStore(id: string, option: IStoreOptions): Observable<boolean> {
    return this.loaded.pipe(
      map(plugins => {
        this.stores.set(id, new NgxMqttStore(plugins, option));
        return this.stores.has(id);
      })
    );
  }

  /**
   * unregister in-memory implementation of the message store
   */
  unregisterStore(id: string): boolean {
    /* istanbul ignore next */
    if (!this.stores.has(id)) {
      return true;
    }
    this.stores.get(id).close().subscribe(() => {

    });
    return this.stores.delete(id);
  }

  /**
   * Get message store
   */
  store(id: string): NgxMqttStore {
    return this.stores.get(id);
  }
}
