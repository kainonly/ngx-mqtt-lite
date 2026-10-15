import { InjectionToken } from '@angular/core';
import type { Store, connect } from 'mqtt';

/**
 * MQTT.js 引擎接口，暴露 `connect` 与 `Store`
 */
export interface MqttEngine {
  connect: typeof connect;
  Store: typeof Store;
}

/**
 * 惰性加载 MQTT.js 引擎，默认通过动态 `import('mqtt')` 按需引入，
 * 仅在实际注册客户端或存储时才会加载 mqtt 依赖
 */
export const MQTT_LOADER = new InjectionToken<() => Promise<MqttEngine>>('MQTT_LOADER', {
  providedIn: 'root',
  factory: () => () => import('mqtt'),
});
