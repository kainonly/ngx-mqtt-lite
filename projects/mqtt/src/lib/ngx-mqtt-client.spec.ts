import type { IPublishPacket, MqttClient, Packet } from 'mqtt';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { MqttEngine } from './mqtt-loader';
import { NgxMqttClient } from './ngx-mqtt-client';

type Listener = (...args: unknown[]) => void;

class FakeMqttClient {
  connected = false;
  ended = false;
  removedAllListeners = false;
  readonly listeners = new Map<string, Set<Listener>>();
  readonly subscriptions: Array<string | string[]> = [];
  readonly published: Array<{ topic: string; message: string }> = [];
  readonly unsubscribed: Array<string | string[]> = [];
  lastRemovedMessageId?: number;

  on(event: string, listener: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  removeAllListeners(): this {
    this.removedAllListeners = true;
    this.listeners.clear();
    return this;
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
    callback?: (error: Error | null, packet?: Packet) => void,
  ): this {
    this.published.push({ topic, message });
    callback?.(null, { cmd: 'publish', topic } as unknown as Packet);
    return this;
  }

  unsubscribe(
    topic: string | string[],
    _option?: unknown,
    callback?: (error: Error | null, packet?: Packet) => void,
  ): this {
    this.unsubscribed.push(topic);
    callback?.(null, { cmd: 'unsuback' } as unknown as Packet);
    return this;
  }

  end(): this {
    this.ended = true;
    this.connected = false;
    return this;
  }

  reconnect(): this {
    this.connected = true;
    return this;
  }

  removeOutgoingMessage(mid: number): this {
    this.lastRemovedMessageId = mid;
    return this;
  }

  handleMessage(packet: Packet, callback: (error?: Error) => void): void {
    callback();
  }

  getLastMessageId(): number {
    return 42;
  }
}

function setup(): {
  wrapper: NgxMqttClient;
  fake: FakeMqttClient;
  connect: ReturnType<typeof vi.fn>;
} {
  const fake = new FakeMqttClient();
  const connect = vi.fn(() => fake);
  const engine = { connect, Store: class {} } as unknown as MqttEngine;
  const wrapper = new NgxMqttClient(engine, 'wss://example.com/mqtt', { username: 'kain' });
  return { wrapper, fake, connect };
}

function connect(wrapper: NgxMqttClient, topic?: string[]): void {
  void wrapper.create(topic).subscribe();
}

describe('NgxMqttClient', () => {
  it('#create 连接 broker 并发出连接结果，ready 随之完成', async () => {
    const { wrapper, fake, connect } = setup();
    const packet = { cmd: 'connack' } as unknown as Packet;
    const result = wrapper.create();
    const promise = firstValueFrom(result);
    fake.emit('connect', packet);
    fake.connected = true;
    const output = await promise;
    expect(connect).toHaveBeenCalledWith('wss://example.com/mqtt', { username: 'kain' });
    expect(output.client).toBe(fake as unknown as MqttClient);
    expect(output.packet).toBe(packet);
    const ready = await firstValueFrom(wrapper.ready);
    expect(ready).toBe(fake as unknown as MqttClient);
  });

  it('#create 传入主题时连接成功后自动订阅', () => {
    const { wrapper, fake } = setup();
    connect(wrapper, ['notification', 'private/kain']);
    fake.emit('connect', { cmd: 'connack' });
    expect(fake.subscriptions).toEqual([['notification', 'private/kain']]);
  });

  it('#message 收到 publish 报文时发出消息', () => {
    const { wrapper, fake } = setup();
    const received: Array<{ topic: string; payload: Buffer }> = [];
    wrapper.message.subscribe((result) => received.push(result));
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    const payload = Buffer.from('hello');
    fake.emit('message', 'notification', payload, { cmd: 'publish' });
    expect(received).toEqual([{ topic: 'notification', payload, packet: { cmd: 'publish' } }]);
  });

  it('#publish 就绪后发布消息并返回结果', async () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    const result = await firstValueFrom(wrapper.publish('notification', 'hello'));
    expect(result.error).toBeNull();
    expect(result.packet).toEqual({ cmd: 'publish', topic: 'notification' });
    expect(fake.published).toEqual([{ topic: 'notification', message: 'hello' }]);
  });

  it('#publish 就绪前不发布，连接完成后才执行', async () => {
    const { wrapper, fake } = setup();
    const promise = firstValueFrom(wrapper.publish('notification', 'hello'));
    expect(fake.published).toEqual([]);
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    await promise;
    expect(fake.published).toEqual([{ topic: 'notification', message: 'hello' }]);
  });

  it('#subscribe 返回订阅结果', async () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    const result = await firstValueFrom(wrapper.subscribe('tests'));
    expect(result.error).toBeNull();
    expect(result.granted).toEqual([{ topic: 'tests', qos: 0 }]);
    expect(fake.subscriptions).toEqual(['tests']);
  });

  it('#unsubscribe 返回退订结果', async () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    const result = await firstValueFrom(wrapper.unsubscribe('tests'));
    expect(result.error).toBeNull();
    expect(fake.unsubscribed).toEqual(['tests']);
  });

  it('#handleMessage 逐条处理报文', async () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    const packet = {
      cmd: 'publish',
      topic: 'tests',
      payload: Buffer.from('x'),
    } as unknown as IPublishPacket;
    const result = await firstValueFrom(wrapper.handleMessage(packet));
    expect(result.error).toBeNull();
    expect(result.packet).toBe(packet);
  });

  it('#getLastMessageId 就绪后返回最后发送消息 id', async () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    await expect(firstValueFrom(wrapper.getLastMessageId())).resolves.toBe(42);
  });

  it('#end/#reconnect/#removeOutgoingMessage 透传底层客户端', () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    expect(wrapper.end()).toBe(fake as unknown as MqttClient);
    expect(fake.ended).toBe(true);
    expect(wrapper.reconnect()).toBe(fake as unknown as MqttClient);
    expect(wrapper.removeOutgoingMessage(7)).toBe(fake as unknown as MqttClient);
    expect(fake.lastRemovedMessageId).toBe(7);
  });

  it('#destroy 结束连接、移除监听并释放 Subject', () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    wrapper.destroy();
    expect(fake.ended).toBe(true);
    expect(fake.removedAllListeners).toBe(true);
    expect(wrapper.ready.closed).toBe(true);
    expect(wrapper.message.closed).toBe(true);
  });

  it('#destory 兼容别名与 destroy 行为一致', () => {
    const { wrapper, fake } = setup();
    connect(wrapper);
    fake.emit('connect', { cmd: 'connack' });
    wrapper.destory();
    expect(fake.ended).toBe(true);
  });

  it('未连接时调用底层方法抛出错误', () => {
    const { wrapper } = setup();
    expect(() => wrapper.end()).toThrowError('MQTT client is not connected, call create() first');
  });
});
