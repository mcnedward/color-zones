import { Polygon } from './polygon';
import { BoundingBox } from './boundingBox';
import { Vector } from '../utils/vector';

export class TimeZone {
    name: string;
    coords: Vector[];
    polygons: Polygon[];
    centroidPolygon: Polygon;
    boundingBox: BoundingBox;

    constructor(name: string, coords: Vector[]) {
        this.name = name;
        this.coords = coords;
    }

    matchesId(idToMatch: string): boolean {
        const regex = /\/|_/g;
        let id = this.name.replace(regex, '-');
        return id === idToMatch.replace(regex, '-');
    }

}