import { Vector } from './vector.js';

export class Entity {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.active = true;
    }
}
