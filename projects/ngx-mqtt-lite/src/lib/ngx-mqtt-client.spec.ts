import { TestBed } from '@angular/core/testing';
import { factoryPolicyTopic, NgxMqttLiteService } from 'ngx-mqtt-lite';
import { switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { NgxMqttClient } from './ngx-mqtt-client';

describe('testing ngx mqtt client', () => {
  let service: NgxMqttLiteService;
  let client: NgxMqttClient;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({ providers: [NgxMqttLiteService] });
      service = TestBed.inject(NgxMqttLiteService);
      service.loadScript('https://unpkg.com/mqtt@4.1.0/dist/mqtt.min.js');
    }
  });

  it('#register client', (done) => {
    service.registerClient('default', 'wss://mqtt.kainonly.com/mqtt', {
      username: '5a90afb1-2ab1-4b50-a12d-43281a988cfb',
      password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTI5Njc5NTF9.0ndmcKT9BwcDxeXupzAYx5pCsTHbW5Ge5t5ta21tSaI'
    }).subscribe(status => {
      expect(status).toBeTruthy();
      client = service.client('default');
      done();
    });
  });

  it('#create connected should be true', (done) => {
    const topic = factoryPolicyTopic([
      { topic: 'notification', policy: 0, username: 'kain' }
    ]);
    timer(1000).pipe(
      switchMap(() => client.create(topic))
    ).subscribe(result => {
      expect(result.client.connected).toBe(true);
      done();
    });
  });

  it('#publish and receive the same message', (done) => {
    timer(1000).pipe(
      switchMap(() => client.publish('notification', 'kain'))
    ).subscribe(result => {
      expect(result.error).toBeNull();
    });
    client.message.subscribe(result => {
      if (result.topic === 'notification') {
        expect(result.payload.toString()).toBe('kain');
      }
      done();
    });
  });

  it('#subscribe should not error', (done) => {
    client.subscribe('tests').subscribe(result => {
      expect(result.error).toBeNull();
      done();
    });
  });

  it('#unsubscribe should not error', (done) => {
    timer(1000).pipe(
      switchMap(() => client.unsubscribe('tests'))
    ).subscribe(result => {
      expect(result.error).toBeNull();
      done();
    });
  });

  it('#getLastMessageId', (done) => {
    client.getLastMessageId().subscribe(result => {
      expect(result).not.toBeNull();
      done();
    });
  });

  it('#handleMessage', (done) => {
    timer(1000).pipe(
      switchMap(() => client.publish('notification', 'kain'))
    ).subscribe(result => {
      expect(result.error).toBeNull();
    });
    client.message.pipe(
      switchMap(result => {
        if (result.topic === 'notification') {
          expect(result.payload.toString()).toBe('kain');
        }
        return client.handleMessage(result.packet);
      })
    ).subscribe(result => {
      expect(result.error).toBeNull();
      done();
    });
  });

  it('#reconnect', () => {
    expect(client.reconnect()).not.toBeNull();
  });

  it('#end and destory', () => {
    try {
      expect(client.end()).not.toBeNull();
      client.destory();
    } catch (e) {
      expect(e).toBeNull();
    }
  });

  it('#unregister client', () => {
    const result = service.unregisterClient('default');
    expect(result).toBeTruthy();
  });
});
