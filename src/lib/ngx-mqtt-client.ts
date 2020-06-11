import { IConnectPacket } from 'mqtt-packet';
import { IClientOptions, IClientReconnectOptions, IClientSubscribeOptions, MqttClient } from 'mqtt/types';
import { IClientPublishOptions } from 'mqtt/types/lib/client-options';
import { AsyncSubject, Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ClientCreateResult, MessageResult } from './mqtt-lite.types';

declare let mqtt: any;

export class NgxMqttClient {
  private client: MqttClient;
  private ready: AsyncSubject<any> = new AsyncSubject<any>();
  message: Subject<MessageResult> = new Subject<MessageResult>();

  constructor(
    private host: string,
    private option?: IClientOptions
  ) {
  }

  /**
   * Connects to the broker, And automatically subscribe to topics
   */
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
      this.client.on('message', (topicName, payload) => {
        this.message.next({
          topic: topicName,
          payload
        });
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, message: string, option?: IClientPublishOptions): Observable<any> {
    return this.ready.pipe(
      switchMap(() => new Observable(observer => {
        this.client.publish(topic, message, option, (error) => {
          observer.next({
            error: !error ? null : error
          });
          observer.complete();
        });
      }))
    );
  }

  /**
   * Subscribe to a topic or topics
   */
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

  /**
   * Unsubscribe from a topic or topics
   */
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

  /**
   * Close the client, accepts the following options
   */
  end(force?: boolean, option?: any): MqttClient {
    return this.client.end(force, option);
  }

  /**
   * Remove a message from the outgoingStore
   */
  removeOutgoingMessage(mid: number): MqttClient {
    return this.client.removeOutgoingMessage(mid);
  }

  /**
   * Connect again using the same options as connect
   */
  reconnect(option?: IClientReconnectOptions): MqttClient {
    return this.client.reconnect(option);
  }

  /**
   * Handle messages with backpressure support, one at a time
   */
  handleMessage(packet: IConnectPacket): Observable<any> {
    return new Observable(observer => {
      this.client.handleMessage(packet, (error, resultPacket) => {
        observer.next({
          error: !error ? null : error,
          packet: !resultPacket ? null : resultPacket
        });
        observer.complete();
      });
    });
  }

  /**
   * get last message id. This is for sent messages only
   */
  getLastMessageId(): Observable<any> {
    return this.ready.pipe(
      switchMap(() => of(this.client.getLastMessageId()))
    );
  }
}
