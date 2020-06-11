import { IConnectPacket } from 'mqtt-packet';
import { IClientOptions, IClientReconnectOptions, IClientSubscribeOptions, MqttClient } from 'mqtt/types';
import { IClientPublishOptions } from 'mqtt/types/lib/client-options';
import { AsyncSubject, Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ClientCreateResult } from './mqtt-lite.types';

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

  create(topic?: string[]): Observable<ClientCreateResult> {
    return new Observable<any>(observer => {
      this.client = mqtt.connect(this.host, this.option);
      this.client.on('connect', (packet) => {
        if (topic !== undefined) {
          this.client.subscribe(topic);
        }
        observer.next({
          client: this.client,
          packet
        });
        observer.complete();
        this.ready.next('ok');
        this.ready.complete();
      });
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

  subscribe(topic: string | string[], option?: IClientSubscribeOptions): Observable<any> {
    return this.ready.pipe(
      switchMap(() => new Observable(observer => {
        this.client.subscribe(topic, option, (error, granted) => {
          observer.next({
            error,
            granted
          });
          observer.complete();
        });
      }))
    );
  }

  unsubscribe(topic: string | string[], option?: any): Observable<any> {
    return this.ready.pipe(
      switchMap(() => new Observable(observer => {
        this.client.unsubscribe(topic, option, (error, packet) => {
          observer.next({
            error,
            packet
          });
          observer.complete();
        });
      }))
    );
  }

  end(force?: boolean, option?: any): Observable<any> {
    return this.ready.pipe(
      switchMap(() => new Observable(observer => {
        this.client.end(force, option, () => {
          observer.next('ok');
          observer.complete();
        });
      }))
    );
  }

  removeOutgoingMessage(mid: number): MqttClient {
    return this.client.removeOutgoingMessage(mid);
  }

  reconnect(option?: IClientReconnectOptions): MqttClient {
    return this.client.reconnect(option);
  }

  handleMessage(packet: IConnectPacket): Observable<any> {
    return new Observable<any>(observer => {
      this.client.handleMessage(packet, (err, resultPacket) => {
        observer.next({
          err,
          packet: resultPacket
        });
        observer.complete();
      });
    });
  }

  getLastMessageId(): Observable<any> {
    return this.ready.pipe(
      switchMap(() => of(this.client.getLastMessageId()))
    );
  }
}
