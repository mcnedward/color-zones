import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { Renderer } from './utils/renderer/renderer.component';
import { ColorZonesService } from './color-zones.service';

@NgModule({
  declarations: [
    AppComponent,
    ColorPickerComponent,
    Renderer
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [
    ColorZonesService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
