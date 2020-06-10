import { IConnectPacket } from 'mqtt-packet';
import { IClientOptions, MqttClient } from 'mqtt/types';
import { IClientPublishOptions } from 'mqtt/types/lib/client-options';
import { AsyncSubject, Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

declare let mqtt: any;

export class Client {
  private client: MqttClient;
  private ready: AsyncSubject<any> = new AsyncSubject<any>();
  message: Subject<any> = new Subject<any>();

  constructor(
    private host: string,
    private option?: IClientOptions
  ) {
  }

  create(topic?: string[]): Observable<IConnectPacket> {
    return new Observable<any>(observer => {
      this.client = mqtt.connect(this.host, this.option);
      this.client.on('connect', (packet) => {
        if (topic !== undefined) {
          this.client.subscribe(topic);
        }
        observer.next(packet);
        observer.complete();
        this.ready.next('ok');
        this.ready.complete();
      });
      this.client.on('error', (error => {
        observer.error(error);
        observer.complete();
      }));
      this.client.on('message', (name, payload) => {
        this.message.next({
          name,
          payload
        });
      });
    });
  }

  publish(topic: string, message: string, option?: IClientPublishOptions): Observable<any> {
    return this.ready.pipe(
      switchMap(() => new Observable<any>(observer => {
        this.client.publish(topic, message, option, (err) => {
          observer.next(err);
          observer.complete();
        });
      }))
    );
  }
}
