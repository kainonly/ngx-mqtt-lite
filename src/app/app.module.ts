import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NgxMqttLiteService} from "ngx-mqtt-lite";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    NgxMqttLiteService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ngxMqttLiteService: NgxMqttLiteService
  ) {
    ngxMqttLiteService.loadScript('https://unpkg.com/mqtt@4.1.0/dist/mqtt.min.js');
  }
}
