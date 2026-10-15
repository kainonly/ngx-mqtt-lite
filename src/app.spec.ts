import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MQTT_LOADER, MqttEngine } from 'ngx-mqtt-lite';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { App } from './app';

type Listener = (...args: unknown[]) => void;

class FakeMqttClient {
  connected = false;
  readonly listeners = new Map<string, Set<Listener>>();
  readonly subscriptions: Array<string | string[]> = [];
  readonly published: Array<{ topic: string; message: string }> = [];
  readonly unsubscribed: Array<string | string[]> = [];

  on(event: string, listener: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    if (event === 'connect') {
      queueMicrotask(() => this.emit('connect', { cmd: 'connack' }));
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    if (event === 'connect') {
      this.connected = true;
    }
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  subscribe(
    topic: string | string[],
    _option?: unknown,
    callback?: (error: Error | null, granted?: unknown[]) => void,
  ): this {
    this.subscriptions.push(topic);
    callback?.(null, [{ topic, qos: 0 }]);
    return this;
  }

  publish(
    topic: string,
    message: string,
    _option?: unknown,
    callback?: (error: Error | null) => void,
  ): this {
    this.published.push({ topic, message });
    callback?.(null);
    return this;
  }

  unsubscribe(
    topic: string | string[],
    _option?: unknown,
    callback?: (error: Error | null) => void,
  ): this {
    this.unsubscribed.push(topic);
    callback?.(null);
    return this;
  }

  end(): this {
    this.connected = false;
    return this;
  }

  removeAllListeners(): this {
    this.listeners.clear();
    return this;
  }

  getLastMessageId(): number {
    return 1;
  }
}

describe('App', () => {
  let fake: FakeMqttClient;
  let connect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fake = new FakeMqttClient();
    connect = vi.fn(() => fake);
    const engine = { connect, Store: class {} } as unknown as MqttEngine;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: MQTT_LOADER, useValue: () => Promise.resolve(engine) },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  async function connectBroker(): Promise<ReturnType<typeof TestBed.createComponent<App>>> {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.connect();
    await fixture.whenStable();
    return fixture;
  }

  it('初始状态为未连接', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance.connected()).toBe(false);
    expect(fixture.nativeElement.querySelector('.status').textContent.trim()).toBe('未连接');
  });

  it('连接后使用表单地址调用引擎并进入已连接状态', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.connect();
    await fixture.whenStable();
    expect(connect).toHaveBeenCalledWith('wss://test.mosquitto.org/mqtt', undefined);
    expect(fixture.componentInstance.connected()).toBe(true);
    expect(fixture.nativeElement.querySelector('.status').textContent.trim()).toBe('已连接');
  });

  it('订阅主题后列表展示并可退订', async () => {
    const fixture = await connectBroker();
    const app = fixture.componentInstance;
    app.subscribeTopic.set('tests');
    await app.subscribe();
    await fixture.whenStable();
    expect(app.topics()).toEqual(['tests']);
    expect(fake.subscriptions).toEqual(['tests']);
    await app.unsubscribe('tests');
    await fixture.whenStable();
    expect(app.topics()).toEqual([]);
    expect(fake.unsubscribed).toEqual(['tests']);
  });

  it('发布消息使用输入的主题与内容', async () => {
    const fixture = await connectBroker();
    const app = fixture.componentInstance;
    app.publishTopic.set('notification');
    app.publishMessage.set('hello');
    await app.publish();
    expect(fake.published).toEqual([{ topic: 'notification', message: 'hello' }]);
  });

  it('收到消息后渲染日志', async () => {
    const fixture = await connectBroker();
    fake.emit('message', 'notification', Buffer.from('hello'), { cmd: 'publish' });
    await fixture.whenStable();
    const logs = fixture.nativeElement.querySelectorAll('.logs li');
    expect(logs.length).toBe(1);
    expect(logs[0].querySelector('.topic').textContent).toBe('notification');
    expect(logs[0].querySelector('.payload').textContent).toBe('hello');
  });

  it('断开后恢复未连接状态', async () => {
    const fixture = await connectBroker();
    fixture.componentInstance.disconnect();
    await fixture.whenStable();
    expect(fixture.componentInstance.connected()).toBe(false);
    expect(fixture.nativeElement.querySelector('.status').textContent.trim()).toBe('未连接');
  });
});
