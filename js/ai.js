import { Vector } from './vector.js';
import { CONSTANTS } from './constants.js';

export class AI {
    constructor(gameManager) {
        this.game = gameManager;
        this.board = gameManager.board;
        this.pockets = [
            new Vector(this.board.offset, this.board.offset),
            new Vector(this.board.width - this.board.offset, this.board.offset),
            new Vector(this.board.width - this.board.offset, this.board.height - this.board.offset),
            new Vector(this.board.offset, this.board.height - this.board.offset)
        ];
    }

    takeTurn() {
        // Delay to simulate thinking
        setTimeout(() => {
            const shot = this.calculateBestShot();
            if (shot) {
                // Move striker to calculated position
                this.game.striker.position.x = shot.position.x;

                // Apply difficulty error
                let errorDeg = 0;
                switch(this.game.difficulty) {
                    case 'easy': errorDeg = 5; break;
                    case 'medium': errorDeg = 2; break;
                    case 'hard': errorDeg = 0.5; break;
                }

                // Random error between -errorDeg and +errorDeg
                const angle = (Math.random() - 0.5) * 2 * (errorDeg * Math.PI / 180);
                const noisyVelocity = shot.velocity.rotate(angle);

                // Shoot
                this.game.handleShot(noisyVelocity);
            } else {
                // Random shot if no good shot found
                this.game.handleShot(new Vector(0, 20)); // Just shoot forward
            }
        }, 1500);
    }

    calculateBestShot() {
        const myColor = this.game.aiColor;
        const targets = this.game.entities.filter(e =>
            !e.pocketed && !e.isStriker &&
            (e.color === myColor || (e.isQueen && !this.game.queenPocketed))
        );

        if (targets.length === 0) return null;

        // Try to find a direct shot for each target to each pocket
        // This is a simplified "Direct Cut" calculation

        // 1. For each target coin
        for (let coin of targets) {
            // 2. For each pocket
            for (let pocket of this.pockets) {

                // Vector from coin to pocket
                const coinToPocket = pocket.sub(coin.position);
                const distanceToPocket = coinToPocket.mag();

                // Ideal impact point on the coin:
                // To send coin to pocket, striker must hit it on the opposite side
                const impactDir = coinToPocket.normalize().mult(-1);
                const impactPoint = coin.position.add(impactDir.mult(coin.radius + CONSTANTS.STRIKER_RADIUS));

                // Check if impact point is within Striker's baseline bounds
                // AI baseline is at Top (low Y)
                // Baseline Y is:
                const baselineY = CONSTANTS.BASELINE_OFFSET + this.board.offset;

                // We need to find a striker position X on the baseline that can hit this impact point
                // And the vector from striker to impact point must be aligned such that:
                // The collision normal sends the coin to the pocket.

                // Actually, "Cut Shot" logic:
                // Target direction: Coin -> Pocket
                // Ghost ball position: Impact Point.
                // Striker must aim at Impact Point.

                // Calculate required Striker Position on Baseline
                // Vector from ImpactPoint to Baseline?
                // Any point on baseline works if we have clear line of sight.
                // Let's iterate possible striker positions (e.g., center, left, right)
                // and see if the line to ImpactPoint is clear.

                // Better: Pick the Striker Position that makes the cut angle easiest (straightest).
                // Or just pick a valid X closest to the Impact Point's X.

                let strikerX = impactPoint.x;

                // Clamp to baseline limits
                const minX = this.board.offset + CONSTANTS.BASELINE_OFFSET;
                const maxX = this.board.width - (this.board.offset + CONSTANTS.BASELINE_OFFSET);

                if (strikerX < minX) strikerX = minX;
                if (strikerX > maxX) strikerX = maxX;

                const strikerPos = new Vector(strikerX, baselineY);

                // Check vector from Striker to ImpactPoint
                const shotVec = impactPoint.sub(strikerPos);

                // Check for obstacles (simplified: check if any other coin is on this line)
                if (this.isPathClear(strikerPos, impactPoint, [coin])) {
                     // Check if path from Coin to Pocket is clear
                     if (this.isPathClear(coin.position, pocket, [])) {
                         // Found a valid shot!
                         // Calculate velocity
                         // Power needed proportional to distance?
                         const power = 30 + (shotVec.mag() + distanceToPocket) / 10;
                         const velocity = shotVec.normalize().mult(Math.min(power, 60)); // Cap power

                         return {
                             position: strikerPos,
                             velocity: velocity
                         };
                     }
                }
            }
        }

        return null;
    }

    isPathClear(start, end, ignoreEntities) {
        // Simple line vs circle intersection check for all entities
        const lineVec = end.sub(start);
        const lineLen = lineVec.mag();
        const lineDir = lineVec.normalize();

        for (let e of this.game.entities) {
            if (e.pocketed || e.isStriker) continue;
            if (ignoreEntities.includes(e)) continue;

            // Check distance of point e.position to line segment start-end
            const toEntity = e.position.sub(start);
            const projection = toEntity.dot(lineDir);

            if (projection > 0 && projection < lineLen) {
                // Closest point on line
                const closestPoint = start.add(lineDir.mult(projection));
                const dist = closestPoint.dist(e.position);

                if (dist < e.radius * 2) { // 2x Radius buffer
                    return false;
                }
            }
        }
        return true;
    }
}
