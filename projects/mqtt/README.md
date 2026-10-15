# NGX MQTT LITE

A Lite Wrapper Around MQTT.js for Angular，无需 zone.js（zoneless），MQTT.js 按需惰性加载。

[![npm](https://img.shields.io/npm/v/ngx-mqtt-lite.svg?style=flat-square)](https://www.npmjs.com/package/ngx-mqtt-lite)
[![Downloads](https://img.shields.io/npm/dm/ngx-mqtt-lite.svg?style=flat-square)](https://www.npmjs.com/package/ngx-mqtt-lite)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/kainonly/ngx-mqtt-lite/blob/master/LICENSE)

## 安装

本库与 Angular **大版本**保持一致即可使用（peerDependencies 为 `^22.2.0`，适配 Angular `22.x` 全系）。版本号的 `major.minor` 跟随构建时的 Angular 版本，例如 `22.2.0` 基于 Angular `22.2` 构建。安装本库与 MQTT.js 依赖：

```sh
npm install ngx-mqtt-lite mqtt
```

### 从 v21 升级

v21 及之前版本通过 `loadScript()` 从 CDN 加载 `mqtt.min.js` 全局脚本，该方式已移除。现在 mqtt 作为 npm 依赖由 `MQTT_LOADER` 通过动态 `import('mqtt')` 按需加载，删除 `loadScript` 调用即可，`registerClient` / `registerStore` 的签名保持不变。

## 运行示例

仓库根目录的 `src/` 是一个完整的示例应用，演示连接 broker（默认 Eclipse 公共测试服务器 test.mosquitto.org）、订阅、发布与消息日志：

```sh
git clone https://github.com/kainonly/ngx-mqtt-lite.git
cd ngx-mqtt-lite
npm install
npm run demo
```

打开 <http://localhost:4200> 查看效果。示例通过 `tsconfig.json` 的路径映射消费 `dist/mqtt` 中的构建产物，`npm run demo` 会先构建库再启动开发服务器。

## 注册客户端

`NgxMqttLiteService` 以 `providedIn: 'root'` 提供，直接注入即可。首次注册时才动态加载 MQTT.js：

```ts
import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NgxMqttLiteService } from 'ngx-mqtt-lite';

@Component({
  selector: 'app-example',
  template: '',
})
export class ExampleComponent implements OnInit {
  private readonly mqtt = inject(NgxMqttLiteService);

  async ngOnInit(): Promise<void> {
    await firstValueFrom(
      this.mqtt.registerClient('default', 'wss://example.com/mqtt', {
        username: 'kain',
        password: 'secret',
      }),
    );
  }
}
```

连接 broker，并自动订阅主题：

```ts
const client = this.mqtt.client('default')!;
const created = await firstValueFrom(client.create(['notification']));
console.log(created.client.connected);
```

使用 `factoryPolicyTopic` 生成带私有策略的主题（`policy: 0` 公共主题原样输出，`policy: 1` 追加用户名后缀）：

```ts
import { factoryPolicyTopic } from 'ngx-mqtt-lite';

const topic = factoryPolicyTopic([
  { topic: 'notification', policy: 0, username: 'kain' },
  { topic: 'message', policy: 1, username: 'kain' },
]);
// ['notification', 'message/kain']
await firstValueFrom(client.create(topic));
```

## 发布与订阅

发布消息：

```ts
const result = await firstValueFrom(client.publish('notification', 'hello'));
console.log(result.error); // null 表示成功
```

订阅 / 退订主题：

```ts
const subscribed = await firstValueFrom(client.subscribe('tests'));
console.log(subscribed.granted);

await firstValueFrom(client.unsubscribe('tests'));
```

接收消息（组件销毁时记得取消订阅）：

```ts
client.message.subscribe((result) => {
  if (result.topic === 'notification') {
    console.log(result.payload.toString());
  }
});
```

注销客户端：

```ts
this.mqtt.unregisterClient('default');
```

### 自定义引擎加载

默认通过动态 `import('mqtt')` 加载引擎，可替换 `MQTT_LOADER`，例如指向自己的打包产物或 mock：

```ts
import { MQTT_LOADER } from 'ngx-mqtt-lite';

bootstrapApplication(App, {
  providers: [{ provide: MQTT_LOADER, useValue: () => import('mqtt') }],
});
```

## SSR

本库不提供也不需要服务端渲染支持，但保证在 SSR 环境下**不报错**：模块加载与依赖注入不触达任何浏览器 API（`document` / `window` 等），MQTT.js 引擎由 `MQTT_LOADER` 惰性动态导入，在服务端解析为 Node 构建，`connect` 与 `Store` 均可用。连接、订阅等操作应由浏览器端的用户交互触发，避免在服务端渲染期间建立真实连接；如需在 `ngOnInit` 中连接，建议使用 `isPlatformBrowser` 保护。

## 消息存储

注册 in-memory 消息存储，配合 `incomingStore` 实现会话恢复：

```ts
await firstValueFrom(this.mqtt.registerStore('default', { clean: false }));
const store = this.mqtt.store('default')!;
await firstValueFrom(
  this.mqtt.registerClient('default', 'wss://example.com/mqtt', {
    incomingStore: store.store,
  }),
);
```

## API

### NgxMqttClient

| 属性 / 方法                                                   | 说明                                         |
| ------------------------------------------------------------- | -------------------------------------------- |
| `ready: AsyncSubject<MqttClient>`                             | 连接就绪，`create` 连接成功后完成            |
| `message: Subject<MessageResult>`                             | 收到 publish 报文时发出                      |
| `create(topic?: string[]): Observable<ClientCreateResult>`    | 连接 broker，并自动订阅主题                  |
| `publish(topic, message, option?): Observable<PublishResult>` | 发布消息                                     |
| `subscribe(topic, option?): Observable<SubscribeResult>`      | 订阅一个或多个主题                           |
| `unsubscribe(topic, option?): Observable<UnsubscribeResult>`  | 退订一个或多个主题                           |
| `end(force?, option?): MqttClient`                            | 关闭客户端                                   |
| `removeOutgoingMessage(mid: number): MqttClient`              | 从 outgoingStore 移除一条消息                |
| `reconnect(option?): MqttClient`                              | 使用与 connect 相同的选项重连                |
| `handleMessage(packet): Observable<HandleMessageResult>`      | 逐条处理带背压支持的消息                     |
| `getLastMessageId(): Observable<number>`                      | 获取最后发送消息的 id                        |
| `destroy(): void`                                             | 销毁客户端并释放资源（`destory` 为兼容别名） |

### NgxMqttStore

| 属性 / 方法                       | 说明                    |
| --------------------------------- | ----------------------- |
| `store: IStore`                   | mqtt 消息存储的内存实现 |
| `put(packet): Observable<string>` | 添加一个报文到存储      |
| `createStream(): Readable`        | 创建包含所有报文的流    |
| `del(packet): Observable<string>` | 从存储中移除一个报文    |
| `close(): Observable<string>`     | 关闭存储                |

### NgxMqttLiteService

| 方法                                                    | 说明                    |
| ------------------------------------------------------- | ----------------------- |
| `registerClient(id, url, option?): Observable<boolean>` | 注册 MQTT broker        |
| `unregisterClient(id): boolean`                         | 注销并销毁 MQTT broker  |
| `client(id): NgxMqttClient \| undefined`                | 获取 MQTT broker 客户端 |
| `registerStore(id, option?): Observable<boolean>`       | 注册消息存储            |
| `unregisterStore(id): boolean`                          | 注销并关闭消息存储      |
| `store(id): NgxMqttStore \| undefined`                  | 获取消息存储            |

## 事件与类型

`MQTT_LOADER`、`MqttEngine` 以及 `IClientOptions`、`MqttClient` 等常用 MQTT.js 类型均可从 `ngx-mqtt-lite` 直接导入，无需额外引用 `mqtt` 包。
