import { Vector } from '../utils/vector';

export class BoundingBox {
    name: string;
    coordMin: Vector;
    coordMax: Vector;

    constructor(name: string, coordMin: Vector, coordMax: Vector) {
        this.name = name;
        this.coordMin = coordMin;
        this.coordMax = coordMax;
    }
}