import { TestBed } from '@angular/core/testing';
import { factoryPolicyTopic, MqttLiteService } from 'ngx-mqtt-lite';
import { switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { NgxMqttClient } from './ngx-mqtt-client';

describe('testing ngx mqtt client', () => {
  let service: MqttLiteService;
  let client: NgxMqttClient;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({ providers: [MqttLiteService] });
      service = TestBed.get(MqttLiteService);
      service.registerClient('default', 'wss://mqtt.kainonly.com/mqtt', {});
    }
    client = service.client('default');
  });

  it('#create connected should be true', (done) => {
    const topic = factoryPolicyTopic([
      { topic: 'notification', policy: 0, username: 'kain' }
    ]);
    client.create(topic).subscribe(result => {
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
});
