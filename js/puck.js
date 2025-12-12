import { Entity } from './entity.js';
import { Vector } from './vector.js';
import { CONSTANTS } from './constants.js';

export class Puck extends Entity {
    constructor(x, y, isStriker = false, color = CONSTANTS.COLOR_WHITE) {
        super(x, y);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.isStriker = isStriker;
        this.radius = isStriker ? CONSTANTS.STRIKER_RADIUS : CONSTANTS.COIN_RADIUS;
        // Mass is proportional to area (or radius squared)
        this.mass = this.radius * this.radius;
        this.color = color;
        this.isQueen = (color === CONSTANTS.COLOR_RED);
        this.pocketed = false;

        // Visual rotation for rolling effect (optional polish)
        this.angle = 0;
    }

    draw(ctx) {
        if (this.pocketed) return;

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner detail for contrast
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
    }
}
