import { Vector } from '../utils/vector';

export class Polygon {
    name: string;
    coords: Vector[];
    centroidCoord: Vector;

    constructor(name: string, coords: Vector[], centroidCoord: Vector) {
        this.name = name;
        this.coords = coords;
        this.centroidCoord = centroidCoord;
    }
}