import { Component, OnInit } from '@angular/core';
import { factoryPolicyTopic, NgxMqttLiteService } from 'ngx-mqtt-lite';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(
    private mqtt: NgxMqttLiteService
  ) {
  }

  ngOnInit() {
    this.mqtt.registerClient('default', 'wss://mqtt.kainonly.com/mqtt', {
      username: '5a90afb1-2ab1-4b50-a12d-43281a988cfb',
      password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTI5Njc5NTF9.0ndmcKT9BwcDxeXupzAYx5pCsTHbW5Ge5t5ta21tSaI'
    }).subscribe(status => {
      console.log(status);
    });
    const topic = factoryPolicyTopic([
      { topic: 'notification', policy: 0, username: 'kain' }
    ]);
    timer(1000).pipe(
      switchMap(() => this.mqtt.client('default').create(topic))
    ).subscribe(result => {
      console.log(result);
    });

  }
}
