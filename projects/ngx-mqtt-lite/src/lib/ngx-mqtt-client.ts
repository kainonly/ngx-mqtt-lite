import { IClientOptions, IClientReconnectOptions, IClientSubscribeOptions, MqttClient, IClientPublishOptions } from 'mqtt';
import { AsyncSubject, Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ClientCreateResult,
  EndOption,
  HandleMessageResult,
  MessageResult,
  Packet,
  PublishResult,
  SubscribeResult,
  UnsubscribeOption,
  UnsubscribeResult
} from './ngx-mqtt-lite.types';

export class NgxMqttClient {
  private client: MqttClient;
  ready: AsyncSubject<MqttClient> = new AsyncSubject<MqttClient>();
  message: Subject<MessageResult> = new Subject<MessageResult>();

  constructor(
    private mqtt: any,
    private host: string,
    private option?: IClientOptions
  ) {
  }

  /**
   * Connects to the broker, And automatically subscribe to topics
   */
  create(topic?: string[]): Observable<ClientCreateResult> {
    return new Observable<any>(observer => {
      this.client = this.mqtt.connect(this.host, this.option);
      this.client.on('connect', packet => {
        if (topic !== undefined) {
          this.client.subscribe(topic);
        }
        observer.next({
          client: this.client,
          packet
        });
        observer.complete();
        this.ready.next(this.client);
        this.ready.complete();
      });
      this.client.on('message', (topicName, payload, packet) => {
        this.message.next({
          topic: topicName,
          payload,
          packet
        });
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, message: string, option?: IClientPublishOptions): Observable<PublishResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<PublishResult>(observer => {
            this.client.publish(topic, message, option, (error, packet: Packet) => {
              if (!error) {
                error = null;
              }
              observer.next({
                error,
                packet
              });
              observer.complete();
            });
          })
      )
    );
  }

  /**
   * Subscribe to a topic or topics
   */
  subscribe(topic: string | string[], option?: IClientSubscribeOptions): Observable<SubscribeResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<SubscribeResult>(observer => {
            this.client.subscribe(topic, option, (error, granted) => {
              if (!error) {
                error = null;
              }
              observer.next({
                error,
                granted
              });
              observer.complete();
            });
          })
      )
    );
  }

  /**
   * Unsubscribe from a topic or topics
   */
  unsubscribe(topic: string | string[], option?: UnsubscribeOption): Observable<UnsubscribeResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<UnsubscribeResult>(observer => {
            this.client.unsubscribe(topic, option, (error, packet) => {
              if (!error) {
                error = null;
              }
              observer.next({
                error,
                packet
              });
              observer.complete();
            });
          })
      )
    );
  }

  /**
   * Close the client, accepts the following options
   */
  end(force?: boolean, option?: EndOption): MqttClient {
    return this.client.end(force, option);
  }

  /**
   * Remove a message from the outgoingStore
   */

  /* istanbul ignore next */
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
  handleMessage(packet: Packet): Observable<HandleMessageResult> {
    return new Observable<HandleMessageResult>(observer => {
      this.client.handleMessage(packet, (error, resultPacket) => {
        if (!error) {
          error = null;
        }
        observer.next({
          error,
          packet: resultPacket
        });
        observer.complete();
      });
    });
  }

  /**
   * get last message id. This is for sent messages only
   */
  getLastMessageId(): Observable<number> {
    return this.ready.pipe(switchMap(() => of(this.client.getLastMessageId())));
  }

  /**
   * destory client
   */
  destory() {
    this.client.end();
    this.client.removeAllListeners();
    this.ready.unsubscribe();
    this.message.unsubscribe();
  }
}
