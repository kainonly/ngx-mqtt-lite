import { Injectable, inject } from '@angular/core';
import type { IClientOptions } from 'mqtt';
import { from, map, Observable } from 'rxjs';
import { MQTT_LOADER, MqttEngine } from './mqtt-loader';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttStore } from './ngx-mqtt-store';
import type { StoreOption } from './types';

@Injectable({ providedIn: 'root' })
export class NgxMqttLiteService {
  private readonly loadEngine = inject(MQTT_LOADER);
  private engine?: Promise<MqttEngine>;
  private readonly clients: Map<string, NgxMqttClient> = new Map<string, NgxMqttClient>();
  private readonly stores: Map<string, NgxMqttStore> = new Map<string, NgxMqttStore>();

  /**
   * 注册 MQTT broker，引擎加载完成后创建客户端
   */
  registerClient(id: string, url: string, option?: IClientOptions): Observable<boolean> {
    return from(this.load()).pipe(
      map((engine) => {
        this.clients.set(id, new NgxMqttClient(engine, url, option));
        return this.clients.has(id);
      }),
    );
  }

  /**
   * 注销 MQTT broker
   */
  unregisterClient(id: string): boolean {
    if (!this.clients.has(id)) {
      return true;
    }
    this.clients.get(id)!.destroy();
    return this.clients.delete(id);
  }

  /**
   * 获取 MQTT broker 客户端
   */
  client(id: string): NgxMqttClient | undefined {
    return this.clients.get(id);
  }

  /**
   * 注册消息存储的内存实现
   */
  registerStore(id: string, option?: StoreOption): Observable<boolean> {
    return from(this.load()).pipe(
      map((engine) => {
        this.stores.set(id, new NgxMqttStore(engine, option));
        return this.stores.has(id);
      }),
    );
  }

  /**
   * 注销消息存储的内存实现
   */
  unregisterStore(id: string): boolean {
    if (!this.stores.has(id)) {
      return true;
    }
    const store = this.stores.get(id)!;
    store.close().subscribe({
      complete: () => undefined,
    });
    return this.stores.delete(id);
  }

  /**
   * 获取消息存储
   */
  store(id: string): NgxMqttStore | undefined {
    return this.stores.get(id);
  }

  private load(): Promise<MqttEngine> {
    this.engine ??= this.loadEngine();
    return this.engine;
  }
}
