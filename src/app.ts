import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { NgxMqttLiteService } from 'ngx-mqtt-lite';

interface MessageLog {
  time: string;
  topic: string;
  payload: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  private readonly mqtt = inject(NgxMqttLiteService);
  private messageSource?: Subscription;

  readonly url = signal('wss://test.mosquitto.org/mqtt');
  readonly username = signal('');
  readonly password = signal('');
  readonly connected = signal(false);
  readonly topics = signal<string[]>([]);
  readonly logs = signal<MessageLog[]>([]);
  readonly subscribeTopic = signal('notification');
  readonly publishTopic = signal('notification');
  readonly publishMessage = signal('hello ngx-mqtt-lite');
  readonly error = signal('');

  ngOnDestroy(): void {
    this.messageSource?.unsubscribe();
    this.mqtt.unregisterClient('default');
  }

  async connect(): Promise<void> {
    this.error.set('');
    try {
      const option = this.username()
        ? { username: this.username(), password: this.password() }
        : undefined;
      await firstValueFrom(this.mqtt.registerClient('default', this.url(), option));
      const client = this.mqtt.client('default');
      if (!client) return;
      this.messageSource = client.message.subscribe((result) => {
        this.logs.update((entries) =>
          [
            {
              time: new Date().toLocaleTimeString(),
              topic: result.topic,
              payload: result.payload.toString(),
            },
            ...entries,
          ].slice(0, 20),
        );
      });
      const created = await firstValueFrom(
        client.create(this.topics().length > 0 ? this.topics() : undefined),
      );
      this.connected.set(created.client.connected);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : '连接失败');
    }
  }

  disconnect(): void {
    this.messageSource?.unsubscribe();
    this.mqtt.unregisterClient('default');
    this.connected.set(false);
  }

  async subscribe(): Promise<void> {
    const topic = this.subscribeTopic().trim();
    const client = this.mqtt.client('default');
    if (!topic || !client) {
      this.error.set(client ? '请输入主题' : '请先连接 broker');
      return;
    }
    const result = await firstValueFrom(client.subscribe(topic));
    if (result.error) {
      this.error.set(result.error.message);
      return;
    }
    this.error.set('');
    this.topics.update((list) => (list.includes(topic) ? list : [...list, topic]));
  }

  async unsubscribe(topic: string): Promise<void> {
    const client = this.mqtt.client('default');
    if (!client) return;
    const result = await firstValueFrom(client.unsubscribe(topic));
    if (result.error) {
      this.error.set(result.error.message);
      return;
    }
    this.topics.update((list) => list.filter((item) => item !== topic));
  }

  async publish(): Promise<void> {
    const client = this.mqtt.client('default');
    if (!client) {
      this.error.set('请先连接 broker');
      return;
    }
    const result = await firstValueFrom(client.publish(this.publishTopic(), this.publishMessage()));
    if (result.error) {
      this.error.set(result.error.message);
    }
  }
}
