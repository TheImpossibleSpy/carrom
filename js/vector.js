export class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    div(n) {
        if (n === 0) return new Vector(0, 0);
        return new Vector(this.x / n, this.y / n);
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const m = this.mag();
        if (m === 0) return new Vector(0, 0);
        return this.div(m);
    }

    dist(v) {
        return this.sub(v).mag();
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    limit(max) {
        const m = this.mag();
        if (m > max) {
            return this.normalize().mult(max);
        }
        return this.copy();
    }
}
