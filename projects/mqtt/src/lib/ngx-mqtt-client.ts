import type {
  IClientOptions,
  IClientPublishOptions,
  IClientReconnectOptions,
  IClientSubscribeOptions,
  IPublishPacket,
  MqttClient,
  Packet,
} from 'mqtt';
import { AsyncSubject, Observable, of, Subject, switchMap } from 'rxjs';
import type { MqttEngine } from './mqtt-loader';
import type {
  ClientCreateResult,
  EndOption,
  HandleMessageResult,
  MessageResult,
  PublishResult,
  SubscribeResult,
  UnsubscribeOption,
  UnsubscribeResult,
} from './types';

export class NgxMqttClient {
  private client?: MqttClient;
  /** 连接就绪，create 连接成功后完成 */
  readonly ready: AsyncSubject<MqttClient> = new AsyncSubject<MqttClient>();
  /** 收到 publish 报文时发出 */
  readonly message: Subject<MessageResult> = new Subject<MessageResult>();

  constructor(
    private readonly engine: MqttEngine,
    private readonly url: string,
    private readonly option?: IClientOptions,
  ) {}

  /**
   * 连接 broker，并在连接成功后自动订阅主题
   */
  create(topic?: string[]): Observable<ClientCreateResult> {
    return new Observable<ClientCreateResult>((observer) => {
      const client = this.engine.connect(this.url, this.option);
      this.client = client;
      client.on('connect', (packet) => {
        if (topic !== undefined) {
          client.subscribe(topic);
        }
        observer.next({
          client,
          packet,
        });
        observer.complete();
        this.ready.next(client);
        this.ready.complete();
      });
      client.on('message', (topicName, payload, packet) => {
        this.message.next({
          topic: topicName,
          payload,
          packet,
        });
      });
    });
  }

  /**
   * 向主题发布消息
   */
  publish(
    topic: string,
    message: string,
    option?: IClientPublishOptions,
  ): Observable<PublishResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<PublishResult>((observer) => {
            this.requireClient().publish(topic, message, option, (error, packet) => {
              observer.next({
                error: error ?? null,
                packet,
              });
              observer.complete();
            });
          }),
      ),
    );
  }

  /**
   * 订阅一个或多个主题
   */
  subscribe(
    topic: string | string[],
    option?: IClientSubscribeOptions,
  ): Observable<SubscribeResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<SubscribeResult>((observer) => {
            this.requireClient().subscribe(topic, option, (error, granted) => {
              observer.next({
                error: error ?? null,
                granted: granted ?? [],
              });
              observer.complete();
            });
          }),
      ),
    );
  }

  /**
   * 取消订阅一个或多个主题
   */
  unsubscribe(topic: string | string[], option?: UnsubscribeOption): Observable<UnsubscribeResult> {
    return this.ready.pipe(
      switchMap(
        () =>
          new Observable<UnsubscribeResult>((observer) => {
            this.requireClient().unsubscribe(topic, option, (error, packet) => {
              observer.next({
                error: error ?? null,
                packet,
              });
              observer.complete();
            });
          }),
      ),
    );
  }

  /**
   * 关闭客户端
   */
  end(force?: boolean, option?: EndOption): MqttClient {
    return this.requireClient().end(force, option);
  }

  /**
   * 从 outgoingStore 中移除一条消息
   */
  removeOutgoingMessage(mid: number): MqttClient {
    return this.requireClient().removeOutgoingMessage(mid);
  }

  /**
   * 使用与 connect 相同的选项重新连接
   */
  reconnect(option?: IClientReconnectOptions): MqttClient {
    return this.requireClient().reconnect(option);
  }

  /**
   * 逐条处理带背压支持的消息
   */
  handleMessage(packet: IPublishPacket): Observable<HandleMessageResult> {
    return new Observable<HandleMessageResult>((observer) => {
      this.requireClient().handleMessage(packet, (error) => {
        observer.next({
          error: error ?? null,
          packet,
        });
        observer.complete();
      });
    });
  }

  /**
   * 获取最后发送消息的 id（仅针对已发送消息）
   */
  getLastMessageId(): Observable<number> {
    return this.ready.pipe(switchMap(() => of(this.requireClient().getLastMessageId())));
  }

  /**
   * 销毁客户端并释放资源
   */
  destroy(): void {
    this.client?.end();
    this.client?.removeAllListeners();
    this.ready.unsubscribe();
    this.message.unsubscribe();
  }

  /**
   * 销毁客户端并释放资源
   *
   * @deprecated 拼写错误，请使用 destroy()
   */
  destory(): void {
    this.destroy();
  }

  private requireClient(): MqttClient {
    if (!this.client) {
      throw new Error('MQTT client is not connected, call create() first');
    }
    return this.client;
  }
}
