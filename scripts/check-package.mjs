import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'projects/mqtt/package.json'), 'utf8'));
const archive = join(root, 'dist', `${manifest.name}-${manifest.version}.tgz`);
assert.ok(existsSync(archive), '请先执行 npm run pack');
const consumer = mkdtempSync(join(tmpdir(), 'ngx-mqtt-lite-'));
try {
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync(
    'npm',
    ['install', archive, '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund'],
    { cwd: consumer, stdio: 'inherit' },
  );
  for (const dependency of ['@angular', 'rxjs', 'mqtt', 'tslib']) {
    const target = join(consumer, 'node_modules', dependency);
    if (!existsSync(target)) {
      symlinkSync(join(root, 'node_modules', dependency), target, 'dir');
    }
  }
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "await import('@angular/compiler'); const library = await import('ngx-mqtt-lite'); if (!library.NgxMqttLiteService || !library.MQTT_LOADER || !library.NgxMqttClient || !library.NgxMqttStore || !library.factoryPolicyTopic) throw new Error('缺少公共 API'); const module = await import('mqtt'); const engine = module.default ?? module; if (typeof engine.connect !== 'function' || typeof engine.Store !== 'function') throw new Error('MQTT 引擎在无 DOM 环境加载失败'); console.log('库与 MQTT 引擎在无 DOM 环境加载通过');",
    ],
    { cwd: consumer, stdio: 'inherit' },
  );
  writeFileSync(
    join(consumer, 'consumer.ts'),
    `
import { Component, inject, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NgxMqttLiteService, NgxMqttClient, PolicyTopicOption, factoryPolicyTopic } from 'ngx-mqtt-lite';

@Component({
  selector: 'app-consumer',
  template: '',
})
export class Consumer implements OnDestroy {
  private readonly mqtt = inject(NgxMqttLiteService);
  private client?: NgxMqttClient;

  async connect(): Promise<void> {
    await firstValueFrom(this.mqtt.registerClient('default', 'wss://example.com/mqtt'));
    this.client = this.mqtt.client('default');
  }

  ngOnDestroy(): void {
    this.mqtt.unregisterClient('default');
  }

  subscribe(): void {
    const options: PolicyTopicOption[] = [
      { topic: 'notification', policy: 0, username: 'kain' },
    ];
    this.client?.subscribe(factoryPolicyTopic(options));
  }
}
`,
  );
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'preserve',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        outDir: './out',
        types: [],
      },
      angularCompilerOptions: { strictTemplates: true },
      files: ['consumer.ts'],
    }),
  );
  execFileSync(join(root, 'node_modules/.bin/ngc'), ['-p', join(consumer, 'tsconfig.json')], {
    cwd: consumer,
    stdio: 'inherit',
  });
  console.log('压缩包独立安装、无 DOM 导入和 Angular AOT 消费编译通过。');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
