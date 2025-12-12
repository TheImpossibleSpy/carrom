import { CONSTANTS } from './constants.js';

export class Board {
    constructor(ctx) {
        this.ctx = ctx;
        this.width = CONSTANTS.CANVAS_WIDTH;
        this.height = CONSTANTS.CANVAS_HEIGHT;
        this.boardSize = CONSTANTS.BOARD_SIZE;
        this.offset = (this.width - this.boardSize) / 2; // Margin size
    }

    draw() {
        // Draw Border
        this.ctx.fillStyle = CONSTANTS.BORDER_COLOR;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Playing Surface
        this.ctx.fillStyle = CONSTANTS.BOARD_COLOR;
        this.ctx.fillRect(this.offset, this.offset, this.boardSize, this.boardSize);

        // Draw Pockets
        this.drawPockets();

        // Draw Design/Patterns (Baselines, Center)
        this.drawMarkings();
    }

    drawPockets() {
        const r = CONSTANTS.POCKET_RADIUS;
        const corners = [
            { x: this.offset, y: this.offset },
            { x: this.width - this.offset, y: this.offset },
            { x: this.width - this.offset, y: this.height - this.offset },
            { x: this.offset, y: this.height - this.offset }
        ];

        this.ctx.fillStyle = CONSTANTS.POCKET_COLOR;
        corners.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw hole shadow/depth effect (optional)
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    drawMarkings() {
        const ctx = this.ctx;
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Center Design
        ctx.strokeStyle = '#8B4513'; // SaddleBrown
        ctx.lineWidth = 2;

        // Outer center circle
        ctx.beginPath();
        ctx.arc(cx, cy, CONSTANTS.COIN_RADIUS * 6.5, 0, Math.PI * 2);
        ctx.stroke();

        // Inner center circle (where coins are placed)
        ctx.beginPath();
        ctx.arc(cx, cy, CONSTANTS.COIN_RADIUS * 1.1, 0, Math.PI * 2);
        ctx.stroke();

        // Decorative patterns (simple star or circle)
        // ...

        // Baselines
        this.drawBaselines();

        // Diagonal arrows lines (approximate)
        ctx.beginPath();
        ctx.moveTo(this.offset + 40, this.offset + 40);
        ctx.lineTo(cx - 80, cy - 80);
        ctx.moveTo(this.width - this.offset - 40, this.offset + 40);
        ctx.lineTo(cx + 80, cy - 80);
        ctx.moveTo(this.width - this.offset - 40, this.height - this.offset - 40);
        ctx.lineTo(cx + 80, cy + 80);
        ctx.moveTo(this.offset + 40, this.height - this.offset - 40);
        ctx.lineTo(cx - 80, cy + 80);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawBaselines() {
        const ctx = this.ctx;
        const inset = CONSTANTS.BASELINE_OFFSET;
        const len = CONSTANTS.BASELINE_LENGTH;
        const start = (this.width - len) / 2;
        const end = start + len;

        const lines = [
            // Top
            { x1: start, y1: this.offset + inset, x2: end, y2: this.offset + inset },
            { x1: start, y1: this.offset + inset + 30, x2: end, y2: this.offset + inset + 30 },
            // Bottom
            { x1: start, y1: this.height - (this.offset + inset), x2: end, y2: this.height - (this.offset + inset) },
            { x1: start, y1: this.height - (this.offset + inset + 30), x2: end, y2: this.height - (this.offset + inset + 30) },
            // Left
            { x1: this.offset + inset, y1: start, x2: this.offset + inset, y2: end },
            { x1: this.offset + inset + 30, y1: start, x2: this.offset + inset + 30, y2: end },
            // Right
            { x1: this.width - (this.offset + inset), y1: start, x2: this.width - (this.offset + inset), y2: end },
            { x1: this.width - (this.offset + inset + 30), y1: start, x2: this.width - (this.offset + inset + 30), y2: end },
        ];

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        // Draw parallel lines
        lines.forEach(l => {
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
        });

        // Draw circles at ends of baselines
        const endCircles = [
            // Top
            {x: start, y: this.offset + inset + 15}, {x: end, y: this.offset + inset + 15},
            // Bottom
            {x: start, y: this.height - (this.offset + inset + 15)}, {x: end, y: this.height - (this.offset + inset + 15)},
            // Left
            {x: this.offset + inset + 15, y: start}, {x: this.offset + inset + 15, y: end},
            // Right
            {x: this.width - (this.offset + inset + 15), y: start}, {x: this.width - (this.offset + inset + 15), y: end},
        ];

        ctx.fillStyle = CONSTANTS.COLOR_RED;
        endCircles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, CONSTANTS.COIN_RADIUS, 0, Math.PI*2);
            ctx.stroke();
            // Fill with pattern or just circle? Official boards have red circles.
            // Let's keep it simple outline or fill red.
            // ctx.fill();
        });
    }
}
