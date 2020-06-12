import { TestBed } from '@angular/core/testing';
import { factoryPolicyTopic, MqttLiteService } from 'ngx-mqtt-lite';
import { switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { Packet } from './mqtt-lite.types';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttStore } from './ngx-mqtt-store';

describe('testing ngx mqtt store', () => {
  let service: MqttLiteService;
  let client: NgxMqttClient;
  let store: NgxMqttStore;
  let outgoingPacket: Packet;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({ providers: [MqttLiteService] });
      service = TestBed.get(MqttLiteService);
      service.registerStore('default', {
        clean: false
      });
      service.registerClient('default', 'wss://mqtt.kainonly.com/mqtt', {
        incomingStore: service.store('default').store
      });
    }
    client = service.client('default');
    store = service.store('default');
  });

  it('#create connected should be true', (done) => {
    const topic = factoryPolicyTopic([
      { topic: 'notification', policy: 1, username: 'kain' }
    ]);
    client.create(topic).subscribe(result => {
      expect(result.client.connected).toBe(true);
      done();
    });
  });

  it('#put', (done) => {
    timer(1000).pipe(
      switchMap(() => client.publish('notification', 'kain'))
    ).subscribe(result => {
      expect(result.error).toBeNull();
    });
    client.ready.subscribe(mqtt => {
      mqtt.once('packetsend', (packet) => {
        store.put(packet).subscribe(result => {
          outgoingPacket = packet;
          expect(result).toBe('ok');
          done();
        });
      });
    });
  });

  it('#createStream', () => {
    expect(store.createStream()).not.toBeNull();
  });

  it('#del', (done) => {
    store.del(outgoingPacket).subscribe(result => {
      expect(result).toBe('ok');
      done();
    });
  });

  it('#close', (done) => {
    store.close().subscribe(result => {
      expect(result).toBe('ok');
      done();
    });
  });
});
