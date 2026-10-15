import type { Packet } from 'mqtt';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { MqttEngine } from './mqtt-loader';
import { NgxMqttStore } from './ngx-mqtt-store';

class FakeStore {
  closed = false;
  readonly putPackets: Packet[] = [];
  readonly deletedPackets: Array<{ messageId?: number }> = [];

  constructor(readonly option?: { clean?: boolean }) {}

  put(packet: Packet, callback: () => void): this {
    this.putPackets.push(packet);
    callback();
    return this;
  }

  createStream(): { fake: 'stream' } {
    return { fake: 'stream' };
  }

  del(packet: { messageId?: number }, callback: () => void): this {
    this.deletedPackets.push(packet);
    callback();
    return this;
  }

  close(callback: () => void): void {
    this.closed = true;
    callback();
  }
}

function createStore(option?: { clean?: boolean }): NgxMqttStore {
  const engine = { connect: vi.fn(), Store: FakeStore } as unknown as MqttEngine;
  return new NgxMqttStore(engine, option);
}

describe('NgxMqttStore', () => {
  it('构造时使用引擎 Store 创建实例', () => {
    const store = createStore({ clean: false });
    expect(store.store).toBeInstanceOf(FakeStore);
    expect((store.store as unknown as FakeStore).option).toEqual({ clean: false });
  });

  it('#put 添加报文到存储', async () => {
    const store = createStore();
    const packet = { cmd: 'publish', messageId: 1 } as unknown as Packet;
    await expect(firstValueFrom(store.put(packet))).resolves.toBe('ok');
    expect((store.store as unknown as FakeStore).putPackets).toEqual([packet]);
  });

  it('#createStream 创建包含所有报文的流', () => {
    const store = createStore();
    expect(store.createStream()).toEqual({ fake: 'stream' });
  });

  it('#del 从存储移除报文', async () => {
    const store = createStore();
    const packet = { messageId: 7 };
    await expect(firstValueFrom(store.del(packet))).resolves.toBe('ok');
    expect((store.store as unknown as FakeStore).deletedPackets).toEqual([{ messageId: 7 }]);
  });

  it('#close 关闭存储', async () => {
    const store = createStore();
    await expect(firstValueFrom(store.close())).resolves.toBe('ok');
    expect((store.store as unknown as FakeStore).closed).toBe(true);
  });
});
