import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

import { ColorZonesService } from './color-zones.service';
import { TimeZone } from './models/timeZone';
import { Polygon } from './models/polygon';
import { Vector } from './utils/vector';
import { Renderer } from './utils/renderer/renderer.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';

import * as moment from 'moment-timezone';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'body',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild(Renderer, { static: false }) private renderer: Renderer;
  @ViewChild(ColorPickerComponent, { static: false }) private colorPicker: ColorPickerComponent;
  // Options from view
  colorAllZones = true;
  showTimes = false;
  opacity = 80;
  // Map options
  width = 1200;
  height = 700;
  private centerLat = 20;
  private centerLng = 0;
  private zoom = 1.3;
  private mapboxAccessToken: string = 'pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g';
  private mapBaseUrl: string = 'https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/';
  // Properties
  private timeZones: TimeZone[];
  private timeZoneRegions: Map<string, Map<string, Polygon>> = new Map();
  private hoverTimeZoneKey: string;
  private hoverRegionKey: string;
  private selectedZoneInfo: ZoneInfo;
  private mouseX: number;
  private mouseY: number;
  private hoverZoneColor = '#660d60';
  private timeFormat = 'HH:mm:ss';

  constructor(private colorZonesService: ColorZonesService,
    private titleService: Title) { }

  doRender(renderer: Renderer) {
    if (!this.timeZones) {
      return;
    }

    let timeTexts = new Array<ZoneInfo>();
    for (let timeZone of this.timeZones) {
      let current = moment().tz(timeZone.name);

      let hours = this.adjustTime(current.hours());
      let minutes = this.adjustTime(current.minutes());
      let seconds = this.adjustTime(current.seconds());

      let red = this.colorPicker.getRedInterval(hours, minutes, seconds);
      let green = this.colorPicker.getGreenInterval(hours, minutes, seconds);
      let blue = this.colorPicker.getBlueInterval(hours, minutes, seconds);
      let color = '#' + red + green + blue;

      if (this.colorAllZones) {
        let mappedCoords = this.mapCoords(renderer, timeZone.coords);
        renderer.polygon(mappedCoords, color, this.opacity);
      }

      let zoneInfo: ZoneInfo;
      if (timeZone.centroidPolygon) {
        zoneInfo = {
          textX: timeZone.centroidPolygon.centroidCoord.x,
          textY: timeZone.centroidPolygon.centroidCoord.y,
          time: current.format(this.timeFormat) as string,
          colorHex: color
        };
        timeTexts.push(zoneInfo);
      }
      if (this.hoverTimeZoneKey && this.hoverTimeZoneKey !== '' && this.hoverTimeZoneKey === timeZone.name) {
        this.selectedZoneInfo = zoneInfo;
      }
    }

    let hoverTimeZone = this.timeZoneRegions[this.hoverTimeZoneKey] as Map<string, Polygon>;
    if (hoverTimeZone) {
      for (let key in hoverTimeZone) {
        if (hoverTimeZone.hasOwnProperty(key)) {
          let zone = hoverTimeZone[key] as Polygon;
          if (!zone || !zone.coords || zone.coords.length === 0) {
            continue;
          }

          let hoverColor = this.colorAllZones || !this.selectedZoneInfo ? this.hoverZoneColor : this.selectedZoneInfo.colorHex;
          let mappedCoords = this.mapCoords(renderer, zone.coords);
          renderer.polygon(mappedCoords, hoverColor, 80);
        }
      }
    }

    let textColor = this.colorAllZones ? 'white' : 'black';
    if (this.selectedZoneInfo) {
      let cartesianVector = this.toCartesianVector(renderer, this.mouseX, this.mouseY);
      if (!this.showTimes) {
        renderer.text(cartesianVector.x, cartesianVector.y - 5, this.selectedZoneInfo.time, textColor, true);
      }
      renderer.text(cartesianVector.x, cartesianVector.y - 25, this.hoverRegionKey, textColor, true);
      renderer.text(cartesianVector.x, cartesianVector.y - 45, this.selectedZoneInfo.colorHex, textColor, true);
    }

    // Need to do this in a separate loop here to have the times drawn on top
    if (!this.showTimes) {
      return;
    }
    for (let i = 0; i < timeTexts.length; i++) {
      let cartesianVector = this.toCartesianVector(renderer, timeTexts[i].textX, timeTexts[i].textY);
      renderer.text(cartesianVector.x, cartesianVector.y, timeTexts[i].time, 'black');
    }
  }

  onMouseOver(position: Vector) {
    if (!this.timeZones || this.timeZones.length === 0) {
      return;
    }

    for (let timeZone of this.timeZones) {
      let boundingBox = timeZone.boundingBox;
      if (boundingBox === undefined) {
        return;
      }

      let x = position.x,
        y = position.y;

      // Source: https://github.com/dosx/timezone-picker
      if (y > boundingBox.coordMax.y && y < boundingBox.coordMin.y &&
        x > boundingBox.coordMin.x && x < boundingBox.coordMax.x) {
        // Mouse is in the zone bounds, so now have to check if it is in one of this zone's regions
        let regions = this.timeZoneRegions[timeZone.name] as Map<string, Polygon>;
        for (let key in regions) {
          if (regions.hasOwnProperty(key)) {
            let region = regions[key] as Polygon;
            if (this.rayCastTest(region.coords, x, y)) {
              this.hoverTimeZoneKey = timeZone.name;
              this.hoverRegionKey = key;
              this.mouseX = x;
              this.mouseY = y;
              return;
            }
          }
        }
      }
    }
  }

  updateOpacity(value: number) {
    this.opacity = value;
  }

  ngAfterViewInit() {
    this.titleService.setTitle('Color Zones');

    this.fetchMap();

    forkJoin(
      this.colorZonesService.fetchTimeZones(this.centerLat, this.centerLng, this.zoom, this.width),
      this.colorZonesService.fetchBoundingBoxes(this.centerLat, this.centerLng, this.zoom, this.width)
    ).subscribe(result => {
      this.timeZones = result[0];
      let boundingBoxes = result[1];

      for (let timeZone of this.timeZones) {
        for (let boundingBox of boundingBoxes) {
          if (timeZone.matchesId(boundingBox.name)) {
            timeZone.boundingBox = boundingBox;
          }
        }

        // Get the time zone polygons
        this.colorZonesService.fetchZonePolygons(timeZone, this.centerLat, this.centerLng, this.zoom, this.width)
          .subscribe((polygonMap) => {
            // Check each polygon to find the largest by seeing if it has the most edges
            // Use the largest polygon's centroid as the timezone centroid
            let maxPoints = 0;
            let centroidName: string;

            for (let key in polygonMap) {
              if (polygonMap.hasOwnProperty(key)) {
                let polygon = polygonMap[key];
                if (polygon.coords.length > maxPoints) {
                  maxPoints = polygon.coords.length;
                  centroidName = polygon.name;
                }

                this.timeZoneRegions[timeZone.name] = polygonMap;
                timeZone.centroidPolygon = polygonMap[centroidName];
              }
            }
          });
      }
    }, error => {
      if (!environment.production) {
        console.error(error.message);
      }
    });
  }

  private fetchMap() {
    let url = `${this.mapBaseUrl}${this.centerLng},${this.centerLat},${this.zoom},0,0/${this.width}x${this.height}?access_token=${this.mapboxAccessToken}`;
    this.renderer.loadImageBackground(url, (error) => {
      console.error(error.message);
    });
  }

  private rayCastTest(points: Vector[], x: number, y: number): boolean {
    let rayTest = 0;
    let lastPoint = points[points.length - 1];

    for (let j = 0; j < points.length; j++) {
      let point = points[j];

      if ((lastPoint.y <= y && point.y >= y) ||
        (lastPoint.y > y && point.y < y)) {
        let slope = (point.x - lastPoint.x) / (point.y - lastPoint.y);
        let testPoint = slope * (y - lastPoint.y) + lastPoint.x;
        if (testPoint < x) {
          rayTest++;
        }
      }
      lastPoint = point;
    }
    // If the count is odd, we are in the polygon
    return rayTest % 2 === 1;
  }

  private adjustTime(interval) {
    if (interval < 10) {
      interval = '0' + interval;
    }
    return interval.toString();
  }

  private mapCoords(renderer: Renderer, coords: Vector[]): Vector[] {
    var midWidth = renderer.width / 2;
    var midHeight = renderer.height / 2;

    let mappedCoords = Array<Vector>();
    for (let coord of coords) {
      let cartesianX = midWidth + coord.x;
      let cartesianY = midHeight + coord.y;

      let mappedCoord = new Vector(cartesianX, cartesianY, coord.z);
      mappedCoords.push(mappedCoord);
    }
    return mappedCoords;
  }

  private toCartesianVector(renderer: Renderer, x: number, y: number) {
    var midWidth = renderer.width / 2;
    var midHeight = renderer.height / 2;
    let cartesianX = midWidth + x;
    let cartesianY = midHeight + y;

    return new Vector(cartesianX, cartesianY, 0);
  }
}

interface ZoneInfo {
  textX: number;
  textY: number;
  time: string;
  colorHex: string;
}
