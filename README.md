# NGX MQTT LITE

A Lite Wrapper Around MQTT.js for Angular

[![npm](https://img.shields.io/npm/v/ngx-mqtt-lite.svg?style=flat-square)](https://www.npmjs.com/package/ngx-mqtt-lite)
[![Downloads](https://img.shields.io/npm/dm/ngx-mqtt-lite.svg?style=flat-square)](https://www.npmjs.com/package/ngx-mqtt-lite)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/kainonly/ngx-mqtt-lite/blob/master/LICENSE)

### Setup

```shell
npm install ngx-mqtt-lite --save
```

### Configuration

Load mqtt library, you can use local or external CDN

```typescript
export class AppModule {
  constructor(
    ngxMqttLiteService: NgxMqttLiteService
  ) {
    ngxMqttLiteService.loadScript('https://unpkg.com/mqtt@4.1.0/dist/mqtt.min.js');
  }
}
```

### Usage

Register MQTT broker

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  ngOnInit() {
    this.mqtt.registerClient('default', 'wss://example.com/mqtt', {}).subscribe(status => {

    });
  }
}
```

Connects to the broker, And automatically subscribe to topics

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  ngOnInit() {
    const topic = factoryPolicyTopic([
      { topic: 'notification', policy: 0, username: 'kain' }
    ]);
    this.mqtt.client('default').create(topic).subscribe(result => {
      console.log(result.client.connected);
    });
  }
}
```

Publish a message to a topic

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  publish() {
    this.mqtt.client('default').publish('notification', 'hello');
  }
}
```

Subscribe to a topic or topics

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  subscribe() {
    this.mqtt.client('default').subscribe('tests').subscribe(result => {
    
    });
  }
}
```

receives a publish packet

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  ngOnInit() {
    this.mqtt.client('default').message.subscribe(result => {
      if (result.topic === 'notification') {
        console.log(result.payload);
      }
    });
  }
}
```

unregister MQTT broker

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  unregister() {
    this.mqtt.unregisterClient('default');
  }
}
```

#### NgxMqttClient

Property

- `ready: AsyncSubject< MqttClient >` Connect ready
- `message: Subject< MessageResult >` Emitted when the client receives a publish packet

Method

- `create(topic?: string[]): Observable< ClientCreateResult >` Connects to the broker, And automatically subscribe to topics
- `publish(topic: string, message: string, option?: IClientPublishOptions): Observable< PublishResult >` Publish a message to a topic
- `subscribe(topic: string | string[], option?: IClientSubscribeOptions): Observable< SubscribeResult >` Subscribe to a topic or topics
- `unsubscribe(topic: string | string[], option?: UnsubscribeOption): Observable< UnsubscribeResult >` Unsubscribe from a topic or topics
- `end(force?: boolean, option?: EndOption): MqttClient` Close the client, accepts the following options
- `removeOutgoingMessage(mid: number): MqttClient` Remove a message from the outgoingStore
- `reconnect(option?: IClientReconnectOptions): MqttClient` Connect again using the same options as connect
- `handleMessage(packet: Packet): Observable< HandleMessageResult >` Handle messages with backpressure support, one at a time
- `getLastMessageId(): Observable< number >` get last message id. This is for sent messages only
- `destory()` destory client

***

register in-memory implementation of the message store

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public mqtt: NgxMqttLiteService
  ) {
  }

  ngOnInit() {
    this.mqtt.registerStore('default', {
      clean: false
    }).pipe(
      switchMap(status => {
        const store = this.mqtt.store('default');
        return this.mqtt.registerClient('default', 'wss://example.com/mqtt', {
          incomingStore: store.store
        });
      })
    ).subscribe(status => {
      
    });
  }
}
```

#### NgxMqttStore

Property

- `store: Store` In-memory implementation of the message store

Method

- `put(packet: any): Observable< any >` Adds a packet to the store
- `createStream(): any` Creates a stream with all the packets in the store
- `del(packet: any): Observable< any >` Removes a packet from the store
- `close(): Observable< any >` Closes the Store
