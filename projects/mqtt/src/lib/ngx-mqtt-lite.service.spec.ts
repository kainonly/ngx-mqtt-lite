import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MQTT_LOADER, MqttEngine } from './mqtt-loader';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttLiteService } from './ngx-mqtt-lite.service';
import { NgxMqttStore } from './ngx-mqtt-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function mockEngine(): MqttEngine {
  return {
    connect: vi.fn(() => ({})),
    Store: vi.fn(),
  } as unknown as MqttEngine;
}

describe('NgxMqttLiteService', () => {
  let engine: MqttEngine;
  let loader: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    engine = mockEngine();
    loader = vi.fn(() => Promise.resolve(engine));
    TestBed.configureTestingModule({
      providers: [{ provide: MQTT_LOADER, useValue: loader }],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('#registerClient 注册后可获取客户端', async () => {
    const service = TestBed.inject(NgxMqttLiteService);
    await expect(
      firstValueFrom(service.registerClient('default', 'wss://example.com/mqtt')),
    ).resolves.toBe(true);
    const client = service.client('default');
    expect(client).toBeInstanceOf(NgxMqttClient);
    expect(engine.connect).not.toHaveBeenCalled();
  });

  it('#registerClient 引擎未加载完成时等待加载', async () => {
    const pending = deferred<MqttEngine>();
    TestBed.overrideProvider(MQTT_LOADER, { useValue: () => pending.promise });
    const service = TestBed.inject(NgxMqttLiteService);
    const result = firstValueFrom(service.registerClient('default', 'wss://example.com/mqtt'));
    expect(service.client('default')).toBeUndefined();
    pending.resolve(engine);
    await expect(result).resolves.toBe(true);
    expect(service.client('default')).toBeInstanceOf(NgxMqttClient);
  });

  it('引擎加载失败时注册流程抛出错误', async () => {
    const pending = deferred<MqttEngine>();
    TestBed.overrideProvider(MQTT_LOADER, { useValue: () => pending.promise });
    const service = TestBed.inject(NgxMqttLiteService);
    const result = firstValueFrom(service.registerClient('default', 'wss://example.com/mqtt'));
    pending.reject(new Error('mqtt load failed'));
    await expect(result).rejects.toThrow('mqtt load failed');
  });

  it('多次注册复用同一次引擎加载', async () => {
    const service = TestBed.inject(NgxMqttLiteService);
    await firstValueFrom(service.registerClient('one', 'wss://one.example.com/mqtt'));
    await firstValueFrom(service.registerClient('two', 'wss://two.example.com/mqtt'));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('#unregisterClient 销毁客户端并移除注册', async () => {
    const service = TestBed.inject(NgxMqttLiteService);
    await firstValueFrom(service.registerClient('default', 'wss://example.com/mqtt'));
    const client = service.client('default')!;
    const destroy = vi.spyOn(client, 'destroy');
    expect(service.unregisterClient('default')).toBe(true);
    expect(destroy).toHaveBeenCalledOnce();
    expect(service.client('default')).toBeUndefined();
  });

  it('#unregisterClient 注销不存在的客户端返回 true', () => {
    const service = TestBed.inject(NgxMqttLiteService);
    expect(service.unregisterClient('missing')).toBe(true);
  });

  it('#registerStore 注册后可获取存储', async () => {
    const service = TestBed.inject(NgxMqttLiteService);
    await expect(firstValueFrom(service.registerStore('default', { clean: false }))).resolves.toBe(
      true,
    );
    expect(service.store('default')).toBeInstanceOf(NgxMqttStore);
  });

  it('#unregisterStore 关闭存储并移除注册', async () => {
    const service = TestBed.inject(NgxMqttLiteService);
    await firstValueFrom(service.registerStore('default'));
    const store = service.store('default')!;
    const close = vi
      .spyOn(store, 'close')
      .mockReturnValue(new Observable((observer) => observer.complete()));
    expect(service.unregisterStore('default')).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(service.store('default')).toBeUndefined();
  });

  it('#unregisterStore 注销不存在的存储返回 true', () => {
    const service = TestBed.inject(NgxMqttLiteService);
    expect(service.unregisterStore('missing')).toBe(true);
  });
});

describe('MQTT_LOADER 默认工厂', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('动态 import 返回可用引擎，无需浏览器 API 即可创建 Store（SSR 安全）', async () => {
    const load = TestBed.inject(MQTT_LOADER);
    const engine = await load();
    expect(typeof engine.connect).toBe('function');
    expect(typeof engine.Store).toBe('function');
    const store = new engine.Store();
    expect(typeof store.put).toBe('function');
    expect(typeof store.close).toBe('function');
  });
});
