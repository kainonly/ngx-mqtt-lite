import { Store } from 'mqtt';
import { Observable } from 'rxjs';

export class NgxMqttStore {
  store: Store;

  constructor(
    mqtt: any,
    option: any
  ) {
    this.store = mqtt.Store(option);
  }

  /**
   * Adds a packet to the store
   */
  put(packet: any): Observable<any> {
    return new Observable(observer => {
      this.store.put(packet, () => {
        observer.next('ok');
        observer.complete();
      });
    });
  }

  /**
   * Creates a stream with all the packets in the store
   */
  createStream(): any {
    return this.store.createStream();
  }

  /**
   * Removes a packet from the store
   */
  del(packet: any): Observable<any> {
    return new Observable(observer => {
      this.store.del(packet, () => {
        observer.next('ok');
        observer.complete();
      });
    });
  }

  /**
   * Closes the Store
   */
  close(): Observable<any> {
    return new Observable(observer => {
      this.store.close(() => {
        observer.next('ok');
        observer.complete();
      });
    });
  }
}
