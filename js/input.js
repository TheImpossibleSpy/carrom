import { Vector } from './vector.js';
import { CONSTANTS } from './constants.js';

export class InputHandler {
    constructor(canvas, striker, board) {
        this.canvas = canvas;
        this.striker = striker;
        this.board = board;

        this.isDragging = false;
        this.isAiming = false;

        this.dragStart = null;
        this.dragCurrent = null;

        // This callback will be set by the main game to trigger a shot
        this.onShoot = null;

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));

        this.canvas.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => this.handleMove(e.touches[0]));
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return new Vector(
            (e.clientX - rect.left) * (this.canvas.width / rect.width),
            (e.clientY - rect.top) * (this.canvas.height / rect.height)
        );
    }

    handleStart(e) {
        if (!this.striker.active) return; // Should check if it's user's turn and state is Aiming

        const pos = this.getMousePos(e);

        // Check if clicking near striker to start aiming
        // OR allow clicking anywhere to drag-aim style like Angry Birds?
        // Let's implement Angry Birds style: Drag anywhere to pull back.
        // OR: Drag striker left/right to position, then drag back to shoot.

        // Mode 1: Positioning (if near baseline and not shot yet)
        // Mode 2: Aiming (drag away from striker to create impulse vector)

        // Let's check distance to striker.
        if (pos.dist(this.striker.position) < this.striker.radius * 2) {
            this.isDragging = true;
            this.dragStart = pos;
            this.dragCurrent = pos;
        }
    }

    handleMove(e) {
        if (!this.isDragging) return;

        const pos = this.getMousePos(e);
        this.dragCurrent = pos;
    }

    handleEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;

        // Calculate vector
        const pullVector = this.dragStart.sub(this.dragCurrent);
        const mag = pullVector.mag();

        if (mag > 10) { // Min threshold
             // Scale power
             const maxPull = 150;
             const power = Math.min(mag, maxPull) / 10; // Scaling factor
             const dir = pullVector.normalize();

             if (this.onShoot) {
                 this.onShoot(dir.mult(power * 2)); // *2 is speed multiplier
             }
        }
    }

    // Call this from main loop to draw aiming line
    draw(ctx) {
        if (this.isDragging && this.dragStart && this.dragCurrent) {
            ctx.beginPath();
            ctx.moveTo(this.striker.position.x, this.striker.position.y);

            // Draw line in opposite direction of drag (where it will shoot)
            const pullVector = this.dragStart.sub(this.dragCurrent);
            const maxPull = 150;
            const mag = Math.min(pullVector.mag(), maxPull);
            const dir = pullVector.normalize();

            const endPos = this.striker.position.add(dir.mult(mag * 2)); // Visual length

            ctx.lineTo(endPos.x, endPos.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw drag indicator
            ctx.beginPath();
            ctx.moveTo(this.dragStart.x, this.dragStart.y);
            ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.stroke();
        }
    }
}
