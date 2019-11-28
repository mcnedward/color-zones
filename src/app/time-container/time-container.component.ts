import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

/**
 * A Component for picking which colors should be used for a time interval. Each interval will have a unique color.
 *  For example, the picker starts with hours as red, minutes as green, and seconds as blue. 
 * If you open the seconds picker and select red, then the hours picker will automatically switch to the blue color (minutes will stay the same).
 */
@Component({
  selector: 'time-container',
  templateUrl: './time-container.component.html',
  styleUrls: []
})
export class TimeContainerComponent implements OnInit, OnChanges {
  @Input() interval: string;
  @Input() intervalColor: string;
  @Input() colors: IColor;
  @Output() colorSelected = new EventEmitter<string[]>();
  redClass: string;
  greenClass: string;
  blueClass: string;

  ngOnInit() {
    // switch (this.defaultColor) {
    //   case 'red':
    //     this.selectRed();
    //     return;
    //   case 'green':
    //     this.selectGreen();
    //     return;
    //   case 'blue':
    //     this.selectBlue();
    //     return;
    // }
  }
  ngOnChanges() {
    if (this.colors == null) return;
    if (this.colors.red.interval === this.interval) {
      this.redClass = 'btn ' + this.colors.red.class;
    } else {
      this.redClass = 'btn btn-gray';
    }
    if (this.colors.green.interval === this.interval) {
      this.greenClass = 'btn ' + this.colors.green.class;
    } else {
      this.greenClass = 'btn btn-gray';
    }
    if (this.colors.blue.interval === this.interval) {
      this.blueClass = 'btn ' + this.colors.blue.class;
    } else {
      this.blueClass = 'btn btn-gray';
    }
  }

  getRedClass() {
    if (this.colors == null) return 'btn btn-gray';
    if (this.colors.red.interval === this.interval) {
      return 'btn ' + this.colors.red.class;
    }
    return 'btn btn-gray';
  }

  getGreenClass() {
    if (this.colors == null) return 'btn btn-gray';
    if (this.colors.green.interval === this.interval) {
      return 'btn ' + this.colors.green.class;
    }
    return 'btn btn-gray';
  }

  getBlueClass() {
    if (this.colors == null) return 'btn btn-gray';
    if (this.colors.blue.interval === this.interval) {
      return 'btn ' + this.colors.blue.class;
    }
    return 'btn btn-gray';
  }

  selectRed() {
    this.redClass = 'btn btn-red';
    this.greenClass = 'btn btn-gray';
    this.blueClass = 'btn btn-gray';
    this.colorSelected.emit([this.interval, 'red']);
  }
  selectGreen() {
    this.redClass = 'btn btn-gray';
    this.greenClass = 'btn btn-green';
    this.blueClass = 'btn btn-gray';
    this.colorSelected.emit([this.interval, 'green']);
  }
  selectBlue() {
    this.redClass = 'btn btn-gray';
    this.greenClass = 'btn btn-gray';
    this.blueClass = 'btn btn-blue';
    this.colorSelected.emit([this.interval, 'blue']);
  }

}

interface IColor {
  red: { class: string, interval: string };
  green: { class: string, interval: string };
  blue: { class: string, interval: string };
}