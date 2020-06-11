import { TestBed } from '@angular/core/testing';
import { MqttLiteService } from 'ngx-mqtt-lite';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgxMqttClient } from './ngx-mqtt-client';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

describe('Testing Ngx MQTT Client', () => {
  let service: MqttLiteService;
  let client: NgxMqttClient;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({ providers: [MqttLiteService] });
      service = TestBed.get(MqttLiteService);
      service.registerClient('default', 'wss://mqtt.kainonly.com/mqtt');
    }
    client = service.client('default');
  });

  it('#create connected should be true', (done) => {
    client.create(['notification']).subscribe(result => {
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
    client.unsubscribe('tests').subscribe(result => {
      expect(result.error).toBeNull();
      done();
    });
  });
});
