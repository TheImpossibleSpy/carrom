import { Vector } from './vector.js';
import { CONSTANTS } from './constants.js';

export class Physics {
    constructor(boardOffset, boardSize, audioHandler) {
        this.boardMinX = boardOffset;
        this.boardMinY = boardOffset;
        this.boardMaxX = boardOffset + boardSize;
        this.boardMaxY = boardOffset + boardSize;
        this.audio = audioHandler;
    }

    update(entities) {
        // 1. Move
        entities.forEach(entity => {
            if (entity.pocketed) return;

            // Apply friction
            entity.velocity = entity.velocity.mult(CONSTANTS.FRICTION);

            // Stop if too slow
            if (entity.velocity.mag() < CONSTANTS.STOP_THRESHOLD) {
                entity.velocity = new Vector(0, 0);
            }

            // Update position
            entity.position = entity.position.add(entity.velocity);

            // Wall Collisions
            if (this.checkWallCollisions(entity)) {
                if (this.audio) this.audio.playWall();
            }
        });

        // 2. Resolve Collisions (Circle-Circle)
        // Check every pair
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];
                if (a.pocketed || b.pocketed) continue;

                if (this.checkEntityCollision(a, b)) {
                    if (this.audio) this.audio.playCollision();
                }
            }
        }
    }

    checkWallCollisions(entity) {
        const r = entity.radius;
        const e = CONSTANTS.WALL_BOUNCE;

        let collided = false;

        // Left Wall
        if (entity.position.x - r < this.boardMinX) {
            entity.position.x = this.boardMinX + r;
            entity.velocity.x *= -e;
            collided = true;
        }
        // Right Wall
        else if (entity.position.x + r > this.boardMaxX) {
            entity.position.x = this.boardMaxX - r;
            entity.velocity.x *= -e;
            collided = true;
        }

        // Top Wall
        if (entity.position.y - r < this.boardMinY) {
            entity.position.y = this.boardMinY + r;
            entity.velocity.y *= -e;
            collided = true;
        }
        // Bottom Wall
        else if (entity.position.y + r > this.boardMaxY) {
            entity.position.y = this.boardMaxY - r;
            entity.velocity.y *= -e;
            collided = true;
        }

        return collided;
    }

    checkEntityCollision(a, b) {
        const distVec = a.position.sub(b.position);
        const dist = distVec.mag();
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
            // Collision Detected
            const normal = distVec.normalize();

            // 1. Correct Overlap
            const totalMass = a.mass + b.mass;
            const overlap = minDist - dist;

            // Move apart
            const m1Ratio = b.mass / totalMass;
            const m2Ratio = a.mass / totalMass;

            a.position = a.position.add(normal.mult(overlap * m1Ratio));
            b.position = b.position.sub(normal.mult(overlap * m2Ratio));

            // 2. Velocity Resolution (Elastic Collision)
            const relVel = a.velocity.sub(b.velocity);
            const velAlongNormal = relVel.dot(normal);

            // Do not resolve if velocities are separating
            if (velAlongNormal > 0) return;

            // Restitution (bounciness)
            const e = CONSTANTS.PUCK_BOUNCE;

            // Impulse scalar
            let j = -(1 + e) * velAlongNormal;
            j /= (1 / a.mass + 1 / b.mass);

            // Apply impulse
            const impulse = normal.mult(j);
            a.velocity = a.velocity.add(impulse.div(a.mass));
            b.velocity = b.velocity.sub(impulse.div(b.mass));

            return true;
        }
        return false;
    }
}
