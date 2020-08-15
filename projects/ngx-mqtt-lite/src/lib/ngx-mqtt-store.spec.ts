import { TestBed } from '@angular/core/testing';
import { factoryPolicyTopic, NgxMqttLiteService } from 'ngx-mqtt-lite';
import { switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { Packet } from './ngx-mqtt-lite.types';
import { NgxMqttClient } from './ngx-mqtt-client';
import { NgxMqttStore } from './ngx-mqtt-store';

describe('testing ngx mqtt store', () => {
  let service: NgxMqttLiteService;
  let client: NgxMqttClient;
  let store: NgxMqttStore;
  let outgoingPacket: Packet;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({ providers: [NgxMqttLiteService] });
      service = TestBed.inject(NgxMqttLiteService);
      service.loadScript('https://unpkg.com/mqtt@4.1.0/dist/mqtt.min.js');
    }
  });

  it('#register store', (done) => {
    service.registerStore('default', {
      clean: false
    }).pipe(
      switchMap(status => {
        expect(status).toBeTruthy();
        store = service.store('default');
        return service.registerClient('default', 'wss://mqtt.kainonly.com/mqtt', {
          username: '5a90afb1-2ab1-4b50-a12d-43281a988cfb',
          password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTI5Njc5NTF9.0ndmcKT9BwcDxeXupzAYx5pCsTHbW5Ge5t5ta21tSaI',
          incomingStore: store.store
        });
      })
    ).subscribe(status => {
      expect(status).toBeTruthy();
      client = service.client('default');
      done();
    });
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

  it('#unregister store', () => {
    const result = service.unregisterStore('default');
    expect(result).toBeTruthy();
  });
});
