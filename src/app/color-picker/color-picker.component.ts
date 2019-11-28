import { Component, OnInit } from '@angular/core';

/**
 * A Component for picking which colors should be used for a time interval. Each interval will have a unique color.
 *  For example, the picker starts with hours as red, minutes as green, and seconds as blue. 
 * If you open the seconds picker and select red, then the hours picker will automatically switch to the blue color (minutes will stay the same).
 */
@Component({
    selector: 'color-picker',
    templateUrl: './color-picker.component.html',
    styles: ['#colorControl .card-block{padding: 0;}', 'btn{color: #fff important;}']
})
export class ColorPickerComponent implements OnInit {
    hoursColor: string;
    minutesColor: string;
    secondsColor: string;
    private hours = 'hours';
    private minutes = 'minutes';
    private seconds = 'seconds';
    private colors: IColor;

	/**Get the time interval for the color red.
	 * For example, if the Hours ColorPicker option is selected as the red color, then this function will return the value passed in as the 'hours' parameter.	
	 */
    getRedInterval(hours: number, minutes: number, seconds: number): string {
        let interval = this.colors.red.interval;
        return this.getInterval(interval, hours, minutes, seconds);
    }
	/**Get the time interval for the color green.
 * For example, if the Hours ColorPicker option is selected as the green color, then this function will return the value passed in as the 'hours' parameter.	
 */
    getGreenInterval(hours: number, minutes: number, seconds: number): string {
        let interval = this.colors.green.interval;
        return this.getInterval(interval, hours, minutes, seconds);
    }
	/**Get the time interval for the color blue.
 * For example, if the Hours ColorPicker option is selected as the blue color, then this function will return the value passed in as the 'hours' parameter.	
 */
    getBlueInterval(hours: number, minutes: number, seconds: number): string {
        let interval = this.colors.blue.interval;
        return this.getInterval(interval, hours, minutes, seconds);
    }
    private getInterval(interval: string, hours: number, minutes: number, seconds: number): string {
        switch (interval) {
            case this.hours:
                return String(hours);
            case this.minutes:
                return String(minutes);
            case this.seconds:
                return String(seconds);
            default:
                console.warn('Could not find an interval for: ' + interval + '...');
        }
    }

    update(intervalName: string, color: string) {
        // Access the class name of the IColor object based on the updated color
        let theClass = this.colors[color].class;
        // intervalName can be: hours, minutes, or seconds, so update one of the following properties: hoursColor, minutesColor, secondsColor
        this[intervalName + 'Color'] = theClass;

        let originalColorKey: string;
        for (let key in this.colors) {
            if (this.colors[key].interval === intervalName) {
                originalColorKey = key;
                break;
            }
        }

        let overridden = this.colors[color];
        let originalClass = this.colors[originalColorKey].class;
        this[overridden.interval + 'Color'] = originalClass;

        let temp = this.colors[color].interval;
        this.colors[color].interval = intervalName;
        this.colors[originalColorKey].interval = temp;
    }

    ngOnInit() {
        this.colors = {
            red: {
                class: 'btn-danger',
                interval: this.hours
            },
            green: {
                class: 'btn-success',
                interval: this.minutes
            },
            blue: {
                class: 'btn-primary',
                interval: this.seconds
            }
        };
        this.hoursColor = this.colors.red.class;
        this.minutesColor = this.colors.green.class;
        this.secondsColor = this.colors.blue.class;
    }
}

interface IColor {
    red: { class: string, interval: string };
    green: { class: string, interval: string };
    blue: { class: string, interval: string };
}