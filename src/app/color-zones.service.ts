import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Vector } from './utils/vector';
import { Polygon } from './models/polygon';
import { BoundingBox } from './models/boundingBox';
import { TimeZone } from './models/timeZone';
import Logger from './utils/logger';
import { environment } from 'src/environments/environment';

@Injectable()
export class ColorZonesService {
    private boundsApiUrl: string = `${environment.apiUrl}/color-zones/map-bounds`;
    private hoverRegionsApiUrl: string = `${environment.apiUrl}/color-zones/hover-regions`;
    private polygonsApiUrl = `${environment.apiUrl}/color-zones/polygons`;

    constructor(private http: Http) {
    }

    public fetchTimeZones(centerLat: number, centerLng: number, zoom: number, mapWidth: number): Observable<TimeZone[]> {
        return this.http.get(this.hoverRegionsApiUrl)
            .pipe(map(response => {
                let timeZones = new Array<TimeZone>();
                let hoverRegions = JSON.parse(response.json()) || [];

                for (let x = 0; x < hoverRegions.length; x++) {
                    let hoverRegion = hoverRegions[x];
                    let coords = new Array<Vector>();
                    for (let i = 0; i < hoverRegion.hoverRegion.length; i++) {
                        let region = hoverRegion.hoverRegion[i];

                        for (let j = 0; j < region.points.length; j += 2) {
                            let pointPair = region.points.slice(j, j + 2);
                            let coord = this.getCoord(pointPair[0], pointPair[1], centerLat, centerLng, zoom, mapWidth);
                            coords.push(coord);
                        }
                    }
                    timeZones.push(new TimeZone(hoverRegion.name, coords));
                }
                return timeZones;
            }))
    }

    public fetchBoundingBoxes(centerLat: number, centerLng: number, zoom: number, mapWidth: number): Observable<BoundingBox[]> {
        return this.http.get(this.boundsApiUrl)
            .pipe(map(response => {
                let boundingBoxes = new Array<BoundingBox>();
                let data = JSON.parse(response.json()) || [];

                for (let i = 0; i < data.length; i++) {
                    let box = data[i];
                    let boundingBox = box.boundingBox;
                    let coordMin = this.getCoord(boundingBox.ymin, boundingBox.xmin, centerLat, centerLng, zoom, mapWidth);
                    let coordMax = this.getCoord(boundingBox.ymax, boundingBox.xmax, centerLat, centerLng, zoom, mapWidth);

                    boundingBoxes.push(new BoundingBox(box.name, coordMin, coordMax));
                }
                return boundingBoxes;
            }));
    }

    public fetchZonePolygons(timeZone: TimeZone, centerLat: number, centerLng: number, zoom: number, mapWidth: number): Observable<Map<string, Polygon>> {
        let zoneName = timeZone.name.replace(/\/|_/g, '-');

        return this.http.get(`${this.polygonsApiUrl}/${zoneName}`)
            .pipe(map(response => {
                let polygons: Map<string, Polygon> = new Map<string, Polygon>();

                if (!response.ok) {
                    return polygons;
                }

                let data = response.json();
                if (data.errorMessage) {
                    // Error from Lambda
                    Logger.error('There was a problem getting the hover zones from AWS Lambda', data.errorMessage);
                }

                for (let i = 0; i < data.polygons.length; i++) {
                    // Loop through all the points in the polygon
                    // Every 2 points are a lat & lng pair
                    let polygonData = data.polygons[i];
                    let coords = new Array<Vector>();

                    for (let j = 0; j < polygonData.points.length; j += 2) {
                        let points = polygonData.points.slice(j, j + 2);
                        let coord = this.getCoord(points[0], points[1], centerLat, centerLng, zoom, mapWidth);
                        coords.push(coord);
                    }

                    let polygon = polygons[polygonData.name];
                    if (polygon) {
                        polygon.coords = polygon.coords.concat(coords);
                    } else {
                        let centroidCoord = this.getCoord(polygonData.centroid[1], polygonData.centroid[0], centerLat, centerLng, zoom, mapWidth);
                        polygon = new Polygon(polygonData.name, coords, centroidCoord);
                        polygons[polygonData.name] = polygon;
                    }
                }

                return polygons;
            }));
    }

    private getCoord(lat: number, lng: number, centerLat: number, centerLng: number, zoom: number, mapWidth: number): Vector {
        let mercUnits = mapWidth / 4.7;
        let centerX = this.mercX(centerLng, zoom, mercUnits);
        let centerY = this.mercY(centerLat, zoom, mercUnits);
        let x = this.mercX(lng, zoom, mercUnits) - centerX;
        let y = this.mercY(lat, zoom, mercUnits) - centerY;
        return new Vector(x, y);
    }

    private mercX(lng: number, zoom: number, mercUnits: number): number {
        let lngInRad = this.toRadians(lng);
        let a = (mercUnits / Math.PI) * Math.pow(2, zoom);
        let b = lngInRad + Math.PI;
        return a * b;
    }

    private mercY(lat: number, zoom: number, mercUnits: number): number {
        let latInRad = this.toRadians(lat);
        let a = (mercUnits / Math.PI) * Math.pow(2, zoom);
        let b = Math.tan(Math.PI / 4 + latInRad / 2);
        let c = Math.PI - Math.log(b);
        return a * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    public handleError(error: Response | any) {
        let message;
        if (error == null) {
            message = 'There was a problem with your request, please try again.';
        } else if (error instanceof Response) {
            // The error came from the server. All server errors should typically come as a JSON object with an error property
            try {
                // Try to get the json error data
                const data = <any>error.json() || {};
                // If the data contains an error message, log that. Otherwise, show the error text
                message = data.message || error.text();
            } catch (e) {
                if (error.status === 401) {
                    message = 'Sorry, you\'re not allowed to do that.';
                } else if (error.status === 404) {
                    message = 'Could not find anything at your requested route, please try again.';
                } else if (error.status === 0) {
                    message = 'Something went wrong with your request, please try again.';
                } else {
                    error.text();
                }
                if (!message) {
                    // Something went wrong, maybe the error body could not be converted correctly
                    Logger.error(`Error in ColorZonesService: ${error.status} ${error.statusText}`);
                    message = 'Something went wrong with your request, please try again.';
                }
            }
        } else {
            // There was some other type of error
            message = 'There was a problem with your request, please try again.';
            Logger.error(`Error in ColorZonesService: ${error.message || error.toString()}`);
        }
        return Observable.throw({
            message: message,
            statusCode: error.status
        });
    }

}