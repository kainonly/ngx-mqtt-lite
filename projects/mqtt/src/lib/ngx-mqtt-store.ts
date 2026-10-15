import type { IStore, Packet } from 'mqtt';
import { Observable } from 'rxjs';
import type { MqttEngine } from './mqtt-loader';
import type { StoreOption } from './types';

export class NgxMqttStore {
  /** mqtt 消息存储的内存实现 */
  readonly store: IStore;

  constructor(engine: MqttEngine, option?: StoreOption) {
    this.store = new engine.Store(option);
  }

  /**
   * 添加一个报文到存储
   */
  put(packet: Packet): Observable<string> {
    return new Observable<string>((observer) => {
      this.store.put(packet, () => {
        observer.next('ok');
        observer.complete();
      });
    });
  }

  /**
   * 创建包含存储中所有报文的流
   */
  createStream(): ReturnType<IStore['createStream']> {
    return this.store.createStream();
  }

  /**
   * 从存储中移除一个报文
   */
  del(packet: Pick<Packet, 'messageId'>): Observable<string> {
    return new Observable<string>((observer) => {
      this.store.del(packet, () => {
        observer.next('ok');
        observer.complete();
      });
    });
  }

  /**
   * 关闭存储
   */
  close(): Observable<string> {
    return new Observable<string>((observer) => {
      this.store.close(() => {
        observer.next('ok');
        observer.complete();
      });
    });
  }
}
